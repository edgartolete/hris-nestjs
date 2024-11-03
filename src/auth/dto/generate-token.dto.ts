import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateTokenDto {
  @IsString()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  username: string;
}
