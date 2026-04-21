import { Inject, Injectable } from '@nestjs/common';
import { UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private readonly cloudinary: any) {}

  uploadFile(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder: 'images',
          resource_type: 'auto',
        },
        (error: UploadApiResponse, result: UploadApiResponse) => {
          if (error) reject(error);
          resolve(result);
        },
      );

      //convert the file buffer to a readble stream and pipe to the upload stream
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  deleteFile(publicId: string) {
    return this.cloudinary.uploader.destroy(publicId);
  }
}
