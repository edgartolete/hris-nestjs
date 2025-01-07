import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordRequestDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class ForgotPasswordSubmitDto extends ForgotPasswordRequestDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  password: string;
}
