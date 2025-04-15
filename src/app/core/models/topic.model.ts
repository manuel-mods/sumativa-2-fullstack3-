export interface Topic {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  commentsCount: number;
  isBanned?: boolean;
}