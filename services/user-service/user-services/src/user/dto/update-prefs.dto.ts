import { IsBoolean, IsOptional, IsObject } from 'class-validator';

export class UpdatePrefsDto {
  @IsOptional()
  @IsBoolean()
  email_notifications_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  push_notifications_enabled?: boolean;

  @IsOptional()
  @IsObject()
  push_token?: Record<string, any> | null;
}
