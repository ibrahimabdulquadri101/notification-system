import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePrefsDto } from './dto/update-prefs.dto';
import { RedisService } from './redis/redis.service';

const SALT_ROUNDS = 10;
const CACHE_TTL_SECONDS = 3600; // 1 hour cache

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly redisService: RedisService,
  ) {}

  // ---------------------
  // AUTH / REGISTRATION
  // ---------------------
  async register_user(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });

    if (existing) {
      throw new BadRequestException('user_already_exists');
    }

    const password_hash = await bcrypt.hash(createUserDto.password, SALT_ROUNDS);

    const newUser = this.userRepository.create({
      email: createUserDto.email,
      password_hash,
    });

    return this.userRepository.save(newUser);
  }

  // Used by login endpoint (placeholder)
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }
  async get_contact_info(user_id: string): Promise<Partial<User>> {
    const cacheKey = `user:${user_id}:contact`;

    // 1. Try cache first
    const cachedUser = await this.redisService.get(cacheKey);
    if (cachedUser) return JSON.parse(cachedUser);

    // 2. Query DB
    const user = await this.userRepository.findOne({
      where: { user_id },
      select: [
        'user_id',
        'email',
        'push_token',
        'email_notifications_enabled',
        'push_notifications_enabled',
        'created_at',
      ],
    });

    if (!user) throw new NotFoundException('user_not_found');

    // 3. Cache result
    await this.redisService.set(cacheKey, JSON.stringify(user), CACHE_TTL_SECONDS);
    return user;
  }

  // ---------------------
  // USER PREFERENCES
  // ---------------------
  async getUserPrefs(user_id: string) {
    const cacheKey = `user:${user_id}:prefs`;

    // 1. Try Redis cache
    const cachedPrefs = await this.redisService.get(cacheKey);
    if (cachedPrefs) return JSON.parse(cachedPrefs);

    // 2. Fallback to DB
    const prefs = await this.userRepository.findOne({
      where: { user_id },
      select: [
        'user_id',
        'email_notifications_enabled',
        'push_notifications_enabled',
        'push_token',
      ],
    });

    if (!prefs) throw new NotFoundException('user_not_found');

    // 3. Cache result
    await this.redisService.set(cacheKey, JSON.stringify(prefs), CACHE_TTL_SECONDS);
    return prefs;
  }

  async updateUserPrefs(user_id: string, updatePrefsDto: UpdatePrefsDto) {
    const user = await this.userRepository.findOneBy({ user_id });
    if (!user) throw new NotFoundException('user_not_found');

    // Safely handle push_token (JSON field)
    if (updatePrefsDto.push_token !== undefined) {
      user.push_token = updatePrefsDto.push_token ? updatePrefsDto.push_token : null;
    }

    if (updatePrefsDto.email_notifications_enabled !== undefined) {
      user.email_notifications_enabled = updatePrefsDto.email_notifications_enabled;
    }

    if (updatePrefsDto.push_notifications_enabled !== undefined) {
      user.push_notifications_enabled = updatePrefsDto.push_notifications_enabled;
    }

    await this.userRepository.save(user);

    // Invalidate Redis cache to keep fresh data
    await this.redisService.del(`user:${user_id}:prefs`);
    await this.redisService.del(`user:${user_id}:contact`);

    return { message: 'preferences_updated_successfully' };
  }
}
