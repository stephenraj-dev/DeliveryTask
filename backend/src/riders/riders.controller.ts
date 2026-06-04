import { Controller, Get, Patch, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { RidersService } from './riders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateRiderStatusDto } from './dto/update-rider-status.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('riders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RidersController {
  constructor(private readonly ridersService: RidersService) {}

  @Get()
  @Roles('admin')
  getAll() {
    return this.ridersService.findAll();
  }

  @Patch(':id/status')
  @Roles('admin', 'rider')
  updateStatus(@Param('id') id: string, @Body() body: UpdateRiderStatusDto, @Request() req: any) {
    if (req.user.role === 'rider' && req.user._id.toString() !== id) {
      throw new ForbiddenException('You can only update your own status');
    }
    return this.ridersService.updateStatus(id, body.status);
  }

  @Patch('location')
  @Roles('rider')
  updateLocation(@Body() body: UpdateLocationDto, @Request() req: any) {
    return this.ridersService.updateLocation({ ...body, riderId: req.user._id.toString() });
  }
}