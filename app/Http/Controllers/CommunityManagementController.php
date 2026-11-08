<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Community;
use App\Models\Post;
use App\Models\PostMedia;
use App\Models\Report;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class CommunityManagementController extends Controller
{
    /**
     * Display the edit form for an owned community.
     */
    public function edit(
        Request $request,
        Community $community
    ): Response {
        $this->ensureOwner($request, $community);

        abort_unless($community->status === 'active', 404);

        $categories = Community::query()
            ->where('status', 'active')
            ->whereNotNull('category')
            ->where('category', '<>', '')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->values();

        return Inertia::render('communities/edit', [
            'community' => [
                'id' => $community->id,
                'slug' => $community->slug,
                'name' => $community->name,
                'description' => $community->description,
                'category' => $community->category,
                'visibility' => $community->visibility,
                'image_url' => $community->image_path
                    ? Storage::disk('public')->url(
                        $community->image_path
                    )
                    : null,
            ],
            'categories' => $categories,
        ]);
    }

    /**
     * Update an owned community.
     */
    public function update(
        Request $request,
        Community $community
    ): RedirectResponse {
        $this->ensureOwner($request, $community);

        abort_unless($community->status === 'active', 404);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'min:3',
                'max:100',
            ],
            'description' => [
                'nullable',
                'string',
                'max:2000',
            ],
            'category' => [
                'nullable',
                'string',
                'max:50',
            ],
            'visibility' => [
                'required',
                'in:public,private',
            ],
            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'remove_image' => [
                'sometimes',
                'boolean',
            ],
        ]);

        $validated['name'] = trim($validated['name']);
        $validated['description'] = filled(
            $validated['description'] ?? null
        )
            ? trim($validated['description'])
            : null;

        $validated['category'] = filled(
            $validated['category'] ?? null
        )
            ? trim($validated['category'])
            : null;

        $normalizedName = mb_strtolower($validated['name']);

        $nameExists = Community::query()
            ->where('normalized_name', $normalizedName)
            ->where('id', '<>', $community->id)
            ->exists();

        if ($nameExists) {
            throw ValidationException::withMessages([
                'name' => 'A community with this name already exists.',
            ]);
        }

        $newImagePath = null;
        $oldImagePath = null;

        try {
            if ($request->hasFile('image')) {
                $newImagePath = $request->file('image')
                    ->store('community-covers', 'public');

                if ($newImagePath === false) {
                    throw new \RuntimeException(
                        'The community cover image could not be uploaded.'
                    );
                }
            }

            $oldImagePath = DB::transaction(function () use (
                $request,
                $community,
                $validated,
                $newImagePath
            ): ?string {
                $lockedCommunity = Community::query()
                    ->whereKey($community->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $this->ensureOwner($request, $lockedCommunity);

                abort_unless(
                    $lockedCommunity->status === 'active',
                    404
                );

                $previousImagePath = $lockedCommunity->image_path;

                $lockedCommunity->name = $validated['name'];
                $lockedCommunity->description =
                    $validated['description'];
                $lockedCommunity->category =
                    $validated['category'];
                $lockedCommunity->visibility =
                    $validated['visibility'];

                if ($newImagePath !== null) {
                    $lockedCommunity->image_path = $newImagePath;
                } elseif ($request->boolean('remove_image')) {
                    $lockedCommunity->image_path = null;
                }

                // The Community model updates normalized_name
                // automatically when the name changes.
                // Preserve the existing slug to avoid breaking URLs.
                $lockedCommunity->save();

                return $previousImagePath;
            });
        } catch (QueryException $exception) {
            $this->deleteStoredFiles([$newImagePath]);

            if (($exception->errorInfo[1] ?? null) === 1062) {
                throw ValidationException::withMessages([
                    'name' => 'A community with this name already exists.',
                ]);
            }

            throw $exception;
        } catch (Throwable $exception) {
            $this->deleteStoredFiles([$newImagePath]);

            throw $exception;
        }

        if (
            $oldImagePath &&
            (
                $newImagePath !== null ||
                $request->boolean('remove_image')
            )
        ) {
            $this->deleteStoredFiles([$oldImagePath]);
        }

        return redirect()
            ->route('my-communities.index')
            ->with('success', 'Community updated successfully.');
    }

    /**
     * Permanently delete an owned community and its related content.
     */
    public function destroy(
        Request $request,
        Community $community
    ): RedirectResponse {
        $this->ensureOwner($request, $community);

        abort_unless($community->status === 'active', 404);

        $communityId = $community->id;

        $filesToDelete = DB::transaction(function () use (
            $request,
            $communityId
        ): array {
            $lockedCommunity = Community::query()
                ->whereKey($communityId)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureOwner($request, $lockedCommunity);

            abort_unless(
                $lockedCommunity->status === 'active',
                404
            );

            // Collect the community cover before deleting the record.
            $files = [];

            if ($lockedCommunity->image_path) {
                $files[] = $lockedCommunity->image_path;
            }

            // Find all posts belonging to this community.
            $postIds = Post::query()
                ->where('community_id', $communityId)
                ->pluck('id');

            // Collect all uploaded post media before cascade deletion.
            if ($postIds->isNotEmpty()) {
                $mediaPaths = PostMedia::query()
                    ->whereIn('post_id', $postIds)
                    ->whereNotNull('path')
                    ->pluck('path')
                    ->all();

                $files = array_merge($files, $mediaPaths);
            }

            // Remove polymorphic reports explicitly.
            // Foreign-key cascades do not clean up these records.
            Report::query()
                ->where(function ($query) use (
                    $lockedCommunity,
                    $postIds
                ) {
                    $query->where(function ($communityQuery) use (
                        $lockedCommunity
                    ) {
                        $communityQuery
                            ->where(
                                'reportable_type',
                                $lockedCommunity->getMorphClass()
                            )
                            ->where(
                                'reportable_id',
                                $lockedCommunity->id
                            );
                    });

                    if ($postIds->isNotEmpty()) {
                        $query->orWhere(function ($postQuery) use (
                            $postIds
                        ) {
                            $postQuery
                                ->where(
                                    'reportable_type',
                                    (new Post)->getMorphClass()
                                )
                                ->whereIn('reportable_id', $postIds);
                        });

                        // Also remove reports attached to comments
                        // and nested replies under these posts.
                        $query->orWhere(function ($commentQuery) use (
                            $postIds
                        ) {
                            $commentQuery
                                ->where(
                                    'reportable_type',
                                    (new Comment)->getMorphClass()
                                )
                                ->whereIn(
                                    'reportable_id',
                                    Comment::query()
                                        ->whereIn('post_id', $postIds)
                                        ->select('id')
                                );
                        });
                    }
                })
                ->delete();

            // Database foreign-key cascades remove:
            // - Posts
            // - Post media records
            // - Reactions
            // - Comments and nested replies
            // - Shares
            // - Community memberships
            // - Join requests
            $lockedCommunity->delete();

            return array_values(array_unique(array_filter(
                $files,
                fn ($path) => is_string($path) && $path !== ''
            )));
        });

        // Delete physical files only after the database transaction
        // has committed successfully.
        $this->deleteStoredFiles($filesToDelete);

        return redirect()
            ->route('my-communities.index')
            ->with(
                'success',
                'Community and its associated content were permanently deleted.'
            );
    }

    /**
     * Ensure that the authenticated user owns the community.
     */
    private function ensureOwner(
        Request $request,
        Community $community
    ): void {
        abort_unless(
            (int) $community->user_id === (int) $request->user()->id,
            403
        );
    }

    /**
     * Delete files from the public storage disk.
     *
     * Storage cleanup failures are logged instead of turning an
     * already-committed database operation into a misleading failure.
     *
     * @param  array<int, string|false|null>  $paths
     */
    private function deleteStoredFiles(array $paths): void
    {
        $paths = array_values(array_unique(array_filter(
            $paths,
            fn ($path) => is_string($path) && $path !== ''
        )));

        if ($paths === []) {
            return;
        }

        try {
            Storage::disk('public')->delete($paths);
        } catch (Throwable $exception) {
            Log::warning(
                'Community media cleanup failed.',
                [
                    'paths' => $paths,
                    'exception' => $exception->getMessage(),
                ]
            );
        }
    }
}
