<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Str;

/**
 * @property bool $is_owner
 * @property bool $is_member
 * @property string|null $join_request_status
 * @property int $pending_join_requests_count
 * @property array<int, array{
 *     id: int,
 *     user_id: int,
 *     username: string,
 *     created_at: string|null
 * }> $pending_join_requests
 * @property string|null $image_url
 */
class Community extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'description',
        'category',
        'visibility',
        'status',
        'image_path',
    ];

    protected static function booted(): void
    {
        static::saving(function (Community $community): void {
            if ($community->isDirty('name')) {
                $community->name = trim($community->name);
                $community->normalized_name = Str::lower(
                    trim($community->name)
                );
            }
        });

        static::created(function (Community $community): void {
            $community->members()->syncWithoutDetaching([
                $community->user_id,
            ]);
        });
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** @return HasMany<Post, $this> */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    /** @return BelongsToMany<User, $this> */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withTimestamps();
    }

    /** @return HasMany<CommunityJoinRequest, $this> */
    public function joinRequests(): HasMany
    {
        return $this->hasMany(CommunityJoinRequest::class);
    }

    /** @return MorphMany<Report, $this> */
    public function reports(): MorphMany
    {
        return $this->morphMany(Report::class, 'reportable');
    }
}
