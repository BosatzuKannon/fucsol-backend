import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  const mockOrdersService = {
    createOrder: jest.fn(),
    getUserOrders: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('createOrder', () => {
    it('debería llamar al servicio para crear un pedido', async () => {
      const mockReq = { user: { id: 'user-123' } };
      const dto: CreateOrderDto = {
        total_amount: 150000,
        shipping_address: 'Calle Falsa 123',
        items: [{ product_id: 'prod-1', quantity: 2, price: 75000 }],
      };
      const expectedResult = {
        success: true,
        orderId: 'order-1',
        message: 'OK',
      };

      mockOrdersService.createOrder.mockResolvedValue(expectedResult);

      const result = await controller.createOrder(mockReq, dto);

      expect(service.createOrder).toHaveBeenCalledWith('user-123', dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getUserOrders', () => {
    it('debería llamar al servicio para obtener los pedidos del usuario', async () => {
      const mockReq = { user: { id: 'user-123' } };
      const expectedOrders = [{ id: 'order-1', total_amount: 150000 }];

      mockOrdersService.getUserOrders.mockResolvedValue(expectedOrders);

      const result = await controller.getUserOrders(mockReq);

      expect(service.getUserOrders).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(expectedOrders);
    });
  });
});
