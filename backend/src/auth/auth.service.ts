import { Injectable, UnauthorizedException, OnApplicationBootstrap, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/User.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService
  ) {}

  async onApplicationBootstrap() {
    const testUsers = [
      { email: 'admin@test.com', name: 'Admin User', role: 'admin', password: 'password' },
      { email: 'client@test.com', name: 'Client User', role: 'client', password: 'password' },
      { email: 'rider@test.com', name: 'Rider User', role: 'rider', password: 'password' },
    ];

    for (const u of testUsers) {
      const existing = await this.userModel.findOne({ email: u.email });
      if (!existing) {
        const hash = await bcrypt.hash(u.password, 10);
        await this.userModel.create({ ...u, passwordHash: hash });
      }
    }
  }

  async register(data: any) {
    try {
      const hash = await bcrypt.hash(data.password, 10);
      const user = new this.userModel({ ...data, passwordHash: hash });
      await user.save();
      return { token: this.jwtService.sign({ sub: user._id, role: user.role }), user: { id: user._id, role: user.role, name: user.name, status: user.status } };
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async login(data: any) {
    const user = await this.userModel.findOne({ email: data.email });
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      throw new UnauthorizedException();
    }
    return { token: this.jwtService.sign({ sub: user._id, role: user.role }), user: { id: user._id, role: user.role, name: user.name, status: user.status } };
  }
}