<?php

namespace App\Http\Controllers;

use App\Models\Community;
use App\Models\CommunityJoinRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MyCommunityController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'tab' => [
                'nullable',
                'string',
                Rule::in(['owned', 'joined']),
            ],
            'search' => [
                'nullable',
                'string',
                'max:100',
            ],
        ]);

        $user = $request->user();

        $tab = $validated['tab'] ?? 'owned';
        $search = trim($validated['search'] ?? '');

        /*
         * Count only active communities.
         *
         * A creator is automatically added to community_user,
         * so Joined must explicitly exclude communities they own.
         */
        $ownedCount = Community::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->count();

        $joinedCount = $user->joinedCommunities()
            ->where('communities.status', 'active')
            ->where('communities.user_id', '!=', $user->id)
            ->count();

        /*
         * Build the active tab query.
         */
        if ($tab === 'owned') {
            $communitiesQuery = Community::query()
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->withCount('members');
        } else {
            $communitiesQuery = $user->joinedCommunities()
                ->where('communities.status', 'active')
                ->where('communities.user_id', '!=', $user->id)
                ->withCount('members');
        }

        /*
         * Search is restricted to the active tab.
         */
        if ($search !== '') {
            $communitiesQuery->where(function ($query) use ($search) {
                $query->where(
                    'communities.name',
                    'like',
                    "%{$search}%"
                )->orWhere(
                    'communities.description',
                    'like',
                    "%{$search}%"
                );
            });
        }

        $communities = $communitiesQuery
            ->orderBy('communities.name')
            ->paginate(12)
            ->withQueryString();

        /*
         * Convert stored image paths into public URLs.
         */
        $communities->getCollection()->transform(
            function (Community $community) {
                $community->setAttribute(
                    'image_url',
                    $community->image_path
                        ? Storage::disk('public')->url(
                            $community->image_path
                        )
                        : null
                );

                return $community;
            }
        );

        /*
         * Retrieve pending requests only for the Owned tab.
         *
         * This is a separate paginator so a large number of
         * membership requests cannot make the page excessively large.
         */
        $pendingRequests = null;

        if ($tab === 'owned') {
            $pendingRequests = CommunityJoinRequest::query()
                ->where('status', 'pending')
                ->whereHas('community', function ($query) use ($user) {
                    $query
                        ->where('user_id', $user->id)
                        ->where('status', 'active');
                })
                ->with([
                    'user:id,username',
                    'community:id,user_id,name,slug,image_path',
                ])
                ->orderBy('created_at')
                ->paginate(
                    10,
                    ['*'],
                    'requests_page'
                )
                ->withQueryString();

            $pendingRequests->getCollection()->transform(
                function (CommunityJoinRequest $joinRequest) {
                    if ($joinRequest->community) {
                        $joinRequest->community->setAttribute(
                            'image_url',
                            $joinRequest->community->image_path
                                ? Storage::disk('public')->url(
                                    $joinRequest->community->image_path
                                )
                                : null
                        );
                    }

                    $joinRequest->setAttribute(
                        'requester_username',
                        $joinRequest->user?->username ?? 'Deleted user'
                    );

                    return $joinRequest;
                }
            );
        }

        return Inertia::render('my-communities/index', [
            'communities' => $communities,
            'pendingRequests' => $pendingRequests,
            'counts' => [
                'owned' => $ownedCount,
                'joined' => $joinedCount,
            ],
            'filters' => [
                'tab' => $tab,
                'search' => $search,
            ],
        ]);
    }
}