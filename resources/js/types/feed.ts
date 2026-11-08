
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

export type CommunityDetails = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    category: string | null;
    visibility: 'public' | 'private';
    image_url: string | null;
    members_count: number | null;
    creator: User;
    is_owner: boolean;
    is_member: boolean;
    join_request_status: 'pending' | 'approved' | 'rejected' | null;
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
    updated_at: string;
    user: User;
    parent_id: number | null;
    can_edit?: boolean;
    replies?: CommentItem[];
};

export type Post = {
    id: number;
    title: string;
    body: string | null;
    created_at: string;
    is_saved: boolean;
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
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};

export type FeedProps = {
    posts: PaginatedPosts;
    communities: CommunityOption[];
};

export type CommunityShowProps = {
    community: CommunityDetails;
    posts: PaginatedPosts;
    can_view_posts: boolean;
    can_post: boolean;
    communities: CommunityOption[];
};

export type SavedPostCollection = {
    id: number;
    name: string;
    is_default: boolean;
};

export type SavedPostsProps = {
    posts: PaginatedPosts;
    collections: SavedPostCollection[];
    active_collection: number | null;
};
