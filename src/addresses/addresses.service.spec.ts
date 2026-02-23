import { Test, TestingModule } from '@nestjs/testing';
import { AddressesService } from './addresses.service';
import { SupabaseService } from '../supabase/supabase.service';
import { InternalServerErrorException } from '@nestjs/common';

describe('AddressesService', () => {
  let service: AddressesService;

  const mockSupabaseQueryBuilder = {
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn(),
    single: jest.fn(),
  };

  const mockSupabaseClient = {
    from: jest.fn(() => mockSupabaseQueryBuilder),
  };

  const mockSupabaseService = {
    getClient: jest.fn(() => mockSupabaseClient),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<AddressesService>(AddressesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debería actualizar otras direcciones a false si la nueva es predeterminada e insertar con campos completos', async () => {
      const userId = 'user-123';
      const dto = {
        title: 'Casa',
        address_line: 'Calle 1',
        city: 'Cali',
        department: 'Valle',
        is_default: true,
      };

      // 1. Resolvemos el update() que quita el default a las demás
      mockSupabaseQueryBuilder.eq.mockResolvedValueOnce({ error: null });
      // 2. Resolvemos el insert().select().single()
      mockSupabaseQueryBuilder.single.mockResolvedValueOnce({
        data: { id: '1', ...dto },
        error: null,
      });

      await service.create(userId, dto);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('addresses');
      expect(mockSupabaseQueryBuilder.update).toHaveBeenCalledWith({
        is_default: false,
      });
      expect(mockSupabaseQueryBuilder.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ city: 'Cali', department: 'Valle' }),
        ]),
      );
    });

    it('debería usar valores por defecto para city y department si no se envían', async () => {
      const userId = 'user-123';
      const dto = { title: 'Casa', address_line: 'Calle 1', is_default: false };

      // Como is_default es false, no hay update, directo al insert
      mockSupabaseQueryBuilder.single.mockResolvedValueOnce({
        data: { id: '1', ...dto },
        error: null,
      });

      await service.create(userId, dto);

      expect(mockSupabaseQueryBuilder.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ city: 'Pasto', department: 'Nariño' }),
        ]),
      );
    });
  });

  describe('remove', () => {
    it('debería eliminar la dirección exitosamente comprobando ID y User ID', async () => {
      const userId = 'user-123';
      const addressId = 'addr-1';

      // Para el delete().eq().eq()
      // El primer eq retorna el builder, el segundo resuelve la promesa
      mockSupabaseQueryBuilder.eq
        .mockReturnValueOnce(mockSupabaseQueryBuilder)
        .mockResolvedValueOnce({ error: null });

      const result = await service.remove(userId, addressId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('addresses');
      expect(mockSupabaseQueryBuilder.delete).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Dirección eliminada correctamente' });
    });
  });

  describe('markAsDefault', () => {
    it('debería quitar el default a todas y ponérselo solo a la seleccionada', async () => {
      const userId = 'user-123';
      const addressId = 'addr-1';

      // 1. Resolvemos el primer update().eq()
      mockSupabaseQueryBuilder.eq.mockResolvedValueOnce({ error: null });

      // 2. Simulamos el segundo update().eq().eq().select().single()
      mockSupabaseQueryBuilder.eq
        .mockReturnValueOnce(mockSupabaseQueryBuilder) // primer eq (id)
        .mockReturnValueOnce(mockSupabaseQueryBuilder); // segundo eq (user_id)

      mockSupabaseQueryBuilder.single.mockResolvedValueOnce({
        data: { id: addressId, is_default: true },
        error: null,
      });

      const result = await service.markAsDefault(userId, addressId);

      expect(mockSupabaseQueryBuilder.update).toHaveBeenCalledWith({
        is_default: false,
      });
      expect(mockSupabaseQueryBuilder.update).toHaveBeenCalledWith({
        is_default: true,
      });
      expect(result).toEqual({ id: addressId, is_default: true });
    });

    it('debería lanzar error si falla al actualizar', async () => {
      const userId = 'user-123';
      const addressId = 'addr-1';

      mockSupabaseQueryBuilder.eq.mockResolvedValueOnce({
        error: new Error('DB Error'),
      });

      await expect(service.markAsDefault(userId, addressId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
