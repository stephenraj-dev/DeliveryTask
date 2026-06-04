import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('client')
  createOrder(@Body() body: CreateOrderDto, @Request() req: any) {
    return this.ordersService.create({ ...body, clientId: req.user._id });
  }

  @Get()
  @Roles('admin')
  getAll(@Query() query: any) {
    return this.ordersService.findAll(query);
  }

  @Get('my')
  @Roles('client')
  getMy(@Request() req: any) {
    return this.ordersService.findByClient(req.user._id.toString());
  }

  @Get('my/stats')
  @Roles('client')
  getMyStats(@Request() req: any) {
    return this.ordersService.getClientStats(req.user._id.toString());
  }

  @Get('assigned')
  @Roles('rider')
  getAssigned(@Request() req: any) {
    return this.ordersService.findByRider(req.user._id.toString());
  }

  @Get('assigned/stats')
  @Roles('rider')
  getAssignedStats(@Request() req: any) {
    return this.ordersService.getRiderStats(req.user._id.toString());
  }

  @Patch(':id/status')
  @Roles('rider')
  updateStatus(@Param('id') id: string, @Body() body: UpdateOrderStatusDto, @Request() req: any) {
    return this.ordersService.updateStatus(id, body, req.user._id.toString());
  }
}