import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() userData: any) {
    this.logger.log(`Petición de registro recibida para: ${userData.email}`);
    return this.authService.register(userData);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginData: any) {
    this.logger.log(`Petición de login recibida para: ${loginData.email}`);

    const user = await this.authService.validateUser(
      loginData.email,
      loginData.password,
    );

    return this.authService.login(user);
  }
}
