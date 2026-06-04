import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    createOrder(body: CreateOrderDto, req: any): Promise<import("mongoose").Document<unknown, {}, import("../schemas/Order.schema").OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../schemas/Order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    getAll(query: any): Promise<(import("mongoose").Document<unknown, {}, import("../schemas/Order.schema").OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../schemas/Order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    getMy(req: any): Promise<(import("mongoose").Document<unknown, {}, import("../schemas/Order.schema").OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../schemas/Order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    getMyStats(req: any): Promise<any>;
    getAssigned(req: any): Promise<(import("mongoose").Document<unknown, {}, import("../schemas/Order.schema").OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../schemas/Order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    getAssignedStats(req: any): Promise<{
        total: any;
        delivered: any;
        failed: any;
        performance: number;
    }>;
    updateStatus(id: string, body: UpdateOrderStatusDto, req: any): Promise<import("mongoose").Document<unknown, {}, import("../schemas/Order.schema").OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../schemas/Order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
