import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './user.entity';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Registers the User entity for TypeORM
    RedisModule, // Imports the Redis service
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // Useful if other local modules need User logic
})
export class UserModule {}