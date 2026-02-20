import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(userData: any) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            full_name: userData.full_name,
            email: userData.email,
            phone: userData.phone,
            password: hashedPassword,
            role: 'user',
          },
        ])
        .select('id, full_name, email, phone, role, created_at')
        .single();

      if (error) {
        // Registramos el error en la consola antes de lanzarlo
        this.logger.error(
          `Error de Supabase al crear usuario: ${error.message}`,
          error.stack,
        );
        throw new InternalServerErrorException(
          `Error al crear usuario: ${error.message}`,
        );
      }

      this.logger.log(`Usuario creado exitosamente: ${data.email}`);
      return data;
    } catch (error) {
      this.logger.error(
        `Fallo inesperado al crear usuario: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al crear el usuario',
      );
    }
  }

  async findByEmail(email: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      this.logger.error(
        `Error buscando usuario por email (${email}): ${error.message}`,
      );
      throw new InternalServerErrorException(error.message);
    }

    return data || null;
  }

  async findById(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, phone, role, created_at')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        this.logger.warn(
          `Intento de buscar un usuario que no existe: ID ${id}`,
        );
        throw new NotFoundException('Usuario no encontrado');
      }
      this.logger.error(
        `Error al buscar usuario por ID (${id}): ${error.message}`,
      );
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }

  async findAll() {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, phone, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Error al listar usuarios: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }
}
