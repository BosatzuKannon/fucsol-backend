import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const mockUsersService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('debería retornar el usuario (sin contraseña) si las credenciales son válidas', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        password: 'hashed_password',
        role: 'user',
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@test.com', 'password123');

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@test.com',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashed_password',
      );

      expect(result).toEqual({ id: '1', email: 'test@test.com', role: 'user' });
      expect(result.password).toBeUndefined();
    });

    it('debería lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        password: 'hashed_password',
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateUser('test@test.com', 'wrong_pass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debería lanzar UnauthorizedException si el usuario no existe', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser('noexiste@test.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('debería retornar un access_token y los datos básicos del usuario, incluyendo direcciones y puntos', () => {
      const mockUser = {
        id: '1',
        full_name: 'Test',
        email: 'test@test.com',
        role: 'user',
        phone: '3171234567',
        points: 50,
        addresses: [{ id: 'addr-1', title: 'Casa' }],
      };

      mockJwtService.sign.mockReturnValue('un_token_jwt_muy_seguro');

      const result = service.login(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
      });

      expect(result).toEqual({
        access_token: 'un_token_jwt_muy_seguro',
        user: {
          id: mockUser.id,
          full_name: mockUser.full_name,
          email: mockUser.email,
          role: mockUser.role,
          phone: mockUser.phone,
          points: mockUser.points,
          addresses: mockUser.addresses,
        },
      });
    });
  });

  describe('register', () => {
    it('debería crear un usuario y loguearlo automáticamente sin devolver la contraseña e inicializando puntos y direcciones', async () => {
      const userData = {
        full_name: 'Test',
        email: 'test@test.com',
        password: '123',
        phone: '3171234567',
      };

      const mockCreatedUser = { id: '1', ...userData, role: 'user' };

      mockUsersService.create.mockResolvedValue(mockCreatedUser);
      mockJwtService.sign.mockReturnValue('token_del_nuevo_usuario');

      const result = await service.register(userData);

      expect(mockUsersService.create).toHaveBeenCalledWith(userData);
      expect(mockJwtService.sign).toHaveBeenCalled();

      expect(result.access_token).toBe('token_del_nuevo_usuario');
      expect(result.user).toEqual({
        id: mockCreatedUser.id,
        full_name: mockCreatedUser.full_name,
        email: mockCreatedUser.email,
        role: mockCreatedUser.role,
        phone: mockCreatedUser.phone,
        points: 0, // Por defecto en login() si no viene en el usuario
        addresses: [], // Modificado explícitamente en register() de auth.service.ts
      });
      expect((result.user as any).password).toBeUndefined();
    });
  });
});
