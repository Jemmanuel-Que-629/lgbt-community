<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    protected $fillable = [
        'user_id',
        'community_id',
        'title',
        'body',
    ];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Community, $this> */
    public function community(): BelongsTo
    {
        return $this->belongsTo(Community::class);
    }

    /** @return HasMany<PostMedia, $this> */
    public function media(): HasMany
    {
        return $this->hasMany(PostMedia::class);
    }

    /** @return HasMany<PostReaction, $this> */
    public function reactions(): HasMany
    {
        return $this->hasMany(PostReaction::class);
    }

    /** @return HasMany<Comment, $this> */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /** @return HasMany<PostShare, $this> */
    public function shares(): HasMany
    {
        return $this->hasMany(PostShare::class);
    }
}
