import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/User.schema';
import { OrdersService } from '../orders/orders.service';
import { AppGateway } from '../sockets/app/app.gateway';
import { Redis } from 'ioredis';
export declare class RidersService {
    private userModel;
    private ordersService;
    private appGateway;
    private redisClient;
    constructor(userModel: Model<UserDocument>, ordersService: OrdersService, appGateway: AppGateway, redisClient: Redis);
    findAll(): Promise<(import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    updateStatus(id: string, status: string): Promise<(import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    updateLocation(data: {
        riderId: string;
        lat: number;
        lng: number;
    }): Promise<{
        success: boolean;
    }>;
}
