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
    private const COMMUNITY_PER_PAGE = 12;

    private const REQUESTS_PER_PAGE = 10;

    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'tab' => [
                'nullable',
                'string',
                Rule::in(['owned', 'joined', 'requests']),
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

        // Counts are independent of pagination and search.
        $ownedCount = Community::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->count();

        $joinedCount = $user->joinedCommunities()
            ->where('communities.status', 'active')
            ->where('communities.user_id', '!=', $user->id)
            ->count();

        // Count all pending requests across all active communities
        // owned by the authenticated user.
        $pendingRequestsCount = CommunityJoinRequest::query()
            ->where('status', 'pending')
            ->whereHas('community', function ($query) use ($user) {
                $query
                    ->where('user_id', $user->id)
                    ->where('status', 'active');
            })
            ->count();

        $communities = null;
        $pendingRequests = null;

        if ($tab === 'owned' || $tab === 'joined') {
            if ($tab === 'owned') {
                $communitiesQuery = Community::query()
                    ->where('user_id', $user->id)
                    ->where('status', 'active');
            } else {
                $communitiesQuery = $user->joinedCommunities()
                    ->where('communities.status', 'active')
                    ->where('communities.user_id', '!=', $user->id);
            }

            $communitiesQuery->withCount('members');

            if ($search !== '') {
                $communitiesQuery->where(function ($query) use ($search) {
                    $query
                        ->where('communities.name', 'like', "%{$search}%")
                        ->orWhere(
                            'communities.description',
                            'like',
                            "%{$search}%"
                        );
                });
            }

            $communities = $communitiesQuery
                ->orderBy('communities.name')
                ->paginate(
                    self::COMMUNITY_PER_PAGE,
                    ['communities.*'],
                    'communities_page'
                )
                ->withQueryString();

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
        }

        if ($tab === 'requests') {
            // Clamp the requested page after actions remove requests.
            // This prevents an empty page when the last item on a page
            // has just been approved or rejected.
            $lastPage = max(
                1,
                (int) ceil(
                    $pendingRequestsCount / self::REQUESTS_PER_PAGE
                )
            );

            $requestedPage = max(
                1,
                $request->integer('requests_page', 1)
            );

            $currentPage = min($requestedPage, $lastPage);

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
                ->orderBy('id')
                ->paginate(
                    self::REQUESTS_PER_PAGE,
                    ['*'],
                    'requests_page',
                    $currentPage
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
                        $joinRequest->user->username
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
                'pendingRequests' => $pendingRequestsCount,
            ],
            'filters' => [
                'tab' => $tab,
                'search' => $tab === 'requests' ? '' : $search,
            ],
        ]);
    }
}
