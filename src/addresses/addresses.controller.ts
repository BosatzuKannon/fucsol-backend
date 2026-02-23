import {
  Controller,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  create(@Request() req, @Body() createAddressDto: CreateAddressDto) {
    return this.addressesService.create(
      req.user.id as string,
      createAddressDto,
    );
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') addressId: string) {
    return this.addressesService.remove(req.user.id as string, addressId);
  }
}
