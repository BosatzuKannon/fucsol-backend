import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { SupabaseService } from '../supabase/supabase.service';
import { InternalServerErrorException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';

describe('OrdersService', () => {
  let service: OrdersService;

  // Creamos el mock encadenable de Supabase
  const mockSupabaseClient = {
    rpc: jest.fn(),
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn(),
  };

  const mockSupabaseService = {
    getClient: jest.fn(() => mockSupabaseClient),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Limpiamos los mocks después de cada test
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    const userId = 'user-123';
    const dto: CreateOrderDto = {
      total_amount: 50000,
      shipping_address: 'Mi casa',
      items: [{ product_id: 'prod-1', quantity: 1, price: 50000 }],
    };

    it('debería crear el pedido exitosamente usando RPC', async () => {
      // Simulamos respuesta exitosa de la función SQL
      mockSupabaseClient.rpc.mockResolvedValue({
        data: { order_id: 'new-order-id', status: 'success' },
        error: null,
      });

      const result = await service.createOrder(userId, dto);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'create_order_with_items',
        {
          p_user_id: userId,
          p_total_amount: dto.total_amount,
          p_shipping_address: dto.shipping_address,
          p_items: dto.items,
        },
      );
      expect(result).toEqual({
        success: true,
        orderId: 'new-order-id',
        message: 'Pedido registrado exitosamente y protegido por transacción',
      });
    });

    it('debería lanzar InternalServerErrorException si RPC falla', async () => {
      // Simulamos error en la función SQL (ej. falta de stock)
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Stock insuficiente' },
      });

      await expect(service.createOrder(userId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getUserOrders', () => {
    const userId = 'user-123';

    it('debería retornar el historial de pedidos', async () => {
      const mockData = [{ id: 'order-1' }, { id: 'order-2' }];

      // La función order es la última de la cadena, así que esta es la que resuelve la promesa
      mockSupabaseClient.order.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await service.getUserOrders(userId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('orders');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', userId);
      expect(result).toEqual(mockData);
    });

    it('debería lanzar InternalServerErrorException si falla la consulta', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: null,
        error: { message: 'Error de conexión' },
      });

      await expect(service.getUserOrders(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
