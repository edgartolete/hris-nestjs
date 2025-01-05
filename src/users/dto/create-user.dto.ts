import { IsEmail } from 'class-validator';

export class CreateUserDto {
  firstName: string;
  lastName: string;
  username: string;

  @IsEmail()
  email: string;

  password: string;
}
