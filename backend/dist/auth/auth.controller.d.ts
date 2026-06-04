import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(body: RegisterDto): Promise<{
        token: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            role: string;
            name: string;
            status: string | undefined;
        };
    }>;
    login(body: LoginDto): Promise<{
        token: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            role: string;
            name: string;
            status: string | undefined;
        };
    }>;
}
