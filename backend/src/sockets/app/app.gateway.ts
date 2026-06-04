import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinAdmin')
  handleJoinAdmin(@ConnectedSocket() client: Socket) {
    client.join('admin');
    return { event: 'joined', data: 'admin room' };
  }

  emitOrderAssigned(orderId: string, riderName: string, estimatedTime?: string) {
    this.server.emit('order_assigned', { orderId, riderName, estimatedTime });
  }

  emitOrderStatusChanged(orderId: string, status: string) {
    this.server.emit('order_status_changed', { orderId, status });
  }

  emitRiderOffline(riderId: string, reassignedOrders: any[]) {
    this.server.to('admin').emit('rider_offline', { riderId, reassignedOrders });
  }

  emitLocationUpdate(riderId: string, lat: number, lng: number) {
    this.server.to('admin').emit('location_update', { riderId, lat, lng });
  }
}
