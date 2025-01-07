import {
  IsBoolean,
  IsJSON,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateLogDto {
  @IsString()
  context: string;

  @IsOptional()
  @IsJSON()
  error?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsJSON()
  input?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isResolved?: boolean;
}
