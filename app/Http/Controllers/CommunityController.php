<?php

namespace App\Http\Controllers;

use App\Models\Community;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommunityController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $search = trim($validated['search'] ?? '');

        $communities = Community::query()
            ->with('creator:id,username')
            ->withCount('members')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString();

        $communityIds = $communities->getCollection()->pluck('id');

        $joinedIds = $request->user()
            ->joinedCommunities()
            ->whereIn('communities.id', $communityIds)
            ->pluck('communities.id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $communities->getCollection()->transform(
            function (Community $community) use ($joinedIds) {
                $community->setAttribute(
                    'is_member',
                    in_array((int) $community->id, $joinedIds, true)
                );

                return $community;
            }
        );

        return Inertia::render('communities/index', [
            'communities' => $communities,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function join(Request $request, Community $community): RedirectResponse
    {
        $request->user()
            ->joinedCommunities()
            ->syncWithoutDetaching([$community->id]);

        return back()->with(
            'success',
            "You've joined {$community->name}."
        );
    }

    public function leave(Request $request, Community $community): RedirectResponse
    {
        $request->user()
            ->joinedCommunities()
            ->detach($community->id);

        return back()->with(
            'success',
            "You've left {$community->name}."
        );
    }
}
