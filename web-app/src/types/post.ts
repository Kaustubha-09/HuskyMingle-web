export interface PostAuthor {
  id: string;
  username: string;
  profile?: {
    name: string;
    avatar?: string;
    university?: string;
  };
}

export interface Post {
  id: string;
  content: string;
  title?: string;
  mediaUrls?: string[];
  hashtags?: string[];
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isEdited: boolean;
  visibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
  createdAt: string;
  author: PostAuthor;
  reactions?: { type: string }[];
  _count?: {
    comments: number;
    reactions: number;
  };
}
