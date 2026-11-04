<?php

namespace Tests\Feature;

use App\Models\Community;
use App\Models\Post;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunityAccessTest extends TestCase
{
    use RefreshDatabase;

    private function createUser(): User
    {
        $role = Role::firstOrCreate([
            'name' => 'user',
        ]);

        return User::factory()->create([
            'role_id' => $role->id,
        ]);
    }

    private function createCommunity(
        User $owner,
        string $visibility = 'public',
        string $status = 'active'
    ): Community {
        static $communityNumber = 0;

        $communityNumber++;

        return Community::create([
            'user_id' => $owner->id,
            'name' => 'Test Community ' . $communityNumber,
            'slug' => 'test-community-' . $communityNumber,
            'description' => 'Community created for feature testing.',
            'category' => 'General',
            'visibility' => $visibility,
            'status' => $status,
        ]);
    }

    private function createPost(
        Community $community,
        User $author
    ): Post {
        return Post::create([
            'user_id' => $author->id,
            'community_id' => $community->id,
            'title' => 'Private Access Test Post',
            'body' => 'Testing community post access.',
        ]);
    }

    public function test_non_members_can_access_public_community_posts(): void
    {
        $owner = $this->createUser();
        $visitor = $this->createUser();

        $community = $this->createCommunity($owner, 'public');
        $post = $this->createPost($community, $owner);

        $this->actingAs($visitor)
            ->get(route('posts.comments.index', $post))
            ->assertOk();
    }

    public function test_non_members_cannot_access_private_community_comments(): void
    {
        $owner = $this->createUser();
        $visitor = $this->createUser();

        $community = $this->createCommunity($owner, 'private');
        $post = $this->createPost($community, $owner);

        $this->actingAs($visitor)
            ->get(route('posts.comments.index', $post))
            ->assertNotFound();
    }

    public function test_approved_members_can_access_private_community_comments(): void
    {
        $owner = $this->createUser();
        $member = $this->createUser();

        $community = $this->createCommunity($owner, 'private');

        $community->members()->attach($member->id);

        $post = $this->createPost($community, $owner);

        $this->actingAs($member)
            ->get(route('posts.comments.index', $post))
            ->assertOk();
    }

    public function test_non_members_cannot_react_to_private_community_posts(): void
    {
        $owner = $this->createUser();
        $visitor = $this->createUser();

        $community = $this->createCommunity($owner, 'private');
        $post = $this->createPost($community, $owner);

        $this->actingAs($visitor)
            ->post(route('posts.reaction.toggle', $post), [
                'type' => 'like',
            ])
            ->assertNotFound();

        $this->assertDatabaseMissing('post_reactions', [
            'post_id' => $post->id,
            'user_id' => $visitor->id,
        ]);
    }

    public function test_non_members_cannot_comment_on_private_community_posts(): void
    {
        $owner = $this->createUser();
        $visitor = $this->createUser();

        $community = $this->createCommunity($owner, 'private');
        $post = $this->createPost($community, $owner);

        $this->actingAs($visitor)
            ->post(route('posts.comments.store', $post), [
                'body' => 'This should not be allowed.',
            ])
            ->assertNotFound();

        $this->assertDatabaseMissing('comments', [
            'post_id' => $post->id,
            'user_id' => $visitor->id,
        ]);
    }

    public function test_non_members_cannot_share_private_community_posts(): void
    {
        $owner = $this->createUser();
        $visitor = $this->createUser();

        $community = $this->createCommunity($owner, 'private');
        $post = $this->createPost($community, $owner);

        $this->actingAs($visitor)
            ->post(route('posts.share', $post))
            ->assertNotFound();

        $this->assertDatabaseMissing('post_shares', [
            'post_id' => $post->id,
            'user_id' => $visitor->id,
        ]);
    }

    public function test_pending_members_cannot_access_private_community_posts(): void
    {
        $owner = $this->createUser();
        $applicant = $this->createUser();

        $community = $this->createCommunity($owner, 'private');

        $community->joinRequests()->create([
            'user_id' => $applicant->id,
            'status' => 'pending',
        ]);

        $post = $this->createPost($community, $owner);

        $this->actingAs($applicant)
            ->get(route('posts.comments.index', $post))
            ->assertNotFound();
    }

    public function test_suspended_community_posts_are_inaccessible(): void
    {
        $owner = $this->createUser();

        $community = $this->createCommunity(
            $owner,
            'public',
            'suspended'
        );

        $post = $this->createPost($community, $owner);

        $this->actingAs($owner)
            ->get(route('posts.comments.index', $post))
            ->assertNotFound();
    }

    public function test_non_members_cannot_edit_comments_in_private_communities(): void
    {
        $owner = $this->createUser();
        $visitor = $this->createUser();

        $community = $this->createCommunity($owner, 'private');
        $post = $this->createPost($community, $owner);

        $comment = $post->comments()->create([
            'user_id' => $owner->id,
            'body' => 'Original comment.',
        ]);

        // The visitor must not be able to edit another user's comment.
        $this->actingAs($visitor)
            ->patch(route('comments.update', $comment), [
                'body' => 'Unauthorized edit.',
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('comments', [
            'id' => $comment->id,
            'body' => 'Original comment.',
        ]);
    }
}
