<?php

namespace App\Http\Controllers;

use App\Models\Community;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    public function create(Request $request): Response
    {
        $communities = $request->user()
            ->joinedCommunities()
            ->where('communities.status', 'active')
            ->orderBy('communities.name')
            ->get([
                'communities.id',
                'communities.name',
            ]);

        return Inertia::render('create-post', [
            'communities' => $communities,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'community_id' => [
                'required',
                'integer',
                'exists:communities,id',
            ],
            'title' => ['required', 'string', 'max:255'],
            'body' => ['nullable', 'string', 'max:10000'],
            'media' => ['nullable', 'array', 'max:5'],
            'media.*' => [
                'file',
                'max:20480',
                'mimes:jpg,jpeg,png,webp,gif,mp4,webm,mov',
            ],
        ]);

        $community = Community::query()
            ->whereKey($validated['community_id'])
            ->where('status', 'active')
            ->whereHas('members', function ($query) use ($request) {
                $query->where('users.id', $request->user()->id);
            })
            ->first();

        if (!$community) {
            return back()->withErrors([
                'community_id' => 'You must be an approved member of an active community to publish a post.',
            ]);
        }

        $uploadedPaths = [];

        try {
            DB::transaction(function () use (
                $request,
                $validated,
                &$uploadedPaths
            ) {
                $post = $request->user()->posts()->create([
                    'community_id' => $validated['community_id'],
                    'title' => $validated['title'],
                    'body' => $validated['body'] ?? null,
                ]);

                foreach ($request->file('media', []) as $file) {
                    $path = $file->store('post-media', 'public');

                    if ($path === false) {
                        throw new \RuntimeException(
                            'A media file could not be uploaded.'
                        );
                    }

                    $uploadedPaths[] = $path;

                    $extension = strtolower(
                        $file->getClientOriginalExtension()
                    );

                    $isVideo = str_starts_with(
                        $file->getMimeType() ?? '',
                        'video/'
                    );

                    $type = $isVideo
                        ? 'video'
                        : ($extension === 'gif' ? 'gif' : 'image');

                    $post->media()->create([
                        'type' => $type,
                        'path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType(),
                        'size' => $file->getSize(),
                    ]);
                }
            });
        } catch (\Throwable $exception) {
            if ($uploadedPaths !== []) {
                Storage::disk('public')->delete($uploadedPaths);
            }

            throw $exception;
        }

        return redirect()
            ->route('feed')
            ->with('success', 'Your post has been published!');
    }
}
