import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  notifyClient(clientName: string, message: string) {
    console.log(`[NOTIFY] Client ${clientName}: ${message}`);
  }

  notifyRider(riderName: string, message: string) {
    console.log(`[NOTIFY] Rider ${riderName}: ${message}`);
  }

  notifyAdmin(message: string) {
    console.log(`[NOTIFY] Admin: ${message}`);
  }

  log(message: string) {
    console.log(`[NOTIFY] ${message}`);
  }
}