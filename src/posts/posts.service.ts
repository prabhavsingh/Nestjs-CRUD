import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Post } from './entities/post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dtos/create-post.dto';
import { UpdatePostDto } from './dtos/update-post.dto';
import { User, UserRole } from '../auth/entities/user-entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { FindPostsQueryDto } from './dtos/find-post-query.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interfcae';
import type { Cache } from 'cache-manager';

@Injectable()
export class PostsService {
  private postListCacheKeys: Set<string> = new Set();

  private generatePostsListCacheKey(query: FindPostsQueryDto): string {
    const { page = 1, limit = 10, title } = query;
    return `posts_list_page${page}_limit${limit}_title${title || 'all'}`;
  }

  private async invalidateAllExistingListCaches() {
    console.log(
      `Invalidating ${this.postListCacheKeys.size} list cache entries`,
    );

    for (const key of this.postListCacheKeys) {
      await this.cacheManager.del(key);
    }

    this.postListCacheKeys.clear();
  }

  constructor(
    @InjectRepository(Post) private postsRepository: Repository<Post>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll(query: FindPostsQueryDto): Promise<PaginatedResponse<Post>> {
    const cacheKey = this.generatePostsListCacheKey(query);

    this.postListCacheKeys.add(cacheKey);

    const getCachedData =
      await this.cacheManager.get<PaginatedResponse<Post>>(cacheKey);

    if (getCachedData) {
      console.log(
        `Cache Hit ------------> Returning posts list from Cache ${cacheKey}`,
      );
      return getCachedData;
    }

    console.log('Cache Miss ------------> Returning posts list from database');

    const { page = 1, limit = 10, title } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.authorName', 'authorName')
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .limit(limit);

    if (title) {
      queryBuilder.andWhere('post.title ILIKE :title ', {
        title: `%${title}%`,
      });
    }

    const [items, totalItems] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(totalItems / limit);

    const responseResult = {
      items,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },
    };

    await this.cacheManager.set(cacheKey, responseResult, 30000);

    return responseResult;
  }

  async findOne(id: number): Promise<Post> {
    console.log('findOne called for id:', id, 'at', Date.now());
    const cacheKey = `post_${id}`;
    console.log('cahcekey', cacheKey);

    this.postListCacheKeys.add(cacheKey);

    const cachePost = await this.cacheManager.get<Post>(cacheKey);

    if (cachePost) {
      console.log(
        `Cache Hit ------------> Returning post from Cache ${cacheKey}`,
      );
      return cachePost;
    }

    console.log('Cache Miss -----------> Returning post from database');

    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['authorName'],
    });

    if (!post) throw new NotFoundException(`post with id ${id} not found`);

    await this.cacheManager.set(cacheKey, post, 30000);

    return post;
  }

  async create(createPostdata: CreatePostDto, authorName: User): Promise<Post> {
    const newPost = this.postsRepository.create({
      title: createPostdata.title,
      content: createPostdata.content,
      authorName,
    });

    //invalidate the existing cache
    await this.invalidateAllExistingListCaches();

    return this.postsRepository.save(newPost);
  }

  async update(
    id: number,
    updatePostData: UpdatePostDto,
    user: User,
  ): Promise<Post> {
    const findPostToUpdate = await this.findOne(id);
    if (
      findPostToUpdate.authorName.id !== user.id &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('You can only update your own post');
    }

    if (updatePostData.title) {
      findPostToUpdate.title = updatePostData.title;
    }
    if (updatePostData.content) {
      findPostToUpdate.content = updatePostData.content;
    }

    const updatedPost = await this.postsRepository.save(findPostToUpdate);

    // await this.cacheManager.del(`post_${id}`);
    await this.invalidateAllExistingListCaches();

    return updatedPost;
  }

  async remove(id: number) {
    const findPostTodelete = await this.findOne(id);

    await this.postsRepository.remove(findPostTodelete);
    // await this.cacheManager.del(`post_${id}`);

    await this.invalidateAllExistingListCaches();
  }
}
