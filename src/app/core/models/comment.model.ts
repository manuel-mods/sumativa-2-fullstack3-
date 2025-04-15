export interface Comment {
  id: string;
  topicId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  isReported?: boolean;
}