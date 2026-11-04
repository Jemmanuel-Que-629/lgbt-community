<?php

namespace App\Http\Controllers;

use App\Models\Community;
use App\Models\CommunityJoinRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CommunityController extends Controller
{
    /**
     * Return categories currently used by active communities.
     * Categories are stored directly on communities; no separate catalog is needed.
     */
    private function availableCategories(): array
    {
        return Community::query()
            ->where('status', 'active')
            ->whereNotNull('category')
            ->whereRaw("TRIM(category) <> ''")
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->map(fn ($category) => trim($category))
            ->filter(fn ($category) => $category !== '')
            ->unique(fn ($category) => Str::lower($category))
            ->values()
            ->all();
    }

    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:50'],
        ]);

        $user = $request->user();
        $search = trim($validated['search'] ?? '');
        $category = $validated['category'] ?? '';

        $communities = Community::query()
            ->where('status', 'active')
            ->with('creator:id,username')
            ->withCount('members')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($category !== '', function ($query) use ($category) {
                $query->where('category', $category);
            })
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString();

        $communityIds = $communities->getCollection()
            ->pluck('id');

        // Membership IDs for the current page.
        $joinedIds = $user->joinedCommunities()
            ->whereIn('communities.id', $communityIds)
            ->pluck('communities.id')
            ->map(fn ($id) => (int) $id)
            ->all();

        // Private community member previews are only visible to members.
        $previewCommunityIds = $communities->getCollection()
            ->filter(function (Community $community) use ($joinedIds) {
                return $community->visibility === 'public'
                    || in_array(
                        (int) $community->id,
                        $joinedIds,
                        true
                    );
            })
            ->pluck('id')
            ->all();

        $communities->load([
            'members' => function ($query) use ($previewCommunityIds) {
                $query
                    ->wherePivotIn(
                        'community_id',
                        $previewCommunityIds
                    )
                    ->select('users.id', 'users.username')
                    ->limit(3);
            },
        ]);

        // Current user's join-request statuses.
        $requestStatuses = CommunityJoinRequest::query()
            ->where('user_id', $user->id)
            ->whereIn('community_id', $communityIds)
            ->pluck('status', 'community_id');

        // Only retrieve pending request details for communities owned
        // by the current user. Never expose these details to other users.
        $ownedCommunityIds = $communities->getCollection()
            ->filter(
                fn (Community $community) =>
                    (int) $community->user_id === (int) $user->id
            )
            ->pluck('id')
            ->all();

        $pendingRequestsByCommunity = collect();

        if (! empty($ownedCommunityIds)) {
            $pendingRequestsByCommunity = CommunityJoinRequest::query()
                ->with('user:id,username')
                ->whereIn('community_id', $ownedCommunityIds)
                ->where('status', 'pending')
                ->orderBy('created_at')
                ->get()
                ->groupBy('community_id');
        }

        $communities->getCollection()->transform(
            function (Community $community) use (
                $user,
                $joinedIds,
                $requestStatuses,
                $pendingRequestsByCommunity
            ) {
                $isMember = in_array(
                    (int) $community->id,
                    $joinedIds,
                    true
                );

                $isOwner = (int) $community->user_id === (int) $user->id;

                $community->setAttribute('is_member', $isMember);
                $community->setAttribute('is_owner', $isOwner);

                $community->setAttribute(
                    'join_request_status',
                    $requestStatuses->get($community->id)
                );

                $community->setAttribute(
                    'image_url',
                    $community->image_path
                        ? Storage::disk('public')->url(
                            $community->image_path
                        )
                        : null
                );

                if ($isOwner) {
                    $pendingRequests = $pendingRequestsByCommunity->get(
                        $community->id,
                        collect()
                    );

                    $community->setAttribute(
                        'pending_join_requests_count',
                        $pendingRequests->count()
                    );

                    $community->setAttribute(
                        'pending_join_requests',
                        $pendingRequests->map(function (
                            CommunityJoinRequest $joinRequest
                        ) {
                            return [
                                'id' => $joinRequest->id,
                                'user_id' => $joinRequest->user_id,
                                'username' => $joinRequest->user?->username
                                    ?? 'Deleted user',
                                'created_at' => $joinRequest->created_at
                                    ?->toISOString(),
                            ];
                        })->values()
                    );
                } else {
                    $community->setAttribute(
                        'pending_join_requests_count',
                        0
                    );

                    $community->setAttribute(
                        'pending_join_requests',
                        []
                    );
                }

                return $community;
            }
        );

        return Inertia::render('communities/index', [
            'communities' => $communities,
            'filters' => [
                'search' => $search,
                'category' => $category,
            ],
            'categories' => $this->availableCategories(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('communities/create', [
            'categories' => $this->availableCategories(),
            'visibilities' => [
                'public',
                'private',
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge([
            'name' => trim((string) $request->input('name')),
            'category' => trim((string) $request->input('category')),
        ]);

        $validated = $request->validate([
            'category_mode' => [
                'required',
                'string',
                Rule::in(['existing', 'new']),
            ],
            'name' => [
                'required',
                'string',
                'min:3',
                'max:80',
                function ($attribute, $value, $fail) {
                    $normalizedName = Str::lower(trim($value));

                    $exists = Community::query()
                        ->where('normalized_name', $normalizedName)
                        ->exists();

                    if ($exists) {
                        $fail('This community name is already taken.');
                    }
                },
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'category' => [
                'required',
                'string',
                'min:1',
                'max:50',
                function ($attribute, $value, $fail) use ($request) {
                    $normalizedCategory = Str::lower(trim($value));

                    $categoryQuery = Community::query()
                        ->whereNotNull('category')
                        ->whereRaw('LOWER(TRIM(category)) = ?', [
                            $normalizedCategory,
                        ]);

                    if ($request->input('category_mode') === 'new') {
                        if ($categoryQuery->exists()) {
                            $fail('This category already exists. Please choose it from the existing categories dropdown.');
                        }

                        return;
                    }

                    $existingActiveCategory = (clone $categoryQuery)
                        ->where('status', 'active')
                        ->exists();

                    if (! $existingActiveCategory) {
                        $fail('Please choose a category from the existing categories dropdown.');
                    }
                },
            ],
            'visibility' => [
                'required',
                'string',
                Rule::in(['public', 'private']),
            ],
            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ]);

        // Preserve the database's existing category spelling when an
        // existing category was selected. New categories retain user input.
        $category = $validated['category'];

        if ($validated['category_mode'] === 'existing') {
            $category = trim((string) Community::query()
                ->where('status', 'active')
                ->whereNotNull('category')
                ->whereRaw('LOWER(TRIM(category)) = ?', [
                    Str::lower($validated['category']),
                ])
                ->value('category'));
        }

        $baseSlug = Str::slug($validated['name']);

        if ($baseSlug === '') {
            $baseSlug = 'community';
        }

        $slug = $baseSlug;
        $counter = 1;

        while (Community::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        $imagePath = null;

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')
                ->store('communities', 'public');
        }

        try {
            $request->user()->communities()->create([
                'name' => $validated['name'],
                'slug' => $slug,
                'description' => $validated['description'] ?? null,
                'category' => $category,
                'visibility' => $validated['visibility'],
                'status' => 'active',
                'image_path' => $imagePath,
            ]);
        } catch (\Throwable $exception) {
            if ($imagePath !== null) {
                Storage::disk('public')->delete($imagePath);
            }

            throw $exception;
        }

        return redirect()
            ->route('communities.index')
            ->with('success', 'Your community has been created!');
    }

    public function join(
        Request $request,
        Community $community
    ): RedirectResponse {
        $user = $request->user();

        $result = DB::transaction(function () use ($community, $user) {
            // Serialize membership requests for this community.
            $lockedCommunity = Community::query()
                ->whereKey($community->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless($lockedCommunity->status === 'active', 404);

            if ((int) $lockedCommunity->user_id === (int) $user->id) {
                return 'owner';
            }

            $isMember = $user->joinedCommunities()
                ->where('communities.id', $lockedCommunity->id)
                ->exists();

            if ($isMember) {
                return 'member';
            }

            // Public communities allow immediate membership.
            if ($lockedCommunity->visibility === 'public') {
                $user->joinedCommunities()
                    ->syncWithoutDetaching([$lockedCommunity->id]);

                CommunityJoinRequest::query()
                    ->where('community_id', $lockedCommunity->id)
                    ->where('user_id', $user->id)
                    ->where('status', '!=', 'approved')
                    ->update([
                        'status' => 'approved',
                        'reviewed_by' => null,
                        'reviewed_at' => null,
                        'updated_at' => now(),
                    ]);

                return 'joined';
            }

            // Private communities require owner approval.
            $joinRequest = CommunityJoinRequest::query()
                ->firstOrNew([
                    'community_id' => $lockedCommunity->id,
                    'user_id' => $user->id,
                ]);

            if (
                $joinRequest->exists
                && $joinRequest->status === 'pending'
            ) {
                return 'pending';
            }

            // Reuse an existing rejected or previously approved request.
            $joinRequest->status = 'pending';
            $joinRequest->reviewed_by = null;
            $joinRequest->reviewed_at = null;
            $joinRequest->save();

            return 'requested';
        });

        return match ($result) {
            'owner' => back()->with(
                'success',
                'You already own this community.'
            ),
            'member' => back()->with(
                'success',
                'You are already a member of this community.'
            ),
            'joined' => back()->with(
                'success',
                "You've joined {$community->name}."
            ),
            'pending' => back()->with(
                'success',
                'Your request is already waiting for approval.'
            ),
            default => back()->with(
                'success',
                'Your request to join this private community has been submitted.'
            ),
        };
    }

    public function approveJoinRequest(
        Request $request,
        Community $community,
        CommunityJoinRequest $joinRequest
    ): RedirectResponse {
        $this->ensureCommunityOwner($request, $community);

        DB::transaction(function () use (
            $request,
            $community,
            $joinRequest
        ) {
            $lockedCommunity = Community::query()
                ->whereKey($community->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureCommunityOwner($request, $lockedCommunity);

            abort_unless($lockedCommunity->status === 'active', 404);

            $lockedRequest = $lockedCommunity->joinRequests()
                ->whereKey($joinRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless($lockedRequest->status === 'pending', 404);

            abort_unless(
                (int) $lockedRequest->user_id !== (int) $lockedCommunity->user_id,
                422
            );

            $lockedRequest->update([
                'status' => 'approved',
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);

            $lockedCommunity->members()->syncWithoutDetaching([
                $lockedRequest->user_id,
            ]);
        });

        return back()->with(
            'success',
            'The membership request has been approved.'
        );
    }

    public function rejectJoinRequest(
        Request $request,
        Community $community,
        CommunityJoinRequest $joinRequest
    ): RedirectResponse {
        $this->ensureCommunityOwner($request, $community);

        DB::transaction(function () use (
            $request,
            $community,
            $joinRequest
        ) {
            $lockedCommunity = Community::query()
                ->whereKey($community->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureCommunityOwner($request, $lockedCommunity);

            $lockedRequest = $lockedCommunity->joinRequests()
                ->whereKey($joinRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless($lockedRequest->status === 'pending', 404);

            $lockedRequest->update([
                'status' => 'rejected',
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);
        });

        return back()->with(
            'success',
            'The membership request has been rejected.'
        );
    }

    public function leave(
        Request $request,
        Community $community
    ): RedirectResponse {
        abort_unless($community->status === 'active', 404);

        if ((int) $community->user_id === (int) $request->user()->id) {
            return back()->withErrors([
                'community' => 'Community owners cannot leave their own community.',
            ]);
        }

        $request->user()
            ->joinedCommunities()
            ->detach($community->id);

        return back()->with(
            'success',
            "You've left {$community->name}."
        );
    }

    private function ensureCommunityOwner(
        Request $request,
        Community $community
    ): void {
        abort_unless(
            (int) $community->user_id === (int) $request->user()->id,
            403
        );
    }
}
