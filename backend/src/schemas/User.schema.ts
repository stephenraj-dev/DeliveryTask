import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, enum: ['admin', 'client', 'rider'] })
  role: string;

  // Rider specific fields
  @Prop({ enum: ['available', 'busy', 'offline'], default: 'offline' })
  status?: string;

  @Prop({ default: 0 })
  activeOrders?: number;

  @Prop({ default: 0 })
  totalDelivered?: number;

  @Prop({ default: 0 })
  totalFailed?: number;

  @Prop({ default: 0 })
  avgDeliveryTime?: number; // in minutes
}

export const UserSchema = SchemaFactory.createForClass(User);
