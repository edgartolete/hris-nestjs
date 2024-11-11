import { Module } from '@nestjs/common';
import { photoProviders } from './photo.providers';
import { PhotoService } from './photo.service';

@Module({
  providers: [...photoProviders, PhotoService],
})
export class PhotoModule {}
