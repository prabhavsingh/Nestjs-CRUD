import { Injectable, NotFoundException } from '@nestjs/common';
import { Post } from './entities/post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dtos/create-post.dto';
import { UpdatePostDto } from './dtos/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private postsRepository: Repository<Post>,
  ) {}

  async findAll(): Promise<Post[]> {
    const posts = await this.postsRepository.find();
    return posts;
  }

  async findOne(id: number): Promise<Post> {
    const post = await this.postsRepository.findOneBy({ id });

    if (!post) throw new NotFoundException(`post with id ${id} not found`);

    return post;
  }

  async create(createPostdata: CreatePostDto): Promise<Post> {
    const newPost = this.postsRepository.create({
      title: createPostdata.title,
      content: createPostdata.content,
      authorName: createPostdata.authorName,
    });

    return this.postsRepository.save(newPost);
  }

  async update(id: number, updatePostData: UpdatePostDto): Promise<Post> {
    const findPostToUpdate = await this.findOne(id);
    if (updatePostData.title) {
      findPostToUpdate.title = updatePostData.title;
    }
    if (updatePostData.content) {
      findPostToUpdate.content = updatePostData.content;
    }
    if (updatePostData.authorName) {
      findPostToUpdate.authorName = updatePostData.authorName;
    }
    return this.postsRepository.save(findPostToUpdate);
  }

  async remove(id: number) {
    const findPostTodelete = await this.findOne(id);

    await this.postsRepository.remove(findPostTodelete);
  }
}
