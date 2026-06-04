import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  pickupAddress: string;

  @IsNotEmpty()
  @IsString()
  dropAddress: string;

  @IsNotEmpty()
  @IsString()
  packageDetails: string;

  @IsEnum(['normal', 'urgent'])
  priority: string;
}
