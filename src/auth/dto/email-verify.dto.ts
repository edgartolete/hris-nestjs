import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EmailVerifyRequestDto {
  @IsEmail()
  @IsOptional()
  email: string;
}

export class EmailVerifySubmitDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
