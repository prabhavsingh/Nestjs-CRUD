export interface Post {
  id: number;
  title: string;
  content: string;
  authorname: string;
  createdAt: Date;
  updatedAt?: Date;
}
