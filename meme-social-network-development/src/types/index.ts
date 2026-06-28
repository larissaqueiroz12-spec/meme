export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  humor_style: string | null;
  created_at: string;
  updated_at: string;
  posts_count?: number;
  followers_count?: number;
  following_count?: number;
}

export interface Video {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  video_url: string;
  thumbnail: string | null;
  status: 'published' | 'draft' | 'archived';
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  user_has_liked?: boolean;
}

export interface Comment {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}
