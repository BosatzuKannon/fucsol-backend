import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString()
  @IsNotEmpty({ message: 'El ID del producto es obligatorio' })
  product_id: string;

  @IsNumber()
  @Min(1, { message: 'La cantidad debe ser mayor a 0' })
  quantity: number;

  @IsNumber()
  @Min(0, { message: 'El precio no puede ser negativo' })
  price: number;
}

export class CreateOrderDto {
  @IsNumber()
  @Min(0, { message: 'El monto total no puede ser negativo' })
  total_amount: number;

  @IsString()
  @IsNotEmpty({ message: 'La dirección de envío es obligatoria' })
  shipping_address: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
