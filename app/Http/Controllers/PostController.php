<?php

namespace App\Http\Controllers;

use App\Models\Community;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    public function create(): Response
    {
        $communities = Community::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('create-post', [
            'communities' => $communities,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'community_id' => ['required', 'integer', 'exists:communities,id'],
            'title' => ['required', 'string', 'max:255'],
            'body' => ['nullable', 'string', 'max:10000'],
            'media' => ['nullable', 'array', 'max:5'],
            'media.*' => [
                'file',
                'max:20480',
                'mimes:jpg,jpeg,png,webp,gif,mp4,webm,mov',
            ],
        ]);

        $post = $request->user()->posts()->create([
            'community_id' => $validated['community_id'],
            'title' => $validated['title'],
            'body' => $validated['body'] ?? null,
        ]);

        foreach ($request->file('media', []) as $file) {
            $path = $file->store('post-media', 'public');

            $extension = strtolower($file->getClientOriginalExtension());
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

        return redirect()
            ->route('feed')
            ->with('success', 'Your post has been published!');
    }
}
