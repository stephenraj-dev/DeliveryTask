import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true })
  pickupAddress: string;

  @Prop({ required: true })
  dropAddress: string;

  @Prop({ required: true })
  packageDetails: string;

  @Prop({ required: true, enum: ['normal', 'urgent'] })
  priority: string;

  @Prop()
  clientPhone?: string;

  @Prop({ required: true, enum: ['pending', 'assigned', 'picked_up', 'delivered', 'failed'], default: 'pending' })
  status: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  clientId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  riderId?: mongoose.Types.ObjectId;

  @Prop()
  proofPhoto?: string; // base64 or URL

  @Prop()
  timeTaken?: number; // in minutes (set on delivery)

  @Prop()
  assignedAt?: Date;

  @Prop()
  pickedUpAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  zone?: string; // For analytics (optional derived field)

  @Prop()
  failureReason?: string;

  @Prop()
  handoverNote?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
