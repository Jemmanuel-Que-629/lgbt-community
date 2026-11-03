<?php

namespace App\Http\Controllers;

use App\Models\Community;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CommunityController extends Controller
{
    private const CATEGORIES = [
        'General',
        'Art',
        'Gaming',
        'Music',
        'Support',
        'Lifestyle',
    ];

    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category' => [
                'nullable',
                'string',
                Rule::in(self::CATEGORIES),
            ],
        ]);

        $search = trim($validated['search'] ?? '');
        $category = $validated['category'] ?? '';

        $communities = Community::query()
            ->with('creator:id,username')
            ->with([
                'members' => function ($query) {
                    $query
                        ->select('users.id', 'users.username')
                        ->limit(3);
                },
            ])
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

                $community->setAttribute(
                    'image_url',
                    $community->image_path
                        ? Storage::disk('public')->url($community->image_path)
                        : null
                );

                return $community;
            }
        );

        return Inertia::render('communities/index', [
            'communities' => $communities,
            'filters' => [
                'search' => $search,
                'category' => $category,
            ],
            'categories' => self::CATEGORIES,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('communities/create', [
            'categories' => self::CATEGORIES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:3', 'max:80'],
            'description' => ['nullable', 'string', 'max:1000'],
            'category' => [
                'required',
                'string',
                Rule::in(self::CATEGORIES),
            ],
            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ]);

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

        $request->user()->communities()->create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'],
            'image_path' => $imagePath,
        ]);

        return redirect()
            ->route('communities.index')
            ->with('success', 'Your community has been created!');
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
