<?php

namespace App\Http\Controllers;

use App\Models\Community;
use App\Models\CommunityJoinRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class CommunityController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:50'],
        ]);

        $user = $request->user();

        $query = Community::query()
            ->where('status', 'active')
            ->with([
                'creator' => function ($query) {
                    $query->select('id', 'username');
                },
                'members' => function ($query) {
                    $query->select('users.id', 'users.username')
                        ->limit(3);
                },
            ])
            ->withCount('members')
            ->latest();

        if (! empty($validated['search'])) {
            $search = trim($validated['search']);

            $query->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (! empty($validated['category'])) {
            $query->where('category', $validated['category']);
        }

        $communities = $query->paginate(12)->withQueryString();

        $communityIds = $communities->getCollection()
            ->pluck('id')
            ->map(fn ($id) => (int) $id);

        $ownedIds = $communities->getCollection()
            ->where('user_id', $user->id)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $joinedIds = $user->joinedCommunities()
            ->whereIn('communities.id', $communityIds)
            ->pluck('communities.id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $userRequestStatuses = CommunityJoinRequest::query()
            ->where('user_id', $user->id)
            ->whereIn('community_id', $communityIds)
            ->pluck('status', 'community_id');

        $pendingCounts = [];

        if (! empty($ownedIds)) {
            $pendingCounts = CommunityJoinRequest::query()
                ->select('community_id')
                ->selectRaw('COUNT(*) as aggregate')
                ->whereIn('community_id', $ownedIds)
                ->where('status', 'pending')
                ->groupBy('community_id')
                ->pluck('aggregate', 'community_id')
                ->all();
        }

        /*
         * Fetch at most 50 pending requests per owned community.
         * This avoids loading an unlimited number of requests into the page.
         */
        $pendingRequestsByCommunity = [];

        foreach ($ownedIds as $ownedId) {
            $requests = CommunityJoinRequest::query()
                ->where('community_id', $ownedId)
                ->where('status', 'pending')
                ->with([
                    'user' => function ($query) {
                        $query->select('id', 'username');
                    },
                ])
                ->orderBy('created_at')
                ->orderBy('id')
                ->limit(50)
                ->get();

            $pendingRequestsByCommunity[$ownedId] = $requests
                ->map(function (CommunityJoinRequest $joinRequest) {
                    return [
                        'id' => (int) $joinRequest->id,
                        'user_id' => (int) $joinRequest->user_id,
                        'username' => $joinRequest->user->username,
                        'created_at' => $joinRequest->created_at?->toISOString(),
                    ];
                })
                ->values()
                ->all();
        }

        $communities->getCollection()->transform(
            function (Community $community) use (
                $user,
                $joinedIds,
                $userRequestStatuses,
                $pendingCounts,
                $pendingRequestsByCommunity
            ) {
                $communityId = (int) $community->id;

                $isOwner = (int) $community->user_id === (int) $user->id;
                $isMember = $isOwner || in_array($communityId, $joinedIds, true);

                $community->is_owner = $isOwner;
                $community->is_member = $isMember;

                $community->join_request_status =
                    $userRequestStatuses[$communityId] ?? null;

                $community->pending_join_requests_count = $isOwner
                    ? (int) ($pendingCounts[$communityId] ?? 0)
                    : 0;

                $community->pending_join_requests = $isOwner
                    ? ($pendingRequestsByCommunity[$communityId] ?? [])
                    : [];

                $community->image_url = $community->image_path
                    ? Storage::disk('public')->url($community->image_path)
                    : null;

                /*
                 * Do not expose private community member previews to
                 * people who are not members or the community owner.
                 */
                if ($community->visibility === 'private' && ! $isMember) {
                    $community->setRelation('members', collect());
                }

                return $community;
            }
        );

        $categories = Community::query()
            ->where('status', 'active')
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('communities/index', [
            'communities' => $communities,
            'categories' => $categories,
            'filters' => [
                'search' => $validated['search'] ?? '',
                'category' => $validated['category'] ?? '',
            ],
        ]);
    }

    public function show(
        Request $request,
        Community $community
    ): Response {
        abort_unless($community->status === 'active', 404);

        $user = $request->user();

        $isOwner = (int) $community->user_id === (int) $user->id;

        $isMember = $isOwner || $community->members()
            ->where('users.id', $user->id)
            ->exists();

        // Public posts can be viewed by all signed-in users.
        // Private posts are visible only to approved members and the owner.
        $canViewPosts = $community->visibility === 'public' || $isMember;

        $canPost = $isMember;

        $joinRequestStatus = CommunityJoinRequest::query()
            ->where('community_id', $community->id)
            ->where('user_id', $user->id)
            ->value('status');

        $community->load('creator:id,username');
        $community->loadCount('members');

        $communityData = [
            'id' => $community->id,
            'name' => $community->name,
            'slug' => $community->slug,
            'description' => $community->description,
            'category' => $community->category,
            'visibility' => $community->visibility,
            'image_url' => $community->image_path
                ? Storage::disk('public')->url($community->image_path)
                : null,

            // Do not expose the membership count of a private community
            // to users who are not members.
            'members_count' => (
                $community->visibility === 'private' && ! $isMember
            ) ? null : $community->members_count,

            'creator' => [
                'id' => $community->creator?->id,
                'username' => $community->creator->username,
            ],

            'is_owner' => $isOwner,
            'is_member' => $isMember,
            'join_request_status' => $joinRequestStatus,
        ];

        $postsQuery = $community->posts()
            ->with([
                'user:id,username',
                'community:id,name,slug,visibility,status',
                'media',
                'comments' => function ($query) {
                    $query
                        ->whereNull('parent_id')
                        ->with([
                            'user:id,username',
                            'replies.user:id,username',
                        ])
                        ->latest()
                        ->limit(3);
                },
                'reactions' => function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                },
            ])
            ->withCount([
                'reactions',
                'comments',
                'shares',
            ])
            ->withExists([
                'savedPosts as is_saved' => fn ($query) => $query
                    ->where('user_id', $user->id),
            ]);

        if (! $canViewPosts) {
            // Return an empty paginator rather than querying private posts
            // and attempting to hide them in the frontend.
            $postsQuery->whereRaw('1 = 0');
        }

        $posts = $postsQuery
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('communities/show', [
            'community' => $communityData,
            'posts' => $posts,
            'can_view_posts' => $canViewPosts,
            'can_post' => $canPost,

            // The community page composer receives only its selected community.
            'communities' => $canPost
                ? [
                    [
                        'id' => $community->id,
                        'name' => $community->name,
                    ],
                ]
                : [],
        ]);
    }

    public function create(): Response
    {
        $categories = Community::query()
            ->where('status', 'active')
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('communities/create', [
            'categories' => $categories,
            'visibilities' => ['public', 'private'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:3', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
            'category' => ['required', 'string', 'max:50'],
            'category_mode' => ['nullable', 'string', 'in:existing,new'],
            'visibility' => ['required', 'string', 'in:public,private'],
            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ]);

        $name = trim($validated['name']);
        $categoryInput = trim($validated['category']);
        $normalizedName = mb_strtolower($name);
        $categoryMode = $validated['category_mode'] ?? null;

        if ($name === '') {
            throw ValidationException::withMessages([
                'name' => 'Community name cannot be empty.',
            ]);
        }

        if ($categoryInput === '') {
            throw ValidationException::withMessages([
                'category' => 'Please select or enter a category.',
            ]);
        }

        $duplicateName = Community::query()
            ->where('normalized_name', $normalizedName)
            ->exists();

        if ($duplicateName) {
            throw ValidationException::withMessages([
                'name' => 'A community with this name already exists.',
            ]);
        }

        $existingCategory = Community::query()
            ->where('status', 'active')
            ->whereRaw('LOWER(TRIM(category)) = ?', [
                mb_strtolower($categoryInput),
            ])
            ->orderBy('category')
            ->value('category');

        if ($categoryMode === 'existing' && ! $existingCategory) {
            throw ValidationException::withMessages([
                'category' => 'The selected category no longer exists. Please select another category.',
            ]);
        }

        if ($categoryMode === 'new' && $existingCategory) {
            throw ValidationException::withMessages([
                'category' => 'This category already exists. Please select it from the existing categories.',
            ]);
        }

        // The Discover page sends category_mode. The create page may omit it.
        $category = $existingCategory ?? $categoryInput;

        $imagePath = null;

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('communities', 'public');

            if (! $imagePath) {
                throw ValidationException::withMessages([
                    'image' => 'The community image could not be uploaded. Please try again.',
                ]);
            }
        }

        try {
            DB::transaction(function () use (
                $request,
                $validated,
                $name,
                $category,
                $imagePath
            ) {
                $baseSlug = Str::slug($name);

                if ($baseSlug === '') {
                    $baseSlug = 'community';
                }

                $slug = $baseSlug;

                while (Community::query()->where('slug', $slug)->exists()) {
                    $slug = $baseSlug.'-'.Str::lower(Str::random(6));
                }

                Community::create([
                    'user_id' => $request->user()->id,
                    'name' => $name,
                    'slug' => $slug,
                    'description' => isset($validated['description'])
                        ? trim($validated['description'])
                        : null,
                    'category' => $category,
                    'visibility' => $validated['visibility'],
                    'status' => 'active',
                    'image_path' => $imagePath,
                ]);
            });

            return redirect()
                ->route('communities.index')
                ->with('success', 'Your community has been created successfully.');
        } catch (Throwable $exception) {
            if ($imagePath) {
                Storage::disk('public')->delete($imagePath);
            }

            report($exception);

            if (
                Community::query()
                    ->where('normalized_name', $normalizedName)
                    ->exists()
            ) {
                throw ValidationException::withMessages([
                    'name' => 'A community with this name already exists.',
                ]);
            }

            throw $exception;
        }
    }

    public function join(Community $community): RedirectResponse
    {
        $user = request()->user();

        $result = DB::transaction(function () use ($community, $user): string {
            $lockedCommunity = Community::query()
                ->whereKey($community->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedCommunity->status !== 'active') {
                return 'unavailable';
            }

            if ((int) $lockedCommunity->user_id === (int) $user->id) {
                return 'owner';
            }

            $alreadyMember = $lockedCommunity->members()
                ->where('users.id', $user->id)
                ->exists();

            if ($alreadyMember) {
                return 'already_member';
            }

            $existingRequest = CommunityJoinRequest::query()
                ->where('community_id', $lockedCommunity->id)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->first();

            if ($lockedCommunity->visibility === 'public') {
                $lockedCommunity->members()->syncWithoutDetaching([
                    $user->id,
                ]);

                if ($existingRequest) {
                    $existingRequest->update([
                        'status' => 'approved',
                        'reviewed_by' => $lockedCommunity->user_id,
                        'reviewed_at' => now(),
                    ]);
                }

                return 'joined';
            }

            if ($existingRequest?->status === 'pending') {
                return 'pending';
            }

            if ($existingRequest) {
                $existingRequest->update([
                    'status' => 'pending',
                    'reviewed_by' => null,
                    'reviewed_at' => null,
                ]);
            } else {
                CommunityJoinRequest::create([
                    'community_id' => $lockedCommunity->id,
                    'user_id' => $user->id,
                    'status' => 'pending',
                ]);
            }

            return 'requested';
        });

        /** @var string $result */
        return match ($result) {
            'unavailable' => back()->with('error', 'This community is no longer available.'),
            'owner' => back()->with('info', 'You are already the owner of this community.'),
            'already_member' => back()->with('info', 'You are already a member of this community.'),
            'pending' => back()->with('info', 'Your join request is already pending.'),
            'joined' => back()->with('success', 'You have successfully joined the community.'),
            'requested' => back()->with('success', 'Your join request has been submitted.'),
            default => back()->with('error', 'Something went wrong. Please try again.'),
        };
    }

    public function approveJoinRequest(
        Community $community,
        CommunityJoinRequest $joinRequest
    ): RedirectResponse {
        $this->ensureCommunityOwner($community);

        $result = DB::transaction(function () use ($community, $joinRequest) {
            $lockedCommunity = Community::query()
                ->whereKey($community->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedCommunity->status !== 'active') {
                return 'unavailable';
            }

            $lockedRequest = CommunityJoinRequest::query()
                ->whereKey($joinRequest->id)
                ->where('community_id', $lockedCommunity->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedRequest->status !== 'pending') {
                return 'already_reviewed';
            }

            $lockedRequest->update([
                'status' => 'approved',
                'reviewed_by' => request()->user()->id,
                'reviewed_at' => now(),
            ]);

            $lockedCommunity->members()->syncWithoutDetaching([
                $lockedRequest->user_id,
            ]);

            return 'approved';
        });

        return match ($result) {
            'unavailable' => back()->with('error', 'This community is no longer available.'),
            'already_reviewed' => back()->with('info', 'This join request has already been reviewed.'),
            default => back()->with('success', 'Join request approved successfully.'),
        };
    }

    public function rejectJoinRequest(
        Community $community,
        CommunityJoinRequest $joinRequest
    ): RedirectResponse {
        $this->ensureCommunityOwner($community);

        $result = DB::transaction(function () use ($community, $joinRequest) {
            $lockedCommunity = Community::query()
                ->whereKey($community->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedCommunity->status !== 'active') {
                return 'unavailable';
            }

            $lockedRequest = CommunityJoinRequest::query()
                ->whereKey($joinRequest->id)
                ->where('community_id', $lockedCommunity->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedRequest->status !== 'pending') {
                return 'already_reviewed';
            }

            $lockedRequest->update([
                'status' => 'rejected',
                'reviewed_by' => request()->user()->id,
                'reviewed_at' => now(),
            ]);

            return 'rejected';
        });

        return match ($result) {
            'unavailable' => back()->with('error', 'This community is no longer available.'),
            'already_reviewed' => back()->with('info', 'This join request has already been reviewed.'),
            default => back()->with('success', 'Join request rejected.'),
        };
    }

    public function leave(Community $community): RedirectResponse
    {
        $user = request()->user();

        $result = DB::transaction(function () use ($community, $user) {
            $lockedCommunity = Community::query()
                ->whereKey($community->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedCommunity->status !== 'active') {
                return 'unavailable';
            }

            if ((int) $lockedCommunity->user_id === (int) $user->id) {
                return 'owner';
            }

            $isMember = $lockedCommunity->members()
                ->where('users.id', $user->id)
                ->exists();

            if (! $isMember) {
                return 'not_member';
            }

            $lockedCommunity->members()->detach($user->id);

            return 'left';
        });

        return match ($result) {
            'unavailable' => back()->with('error', 'This community is no longer available.'),
            'owner' => back()->with('error', 'The community owner cannot leave their own community.'),
            'not_member' => back()->with('info', 'You are not a member of this community.'),
            default => back()->with('success', 'You have left the community.'),
        };
    }

    private function ensureCommunityOwner(Community $community): void
    {
        abort_unless(
            (int) $community->user_id === (int) request()->user()->id,
            403,
            'You are not authorized to manage this community.'
        );
    }
}
