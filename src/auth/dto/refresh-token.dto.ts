import { IsOptional, IsString } from 'class-validator';

export class RenewRefreshTokenDto {
  @IsString()
  @IsOptional()
  refreshToken: string;
}
