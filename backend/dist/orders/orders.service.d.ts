import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../schemas/Order.schema';
import { UserDocument } from '../schemas/User.schema';
import { AppGateway } from '../sockets/app/app.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { Redis } from 'ioredis';
export declare class OrdersService {
    private orderModel;
    private userModel;
    private appGateway;
    private notificationsService;
    private redisClient;
    constructor(orderModel: Model<OrderDocument>, userModel: Model<UserDocument>, appGateway: AppGateway, notificationsService: NotificationsService, redisClient: Redis);
    create(data: any): Promise<import("mongoose").Document<unknown, {}, OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findAll(query: any): Promise<(import("mongoose").Document<unknown, {}, OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    findByClient(clientId: string): Promise<(import("mongoose").Document<unknown, {}, OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    findByRider(riderId: string): Promise<(import("mongoose").Document<unknown, {}, OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    getClientStats(clientId: string): Promise<any>;
    getRiderStats(riderId: string): Promise<{
        total: any;
        delivered: any;
        failed: any;
        performance: number;
    }>;
    updateStatus(id: string, data: any, riderId: string): Promise<import("mongoose").Document<unknown, {}, OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    reassignSingleOrder(order: OrderDocument): Promise<void>;
    reassignOrdersFromRider(riderId: string): Promise<void>;
}
