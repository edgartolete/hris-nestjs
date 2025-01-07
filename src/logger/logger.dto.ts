import { IsJSON, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateErrorLogDto {
  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsString()
  context: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsJSON()
  input?: Record<string, any>;

  @IsJSON()
  error: Record<string, any>;
}
