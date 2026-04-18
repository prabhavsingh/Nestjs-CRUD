import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import type { Post as PostInterface } from './interfaces/post.interface';
import { CreatePostDto } from './dtos/create-post.dto';
import { UpdatePostDto } from './dtos/update-post.dto';
import { PostExistsPipe } from './pipes/post-exists.pipe';

@Controller('posts')
export class PostsController {
  constructor(private readonly postService: PostsService) {}

  @Get()
  findAll(@Query('search') search?: string): PostInterface[] {
    const extractAllPosts = this.postService.findAll();

    if (search) {
      return extractAllPosts.filter((post) =>
        post.title.toLowerCase().includes(search.toLowerCase()),
      );
    }
    return extractAllPosts;
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe, PostExistsPipe) id: number,
  ): PostInterface {
    return this.postService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  //if both in global and indivial controller, it will take this validation pipe
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  creatPost(@Body() createPostData: CreatePostDto): PostInterface {
    return this.postService.create(createPostData);
  }

  @Put(':id')
  updatePost(
    @Param('id', ParseIntPipe, PostExistsPipe) id: number,
    @Body() updatePostData: UpdatePostDto,
  ): PostInterface {
    return this.postService.update(id, updatePostData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe, PostExistsPipe) id: number): void {
    this.postService.remove(id);
  }
}
