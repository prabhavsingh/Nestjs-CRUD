import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { User } from '../auth/entities/user-entity';

@Injectable()
export class FileUploadService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepo: Repository<File>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    description: string | undefined,
    user: User,
  ) {
    const cloudinaryResponse = await this.cloudinaryService.uploadFile(file);
    console.log('cloudinaryResponse', cloudinaryResponse);

    const newlyCreatedFile = this.fileRepo.create({
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      publicId: cloudinaryResponse?.public_id,
      url: cloudinaryResponse?.secure_url,
      description,
      uploader: user,
    });

    return this.fileRepo.save(newlyCreatedFile);
  }

  async findAll(): Promise<File[]> {
    return this.fileRepo.find({
      relations: ['uploader'],
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string): Promise<void> {
    const fileToBeDeleted = await this.fileRepo.findOne({ where: { id } });

    if (!fileToBeDeleted) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    //delete from cloudinary
    await this.cloudinaryService.deleteFile(fileToBeDeleted.publicId);

    //delete from database
    await this.fileRepo.remove(fileToBeDeleted);
  }
}
