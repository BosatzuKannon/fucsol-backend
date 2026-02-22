import { Test, TestingModule } from '@nestjs/testing';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';

describe('AddressesController', () => {
  let controller: AddressesController;
  let service: AddressesService;

  // Creamos un "doble" (mock) de nuestro servicio
  const mockAddressesService = {
    create: jest.fn(),
    remove: jest.fn(),
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

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debería llamar al servicio para crear una dirección', async () => {
      const createDto: CreateAddressDto = {
        title: 'Casa',
        address_line: 'Calle Falsa 123',
        is_default: true,
      };
      const req = { user: { sub: 'user-123' } }; // Simulamos el request con el JWT decodificado
      const expectedResult = { id: 'addr-1', ...createDto };

      mockAddressesService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(req, createDto);

      expect(service.create).toHaveBeenCalledWith('user-123', createDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('debería llamar al servicio para eliminar una dirección', async () => {
      const req = { user: { sub: 'user-123' } };
      const addressId = 'addr-1';
      const expectedResult = { message: 'Dirección eliminada correctamente' };

      mockAddressesService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(req, addressId);

      expect(service.remove).toHaveBeenCalledWith('user-123', addressId);
      expect(result).toEqual(expectedResult);
    });
  });
});
