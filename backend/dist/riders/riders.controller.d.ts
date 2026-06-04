import { RidersService } from './riders.service';
import { UpdateRiderStatusDto } from './dto/update-rider-status.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
export declare class RidersController {
    private readonly ridersService;
    constructor(ridersService: RidersService);
    getAll(): Promise<(import("mongoose").Document<unknown, {}, import("../schemas/User.schema").UserDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../schemas/User.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    updateStatus(id: string, body: UpdateRiderStatusDto, req: any): Promise<(import("mongoose").Document<unknown, {}, import("../schemas/User.schema").UserDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../schemas/User.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    updateLocation(body: UpdateLocationDto, req: any): Promise<{
        success: boolean;
    }>;
}
