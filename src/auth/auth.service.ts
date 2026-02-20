import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    this.logger.warn(`Intento de login fallido para el correo: ${email}`);
    throw new UnauthorizedException('Correo o contraseña incorrectos');
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    this.logger.log(`Usuario logueado exitosamente, generando JWT para: ${user.email}`);
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    };
  }

  async register(userData: any) {
    this.logger.log(`Registrando nuevo usuario: ${userData.email}`);
    const newUser = await this.usersService.create(userData);
    
    return this.login(newUser);
  }
}