import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressesService {
  private readonly logger = new Logger(AddressesService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(userId: string, createAddressDto: CreateAddressDto) {
    const supabase = this.supabaseService.getClient();

    try {
      if (createAddressDto.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', userId);
      }

      const { data, error } = await supabase
        .from('addresses')
        .insert([
          {
            user_id: userId,
            title: createAddressDto.title,
            address_line: createAddressDto.address_line,
            reference: createAddressDto.reference,
            city: createAddressDto.city || 'Pasto',
            department: createAddressDto.department || 'Nariño',
            is_default: createAddressDto.is_default || false,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error(
        `Error al crear dirección: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('No se pudo guardar la dirección');
    }
  }

  async remove(userId: string, addressId: string) {
    const supabase = this.supabaseService.getClient();

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', userId);

      if (error) throw error;
      return { message: 'Dirección eliminada correctamente' };
    } catch (error) {
      this.logger.error(
        `Error al eliminar dirección: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'No se pudo eliminar la dirección',
      );
    }
  }

  async markAsDefault(userId: string, addressId: string) {
    const supabase = this.supabaseService.getClient();

    try {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId);

      const { data, error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error(
        `Error al marcar como predeterminada: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'No se pudo actualizar la dirección principal',
      );
    }
  }
}
