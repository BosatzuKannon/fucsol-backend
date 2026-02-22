import { Test, TestingModule } from '@nestjs/testing';
import { AddressesService } from './addresses.service';
import { SupabaseService } from '../supabase/supabase.service';
import { InternalServerErrorException } from '@nestjs/common';

describe('AddressesService', () => {
  let service: AddressesService;

  // Construimos un mock encadenable para simular el cliente de Supabase
  const mockSupabaseQueryBuilder = {
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
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
    jest.clearAllMocks(); // Limpiamos los mocks entre pruebas
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debería actualizar otras direcciones a false si la nueva es predeterminada', async () => {
      const userId = 'user-123';
      const dto = { title: 'Casa', address_line: 'Calle 1', is_default: true };

      // Simulamos que Supabase responde bien a la inserción
      mockSupabaseQueryBuilder.single.mockResolvedValueOnce({
        data: { id: '1', ...dto },
        error: null,
      });

      await service.create(userId, dto);

      // Verificamos que llamó a UPDATE para quitar el default de las demás
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('addresses');
      expect(mockSupabaseQueryBuilder.update).toHaveBeenCalledWith({
        is_default: false,
      });
      expect(mockSupabaseQueryBuilder.eq).toHaveBeenCalledWith(
        'user_id',
        userId,
      );
    });

    it('debería lanzar InternalServerErrorException si Supabase falla al insertar', async () => {
      const userId = 'user-123';
      const dto = { title: 'Casa', address_line: 'Calle 1', is_default: false };

      // Simulamos un error de base de datos
      mockSupabaseQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: new Error('DB Error'),
      });

      await expect(service.create(userId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('remove', () => {
    it('debería eliminar la dirección exitosamente', async () => {
      const userId = 'user-123';
      const addressId = 'addr-1';

      // MAGIA AQUÍ: Hacemos que el primer .eq() devuelva el constructor
      // y el segundo .eq() devuelva la promesa resuelta.
      mockSupabaseQueryBuilder.eq
        .mockReturnValueOnce(mockSupabaseQueryBuilder)
        .mockResolvedValueOnce({ error: null });

      const result = await service.remove(userId, addressId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('addresses');
      expect(mockSupabaseQueryBuilder.delete).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Dirección eliminada correctamente' });
    });
  });
});
