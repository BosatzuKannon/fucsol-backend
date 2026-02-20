import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  register: jest.fn(),
  validateUser: jest.fn(),
  login: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('debería recibir los datos y pasarlos al servicio de registro', async () => {
      const userData = {
        email: 'test@test.com',
        password: '123',
        full_name: 'Test',
      };
      const expectedResponse = {
        access_token: 'token_falso',
        user: { id: '1', email: 'test@test.com' },
      };

      mockAuthService.register.mockResolvedValue(expectedResponse);

      const result = await controller.register(userData);

      expect(mockAuthService.register).toHaveBeenCalledWith(userData);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('login', () => {
    it('debería validar las credenciales y luego generar el token', async () => {
      const loginData = { email: 'test@test.com', password: '123' };
      const mockValidUser = { id: '1', email: 'test@test.com', role: 'user' };
      const expectedResponse = {
        access_token: 'token_falso',
        user: mockValidUser,
      };

      mockAuthService.validateUser.mockResolvedValue(mockValidUser);
      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(loginData);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        'test@test.com',
        '123',
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(mockValidUser);
      expect(result).toEqual(expectedResponse);
    });
  });
});
