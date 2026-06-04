import { Model } from 'mongoose';
import { OrderDocument } from '../schemas/Order.schema';
import { Redis } from 'ioredis';
export declare class AnalyticsService {
    private orderModel;
    private redisClient;
    constructor(orderModel: Model<OrderDocument>, redisClient: Redis);
    getSummary(): Promise<any>;
    invalidateCache(): Promise<void>;
}
