<?php

namespace App\Http\Controllers;

use App\Models\Community;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class PostController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'community_id' => [
                'required',
                'integer',
                'exists:communities,id',
            ],
            'title' => [
                'required',
                'string',
                'max:255',
            ],
            'body' => [
                'nullable',
                'string',
                'max:10000',
            ],
            'return_to' => [
                'nullable',
                'in:feed,community',
            ],
            'media' => [
                'nullable',
                'array',
                'max:5',
            ],
            'media.*' => [
                'file',
                'max:20480',
                'mimes:jpg,jpeg,png,webp,gif,mp4,webm,mov',
            ],
        ]);

        $uploadedPaths = [];
        $createdCommunitySlug = null;

        try {
            DB::transaction(function () use (
                $request,
                $validated,
                &$uploadedPaths,
                &$createdCommunitySlug
            ) {
                // Lock the community row to avoid a race with deletion
                // or other community state changes during publishing.
                $community = Community::query()
                    ->whereKey($validated['community_id'])
                    ->lockForUpdate()
                    ->first();

                if (! $community || $community->status !== 'active') {
                    abort(422, 'This community is no longer available.');
                }

                $isOwner = (int) $community->user_id ===
                    (int) $request->user()->id;

                $isMember = $isOwner || $community->members()
                    ->where('users.id', $request->user()->id)
                    ->exists();

                if (! $isMember) {
                    abort(
                        403,
                        'You must be an approved member of this community to publish a post.'
                    );
                }

                $post = $request->user()->posts()->create([
                    'community_id' => $community->id,
                    'title' => trim($validated['title']),
                    'body' => filled($validated['body'] ?? null)
                        ? trim($validated['body'])
                        : null,
                ]);

                foreach ($request->file('media', []) as $file) {
                    $path = $file->store('post-media', 'public');

                    if ($path === false) {
                        throw new RuntimeException(
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
                        : (
                            $extension === 'gif'
                                ? 'gif'
                                : 'image'
                        );

                    $post->media()->create([
                        'type' => $type,
                        'path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType(),
                        'size' => $file->getSize(),
                    ]);
                }

                $createdCommunitySlug = $community->slug;
            });
        } catch (Throwable $exception) {
            // A database rollback does not automatically remove files
            // already written to the public storage disk.
            if ($uploadedPaths !== []) {
                Storage::disk('public')->delete($uploadedPaths);
            }

            throw $exception;
        }

        if (($validated['return_to'] ?? 'feed') === 'community') {
            return redirect()
                ->route('communities.show', [
                    'community' => $createdCommunitySlug,
                ])
                ->with('success', 'Your post has been published!');
        }

        return redirect()
            ->route('feed')
            ->with('success', 'Your post has been published!');
    }
}
