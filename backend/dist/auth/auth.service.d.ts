import { OnApplicationBootstrap } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserDocument } from '../schemas/User.schema';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService implements OnApplicationBootstrap {
    private userModel;
    private jwtService;
    constructor(userModel: Model<UserDocument>, jwtService: JwtService);
    onApplicationBootstrap(): Promise<void>;
    register(data: any): Promise<{
        token: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            role: string;
            name: string;
            status: string | undefined;
        };
    }>;
    login(data: any): Promise<{
        token: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            role: string;
            name: string;
            status: string | undefined;
        };
    }>;
}
