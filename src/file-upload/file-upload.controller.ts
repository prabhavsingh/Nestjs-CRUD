import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadFileDto } from './dtos/upload-file.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../auth/entities/user-entity';
import { Roles } from '../auth/decorators/role.decorator';
import { RolesGuard } from '../auth/guards/roles-guard';

@Controller('file-upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileDto,
    @CurrentUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.fileUploadService.uploadFile(
      file,
      uploadFileDto.description,
      user,
    );
  }

  @Get()
  async findAll() {
    return this.fileUploadService.findAll();
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.fileUploadService.remove(id);
    return {
      message: 'File deleted successfully',
    };
  }
}
