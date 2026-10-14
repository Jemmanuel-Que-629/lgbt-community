export type User = {
    id: number;
    username: string;
};

export type Community = {
    id: number;
    name: string;
    slug: string;
};

export type CommunityOption = {
    id: number;
    name: string;
};

export type PostMedia = {
    id: number;
    type: 'image' | 'video' | 'gif';
    path: string;
    original_name: string | null;
    mime_type: string | null;
    size: number | null;
};

export type PostReaction = {
    id: number;
    type: string;
};

export type CommentItem = {
    id: number;
    body: string;
    created_at: string;
    user: User;
    parent_id: number | null;
    replies?: CommentItem[];
};

export type Post = {
    id: number;
    title: string;
    body: string | null;
    created_at: string;
    user: User;
    community: Community;
    media: PostMedia[];
    comments: CommentItem[];
    reactions: PostReaction[];
    comments_count: number;
    reactions_count: number;
    shares_count: number;
};

export type PaginatedPosts = {
    data: Post[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};

export type FeedProps = {
    posts: PaginatedPosts;
    communities: CommunityOption[];
};