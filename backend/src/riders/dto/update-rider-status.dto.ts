import { IsEnum } from 'class-validator';

export class UpdateRiderStatusDto {
  @IsEnum(['available', 'offline'])
  status: string;
}
