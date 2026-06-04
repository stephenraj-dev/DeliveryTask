import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinAdmin(client: Socket): {
        event: string;
        data: string;
    };
    emitOrderAssigned(orderId: string, riderName: string, estimatedTime?: string): void;
    emitOrderStatusChanged(orderId: string, status: string): void;
    emitRiderOffline(riderId: string, reassignedOrders: any[]): void;
    emitLocationUpdate(riderId: string, lat: number, lng: number): void;
}
