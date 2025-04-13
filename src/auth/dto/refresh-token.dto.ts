import { IsOptional, IsString } from 'class-validator';

export class RenewRefreshTokenDto {
  @IsString()
  @IsOptional()
  refreshToken: string;
}

export class LogoutRefreshTokenDto {
  @IsString()
  @IsOptional()
  refreshToken: string;
}
