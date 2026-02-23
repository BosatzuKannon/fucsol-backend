import { Test, TestingModule } from '@nestjs/testing';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';

describe('AddressesController', () => {
  let controller: AddressesController;
  let service: AddressesService;

  // Actualizamos el mock para incluir el nuevo método
  const mockAddressesService = {
    create: jest.fn(),
    remove: jest.fn(),
    markAsDefault: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressesController],
      providers: [
        {
          provide: AddressesService,
          useValue: mockAddressesService,
        },
      ],
    }).compile();

    controller = module.get<AddressesController>(AddressesController);
    service = module.get<AddressesService>(AddressesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debería llamar al servicio para crear una dirección con el id del usuario', async () => {
      const createDto: CreateAddressDto = {
        title: 'Casa',
        address_line: 'Calle Falsa 123',
        reference: 'Apto 1',
        city: 'Bogotá',
        department: 'Cundinamarca',
        is_default: true,
      };

      // Usamos 'id' exactamente como lo extrae tu JwtStrategy
      const req = { user: { id: 'user-123' } };
      const expectedResult = { id: 'addr-1', ...createDto };

      mockAddressesService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(req, createDto);

      expect(service.create).toHaveBeenCalledWith('user-123', createDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('debería llamar al servicio para eliminar una dirección', async () => {
      const req = { user: { id: 'user-123' } };
      const addressId = 'addr-1';
      const expectedResult = { message: 'Dirección eliminada correctamente' };

      mockAddressesService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(req, addressId);

      expect(service.remove).toHaveBeenCalledWith('user-123', addressId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('markAsDefault', () => {
    it('debería llamar al servicio para marcar una dirección como predeterminada', async () => {
      const req = { user: { id: 'user-123' } };
      const addressId = 'addr-1';
      const expectedResult = { id: 'addr-1', is_default: true };

      mockAddressesService.markAsDefault.mockResolvedValue(expectedResult);

      const result = await controller.markAsDefault(req, addressId);

      expect(service.markAsDefault).toHaveBeenCalledWith('user-123', addressId);
      expect(result).toEqual(expectedResult);
    });
  });
});
