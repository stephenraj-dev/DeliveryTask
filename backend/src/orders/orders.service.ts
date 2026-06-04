import { Injectable, ServiceUnavailableException, NotFoundException, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../schemas/Order.schema';
import { User, UserDocument } from '../schemas/User.schema';
import { AppGateway } from '../sockets/app/app.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { Redis } from 'ioredis';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private appGateway: AppGateway,
    private notificationsService: NotificationsService,
    @Inject('REDIS_CLIENT') private redisClient: Redis
  ) {}

  async create(data: any) {
    const riders = await this.userModel.find({ role: 'rider', status: 'available' });
    if (riders.length === 0) throw new ServiceUnavailableException({ message: 'No riders available', retryAfter: 60 });
    
    // Dynamically calculate active orders to prevent out-of-sync counter issues
    const riderCounts = await Promise.all(riders.map(async (rider) => {
      const activeCount = await this.orderModel.countDocuments({ riderId: rider._id, status: { $in: ['assigned', 'picked_up'] } });
      return { rider, activeCount };
    }));

    riderCounts.sort((a, b) => a.activeCount - b.activeCount);
    const assignedRider = riderCounts[0].rider;

    const order = new this.orderModel({ ...data, status: 'assigned', riderId: assignedRider._id, assignedAt: new Date() });
    await order.save();
    
    this.appGateway.emitOrderAssigned(order._id.toString(), assignedRider.name);
    this.notificationsService.notifyRider(assignedRider.name, `New order ${order._id.toString()} assigned to you`);
    
    // Increment active orders
    await this.userModel.findByIdAndUpdate(assignedRider._id, { $inc: { activeOrders: 1 } });
    
    return order;
  }

  async findAll(query: any) { return this.orderModel.find(query).populate('riderId', 'name status'); }
  async findByClient(clientId: string) { 
    const docs = await this.orderModel.find({ clientId }).populate('riderId', 'name status').sort({ createdAt: -1 }); 
    console.log(`findByClient(${clientId}) found ${docs.length} docs`);
    return docs;
  }
  async findByRider(riderId: string) { 
    const docs = await this.orderModel.find({ riderId }).populate('clientId', 'name').sort({ createdAt: -1 }); 
    console.log(`findByRider(${riderId}) found ${docs.length} docs`);
    return docs;
  }

  async getClientStats(clientId: string) {
    const result = await this.orderModel.aggregate([
      { $match: { clientId: new Types.ObjectId(clientId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          waitingPickup: { $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] } },
          waitingDelivery: { $sum: { $cond: [{ $eq: ['$status', 'picked_up'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        },
      },
    ]);
    return result[0] || { total: 0, waitingPickup: 0, waitingDelivery: 0, failed: 0 };
  }
  
  async getRiderStats(riderId: string) {
    const result = await this.orderModel.aggregate([
      { $match: { riderId: new Types.ObjectId(riderId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        },
      },
    ]);
    const stats = result[0] || { total: 0, delivered: 0, failed: 0 };
    const performance = stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0;
    return { 
      total: stats.total, 
      delivered: stats.delivered, 
      failed: stats.failed, 
      performance 
    };
  }
  
  async updateStatus(id: string, data: any, riderId: string) {
    const order = await this.orderModel.findById(id).populate('clientId', 'name');
    if (!order) throw new NotFoundException('Order not found');
    
    if (order.riderId?.toString() !== riderId) {
      throw new ForbiddenException('You are not assigned to this order');
    }

    const currentStatus = order.status;
    const nextStatus = data.status;

    // Strict status flow
    const validFlow: Record<string, string[]> = {
      'pending': ['assigned'],
      'assigned': ['picked_up'],
      'picked_up': ['delivered', 'failed'],
      'delivered': [],
      'failed': []
    };

    if (!validFlow[currentStatus]?.includes(nextStatus)) {
      throw new BadRequestException(`Invalid status flow from ${currentStatus} to ${nextStatus}`);
    }

    order.status = nextStatus;
    const clientName = (order.clientId as any).name || 'Client';

    if (nextStatus === 'picked_up') {
      order.pickedUpAt = new Date();
      this.notificationsService.notifyClient(clientName, `Your order ${id} is picked up`);
    }

    if (nextStatus === 'delivered') {
      order.deliveredAt = new Date();
      if (order.assignedAt) {
        order.timeTaken = Math.round((order.deliveredAt.getTime() - order.assignedAt.getTime()) / 60000);
      }
      if (data.proofPhoto) order.proofPhoto = data.proofPhoto;
      
      await this.userModel.findByIdAndUpdate(riderId, { $inc: { activeOrders: -1, totalDelivered: 1 } });
      this.redisClient.del('analytics:summary').catch(() => {});
    }

    if (nextStatus === 'failed') {
      if (data.failureReason) order.failureReason = data.failureReason;
      await this.userModel.findByIdAndUpdate(riderId, { $inc: { activeOrders: -1, totalFailed: 1 } });
      this.notificationsService.notifyAdmin(`Order ${id} failed`);
      this.redisClient.del('analytics:summary').catch(() => {});
    }

    await order.save();
    this.appGateway.emitOrderStatusChanged(order._id.toString(), nextStatus);

    return order;
  }

  async reassignSingleOrder(order: OrderDocument) {
    const riders = await this.userModel.find({ role: 'rider', status: 'available' });
    const nextRider = riders.sort((a, b) => (a.activeOrders||0) - (b.activeOrders||0))[0];

    if (nextRider) {
      order.riderId = nextRider._id;
      order.assignedAt = new Date();
      order.status = 'assigned';
      await order.save();
      this.appGateway.emitOrderAssigned(order._id.toString(), nextRider.name);
      this.notificationsService.notifyRider(nextRider.name, `New order ${order._id.toString()} assigned to you`);
      await this.userModel.findByIdAndUpdate(nextRider._id, { $inc: { activeOrders: 1 } });
    } else {
      order.status = 'pending';
      order.riderId = undefined;
      await order.save();
    }
  }

  async reassignOrdersFromRider(riderId: string) {
    const orders = await this.orderModel.find({ riderId, status: { $in: ['assigned', 'picked_up'] } });
    if (orders.length === 0) return;

    const reassignedOrdersList: { orderId: string; newRiderId: string }[] = [];

    for (const order of orders) {
      const riders = await this.userModel.find({ role: 'rider', status: 'available', _id: { $ne: new Types.ObjectId(riderId) } });
      const nextRider = riders.sort((a, b) => (a.activeOrders||0) - (b.activeOrders||0))[0];

      if (nextRider) {
        order.riderId = nextRider._id;
        order.assignedAt = new Date();
        if (order.status === 'picked_up') {
          order.handoverNote = 'Order handed over to this rider because previous rider went offline.';
        }
        order.status = 'assigned';
        await order.save();
        
        await this.userModel.findByIdAndUpdate(nextRider._id, { $inc: { activeOrders: 1 } });
        await this.userModel.findByIdAndUpdate(riderId, { $inc: { activeOrders: -1 } });
        
        this.appGateway.emitOrderAssigned(order._id.toString(), nextRider.name);
        this.notificationsService.notifyRider(nextRider.name, `New order ${order._id.toString()} assigned to you`);
        
        reassignedOrdersList.push({ orderId: order._id.toString(), newRiderId: nextRider._id.toString() });
      } else {
        order.status = 'pending';
        order.riderId = undefined;
        await order.save();
        await this.userModel.findByIdAndUpdate(riderId, { $inc: { activeOrders: -1 } });
      }
    }
    
    if (reassignedOrdersList.length > 0) {
      this.appGateway.emitRiderOffline(riderId, reassignedOrdersList);
    }
  }
}