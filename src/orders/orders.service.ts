import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly supabase: SupabaseService) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const client = this.supabase.getClient();

    // Llamamos a la función RPC que creamos en PostgreSQL
    // Pasamos el array de items tal cual; el driver de Supabase lo convierte a JSONB
    const { data, error } = await client.rpc('create_order_with_items', {
      p_user_id: userId,
      p_total_amount: createOrderDto.total_amount,
      p_shipping_address: createOrderDto.shipping_address,
      p_items: createOrderDto.items,
    });

    if (error) {
      console.error('Error en la transacción de base de datos:', error);
      throw new InternalServerErrorException(
        'No se pudo procesar el pedido de forma segura.',
      );
    }

    return {
      success: true,
      orderId: data.order_id,
      message: 'Pedido registrado exitosamente y protegido por transacción',
    };
  }

  async getUserOrders(userId: string) {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('orders')
      .select(
        `
        *,
        order_items (
          quantity,
          price,
          products (
            name,
            image_url
          )
        )
      `,
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        'Error al obtener el historial de pedidos: ' + error.message,
      );
    }

    return data;
  }
}
