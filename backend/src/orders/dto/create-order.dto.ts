import { IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';

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

  @IsOptional()
  @IsString()
  clientPhone?: string;
}
