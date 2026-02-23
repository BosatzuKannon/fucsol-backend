import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@Req() req: any, @Body() createOrderDto: CreateOrderDto) {
    const userId = req.user.id as string;
    return this.ordersService.createOrder(userId, createOrderDto);
  }

  @Get()
  getUserOrders(@Req() req: any) {
    const userId = req.user.id as string;
    return this.ordersService.getUserOrders(userId);
  }
}
