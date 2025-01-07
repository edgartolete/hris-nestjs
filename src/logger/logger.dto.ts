import { IsJSON, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateErrorLogDto {
  @IsString()
  context: string;

  @IsJSON()
  error: Record<string, any>;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsJSON()
  input?: Record<string, any>;
}
