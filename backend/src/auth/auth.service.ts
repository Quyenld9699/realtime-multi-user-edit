import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import { RegisterDto, LoginDto } from "./dto/auth.dto";

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) {}

    async register(registerDto: RegisterDto) {
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new UnauthorizedException("Email already exists");
        }

        const user = await this.usersService.create(registerDto.email, registerDto.name, registerDto.password);

        const payload = { email: user.email, sub: (user as any)._id, userId: (user as any)._id };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: (user as any)._id,
                email: user.email,
                name: user.name,
            },
        };
    }

    async login(loginDto: LoginDto) {
        const user = await this.usersService.findByEmail(loginDto.email);
        if (!user) {
            throw new UnauthorizedException("Invalid credentials");
        }

        const isValidPassword = await this.usersService.validatePassword(loginDto.password, user.password);

        if (!isValidPassword) {
            throw new UnauthorizedException("Invalid credentials");
        }

        const payload = { email: user.email, sub: (user as any)._id, userId: (user as any)._id };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: (user as any)._id,
                email: user.email,
                name: user.name,
            },
        };
    }

    async validateUser(payload: any) {
        return this.usersService.findById(payload.userId);
    }
}
