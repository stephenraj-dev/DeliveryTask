"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const Order_schema_1 = require("../schemas/Order.schema");
const User_schema_1 = require("../schemas/User.schema");
const app_gateway_1 = require("../sockets/app/app.gateway");
const notifications_service_1 = require("../notifications/notifications.service");
const ioredis_1 = require("ioredis");
let OrdersService = class OrdersService {
    orderModel;
    userModel;
    appGateway;
    notificationsService;
    redisClient;
    constructor(orderModel, userModel, appGateway, notificationsService, redisClient) {
        this.orderModel = orderModel;
        this.userModel = userModel;
        this.appGateway = appGateway;
        this.notificationsService = notificationsService;
        this.redisClient = redisClient;
    }
    async create(data) {
        const riders = await this.userModel.find({ role: 'rider', status: 'available' });
        if (riders.length === 0)
            throw new common_1.ServiceUnavailableException({ message: 'No riders available', retryAfter: 60 });
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
        await this.userModel.findByIdAndUpdate(assignedRider._id, { $inc: { activeOrders: 1 } });
        return order;
    }
    async findAll(query) { return this.orderModel.find(query).populate('riderId', 'name status'); }
    async findByClient(clientId) {
        const docs = await this.orderModel.find({ clientId }).populate('riderId', 'name status').sort({ createdAt: -1 });
        console.log(`findByClient(${clientId}) found ${docs.length} docs`);
        return docs;
    }
    async findByRider(riderId) {
        const docs = await this.orderModel.find({ riderId }).populate('clientId', 'name').sort({ createdAt: -1 });
        console.log(`findByRider(${riderId}) found ${docs.length} docs`);
        return docs;
    }
    async getClientStats(clientId) {
        const result = await this.orderModel.aggregate([
            { $match: { clientId: new mongoose_2.Types.ObjectId(clientId) } },
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
    async getRiderStats(riderId) {
        const result = await this.orderModel.aggregate([
            { $match: { riderId: new mongoose_2.Types.ObjectId(riderId) } },
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
    async updateStatus(id, data, riderId) {
        const order = await this.orderModel.findById(id).populate('clientId', 'name');
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.riderId?.toString() !== riderId) {
            throw new common_1.ForbiddenException('You are not assigned to this order');
        }
        const currentStatus = order.status;
        const nextStatus = data.status;
        const validFlow = {
            'pending': ['assigned'],
            'assigned': ['picked_up'],
            'picked_up': ['delivered', 'failed'],
            'delivered': [],
            'failed': []
        };
        if (!validFlow[currentStatus]?.includes(nextStatus)) {
            throw new common_1.BadRequestException(`Invalid status flow from ${currentStatus} to ${nextStatus}`);
        }
        order.status = nextStatus;
        const clientName = order.clientId.name || 'Client';
        if (nextStatus === 'picked_up') {
            order.pickedUpAt = new Date();
            this.notificationsService.notifyClient(clientName, `Your order ${id} is picked up`);
        }
        if (nextStatus === 'delivered') {
            order.deliveredAt = new Date();
            if (order.assignedAt) {
                order.timeTaken = Math.round((order.deliveredAt.getTime() - order.assignedAt.getTime()) / 60000);
            }
            if (data.proofPhoto)
                order.proofPhoto = data.proofPhoto;
            await this.userModel.findByIdAndUpdate(riderId, { $inc: { activeOrders: -1, totalDelivered: 1 } });
            this.redisClient.del('analytics:summary').catch(() => { });
        }
        if (nextStatus === 'failed') {
            if (data.failureReason)
                order.failureReason = data.failureReason;
            await this.userModel.findByIdAndUpdate(riderId, { $inc: { activeOrders: -1, totalFailed: 1 } });
            this.notificationsService.notifyAdmin(`Order ${id} failed`);
            this.redisClient.del('analytics:summary').catch(() => { });
        }
        await order.save();
        this.appGateway.emitOrderStatusChanged(order._id.toString(), nextStatus);
        return order;
    }
    async reassignSingleOrder(order) {
        const riders = await this.userModel.find({ role: 'rider', status: 'available' });
        const nextRider = riders.sort((a, b) => (a.activeOrders || 0) - (b.activeOrders || 0))[0];
        if (nextRider) {
            order.riderId = nextRider._id;
            order.assignedAt = new Date();
            order.status = 'assigned';
            await order.save();
            this.appGateway.emitOrderAssigned(order._id.toString(), nextRider.name);
            this.notificationsService.notifyRider(nextRider.name, `New order ${order._id.toString()} assigned to you`);
            await this.userModel.findByIdAndUpdate(nextRider._id, { $inc: { activeOrders: 1 } });
        }
        else {
            order.status = 'pending';
            order.riderId = undefined;
            await order.save();
        }
    }
    async reassignOrdersFromRider(riderId) {
        const orders = await this.orderModel.find({ riderId, status: { $in: ['assigned', 'picked_up'] } });
        if (orders.length === 0)
            return;
        const reassignedOrdersList = [];
        for (const order of orders) {
            const riders = await this.userModel.find({ role: 'rider', status: 'available', _id: { $ne: new mongoose_2.Types.ObjectId(riderId) } });
            const nextRider = riders.sort((a, b) => (a.activeOrders || 0) - (b.activeOrders || 0))[0];
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
            }
            else {
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
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(Order_schema_1.Order.name)),
    __param(1, (0, mongoose_1.InjectModel)(User_schema_1.User.name)),
    __param(4, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        app_gateway_1.AppGateway,
        notifications_service_1.NotificationsService,
        ioredis_1.Redis])
], OrdersService);
//# sourceMappingURL=orders.service.js.map