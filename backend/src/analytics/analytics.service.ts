import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../schemas/Order.schema';
import { Redis } from 'ioredis';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @Inject('REDIS_CLIENT') private redisClient: Redis
  ) {}

  async getSummary() {
    const cached = await this.redisClient.get('analytics:summary');
    if (cached) {
      return JSON.parse(cached);
    }

    const totalOrders = await this.orderModel.countDocuments();
    const delivered = await this.orderModel.countDocuments({ status: 'delivered' });
    const failed = await this.orderModel.countDocuments({ status: 'failed' });
    const pending = totalOrders - delivered - failed;
    const successRate = totalOrders ? (delivered / totalOrders) * 100 : 0;

    const avgTimeRes = await this.orderModel.aggregate([
      { $match: { status: 'delivered', timeTaken: { $exists: true } } },
      { $group: { _id: null, avgTime: { $avg: '$timeTaken' } } }
    ]);
    const avgDeliveryTime = avgTimeRes[0]?.avgTime || 0;

    const riderPerformance = await this.orderModel.aggregate([
      { $match: { status: { $in: ['delivered', 'failed'] } } },
      {
        $group: {
          _id: '$riderId',
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          avgTime: { $avg: '$timeTaken' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'rider'
        }
      },
      { $unwind: '$rider' },
      {
        $project: {
          _id: 0,
          riderName: '$rider.name',
          delivered: 1,
          failed: 1,
          avgTime: 1,
          rating: { $literal: 4.5 } // mocked rating
        }
      }
    ]);

    const zoneWiseSummary = await this.orderModel.aggregate([
      { $match: { zone: { $exists: true } } },
      {
        $group: {
          _id: '$zone',
          totalOrders: { $sum: 1 },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          zone: '$_id',
          totalOrders: 1,
          successRate: { $multiply: [{ $divide: ['$delivered', { $max: ['$totalOrders', 1] }] }, 100] }
        }
      }
    ]);

    const summary = {
      totalOrders,
      delivered,
      failed,
      pending,
      avgDeliveryTime,
      successRate,
      peakHour: '18:00 - 19:00', // Mocked peak hour for now
      riderPerformance,
      zoneWiseSummary
    };

    await this.redisClient.set('analytics:summary', JSON.stringify(summary), 'EX', 60);
    return summary;
  }

  async invalidateCache() {
    await this.redisClient.del('analytics:summary');
  }
}