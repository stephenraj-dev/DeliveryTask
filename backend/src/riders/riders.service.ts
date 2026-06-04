import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/User.schema';
import { OrdersService } from '../orders/orders.service';
import { AppGateway } from '../sockets/app/app.gateway';
import { Redis } from 'ioredis';

@Injectable()
export class RidersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private ordersService: OrdersService,
    private appGateway: AppGateway,
    @Inject('REDIS_CLIENT') private redisClient: Redis
  ) {}

  async findAll() { return this.userModel.find({ role: 'rider' }); }
  
  async updateStatus(id: string, status: string) {
    const rider = await this.userModel.findByIdAndUpdate(id, { status }, { new: true });
    if (status === 'offline') {
      await this.ordersService.reassignOrdersFromRider(id);
    }
    return rider;
  }

  async updateLocation(data: { riderId: string, lat: number, lng: number }) {
    await this.redisClient.set(`rider_location:${data.riderId}`, JSON.stringify({ lat: data.lat, lng: data.lng }), 'EX', 3600);
    this.appGateway.emitLocationUpdate(data.riderId, data.lat, data.lng);
    return { success: true };
  }
}