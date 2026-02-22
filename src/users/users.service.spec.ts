import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { SupabaseService } from '../supabase/supabase.service';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const mockSupabaseQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

const mockSupabaseClient = {
  from: jest.fn(() => mockSupabaseQueryBuilder),
};

const mockSupabaseService = {
  getClient: jest.fn(() => mockSupabaseClient),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debería encriptar la contraseña y crear un usuario exitosamente', async () => {
      const userData = {
        full_name: 'Juan Pérez',
        email: 'juan@test.com',
        phone: '123456789',
        password: 'password123',
      };

      const mockHashedPassword = 'hashed_password_123';
      const mockCreatedUser = {
        id: '1',
        full_name: userData.full_name,
        email: userData.email,
        phone: userData.phone,
        role: 'user',
        created_at: '2026-02-20T10:00:00Z',
      };

      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);

      mockSupabaseQueryBuilder.single.mockResolvedValueOnce({
        data: mockCreatedUser,
        error: null,
      });

      const result = await service.create(userData);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseQueryBuilder.insert).toHaveBeenCalledWith([
        {
          full_name: userData.full_name,
          email: userData.email,
          phone: userData.phone,
          password: mockHashedPassword,
          role: 'user',
        },
      ]);

      expect(result).toEqual(mockCreatedUser);
    });

    it('debería lanzar InternalServerErrorException si Supabase falla al crear', async () => {
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash');

      mockSupabaseQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Error de conexión o correo duplicado' },
      });

      await expect(service.create({ password: '123' })).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findByEmail', () => {
    it('debería retornar un usuario si el correo existe', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        full_name: 'Test',
        password: 'hashed',
      };
      mockSupabaseQueryBuilder.single.mockResolvedValueOnce({
        data: mockUser,
        error: null,
      });

      const result = await service.findByEmail('test@test.com');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      // CORRECCIÓN: Ahora espera el string con el JOIN
      expect(mockSupabaseQueryBuilder.select).toHaveBeenCalledWith(
        '*, addresses(*)',
      );
      expect(mockSupabaseQueryBuilder.eq).toHaveBeenCalledWith(
        'email',
        'test@test.com',
      );

      expect(result).toEqual(mockUser);
    });

    it('debería retornar null si el usuario no existe (error PGRST116)', async () => {
      mockSupabaseQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await service.findByEmail('noexiste@test.com');
      expect(result).toBeNull();
    });

    it('debería lanzar un error 500 si Supabase falla por otra razón diferente a no encontrado', async () => {
      mockSupabaseQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: { code: '500', message: 'Error de conexión' },
      });

      await expect(service.findByEmail('test@test.com')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findById', () => {
    it('debería retornar el usuario (sin contraseña) si el ID existe', async () => {
      const mockUser = {
        id: '1',
        full_name: 'Juan',
        email: 'juan@test.com',
        role: 'user',
      };
      mockSupabaseQueryBuilder.single.mockResolvedValueOnce({
        data: mockUser,
        error: null,
      });

      const result = await service.findById('1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      // CORRECCIÓN: Ahora espera el string con el JOIN
      expect(mockSupabaseQueryBuilder.select).toHaveBeenCalledWith(
        'id, full_name, email, phone, role, created_at, addresses(*)',
      );
      expect(mockSupabaseQueryBuilder.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(mockUser);
    });

    it('debería lanzar NotFoundException si el usuario no existe (error PGRST116)', async () => {
      mockSupabaseQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar InternalServerErrorException si hay otro error', async () => {
      mockSupabaseQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: { code: '500', message: 'Timeout' },
      });

      await expect(service.findById('1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('debería retornar una lista de usuarios ordenada por fecha de creación', async () => {
      const mockUsers = [
        { id: '1', email: 'a@a.com' },
        { id: '2', email: 'b@b.com' },
      ];

      mockSupabaseQueryBuilder.order.mockResolvedValueOnce({
        data: mockUsers,
        error: null,
      });

      const result = await service.findAll();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseQueryBuilder.select).toHaveBeenCalledWith(
        'id, full_name, email, phone, role, created_at',
      );
      expect(mockSupabaseQueryBuilder.order).toHaveBeenCalledWith(
        'created_at',
        { ascending: false },
      );
      expect(result).toEqual(mockUsers);
    });

    it('debería lanzar InternalServerErrorException si la consulta falla', async () => {
      mockSupabaseQueryBuilder.order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(service.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
