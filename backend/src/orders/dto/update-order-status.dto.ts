import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsEnum(['pending', 'assigned', 'picked_up', 'delivered', 'failed'])
  status: string;

  @IsOptional()
  @IsString()
  proofPhoto?: string;

  @IsOptional()
  @IsString()
  failureReason?: string;
}
