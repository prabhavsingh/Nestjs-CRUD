import { Injectable, NotFoundException } from '@nestjs/common';
import { Post } from './interfaces/post.interface';

@Injectable()
export class PostsService {
  private posts: Post[] = [
    {
      id: 1,
      title: 'First',
      content: 'FirstPost',
      authorName: 'authro1',
      createdAt: new Date(),
    },
  ];

  private getNextId() {
    return this.posts.length > 0
      ? Math.max(...this.posts.map((post) => post.id)) + 1
      : 1;
  }

  findAll(): Post[] {
    return this.posts;
  }

  findOne(id: number): Post {
    const post = this.posts.find((post) => post.id === id);

    if (!post) throw new NotFoundException(`post with id ${id} not found`);

    return post;
  }

  create(createPostdata: Omit<Post, 'id' | 'createdAt'>): Post {
    console.log(this.getNextId());
    const newPost: Post = {
      ...createPostdata,
      id: this.getNextId(),
      createdAt: new Date(),
    };
    this.posts.push(newPost);
    return newPost;
  }

  update(
    id: number,
    updatePostData: Partial<Omit<Post, 'id' | 'createdAt'>>,
  ): Post {
    const currentPostIndexToEdit = this.posts.findIndex(
      (post) => post.id === id,
    );

    if (currentPostIndexToEdit === -1) {
      throw new NotFoundException(`post with id ${id} not found`);
    }

    this.posts[currentPostIndexToEdit] = {
      ...this.posts[currentPostIndexToEdit],
      ...updatePostData,
      updatedAt: new Date(),
    };

    return this.posts[currentPostIndexToEdit];
  }

  remove(id: number): { message: string } {
    const cuurentPostIndex = this.posts.findIndex((post) => post.id === id);

    if (cuurentPostIndex === -1) {
      throw new NotFoundException(`Post with Id ${id} not found`);
    }

    this.posts.splice(cuurentPostIndex, 1);

    return { message: `Post with id ${id} has been deleted` };
  }
}
