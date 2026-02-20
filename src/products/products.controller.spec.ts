import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockProducts = [{ id: '1', name: 'Aceite de Coco Mock', price: 35000 }];

  const mockProductsService = {
    findAll: jest.fn().mockResolvedValue(mockProducts),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return a products array', async () => {
    const result = await controller.getAllProducts();

    expect(result).toEqual(mockProducts);
    expect(service.findAll).toHaveBeenCalled();
  });
});
