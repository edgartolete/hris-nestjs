import {
  Controller,
  Get,
  // Post,
  // Patch,
  // Delete,
  // Body,
  // Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './user.service';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
import { TokenAuthGuard } from 'src/auth/guards/token-auth.guard';
import { RequestWithTokenPayload } from 'src/types';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // @Post()
  // create(@Body() createUserDto: CreateUserDto) {
  // return this.usersService.create(createUserDto);
  // }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(TokenAuthGuard)
  @Get('me')
  async findMe(@Req() req: RequestWithTokenPayload) {
    const user = await this.usersService.findOneById(req.user.userId);

    delete user.password;
    delete user.deletedAt;
    delete user.isActive;

    return user;
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.usersService.findOne(+id);
  // }
  //
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   // return this.usersService.update(+id, updateUserDto);
  //   return this.usersService.update(+id);
  // }
  //
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.usersService.remove(+id);
  // }
}
