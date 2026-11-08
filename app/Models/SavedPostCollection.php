<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SavedPostCollection extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsToMany<SavedPost, $this> */
    public function savedPosts(): BelongsToMany
    {
        return $this->belongsToMany(
            SavedPost::class,
            'saved_post_collection_items',
            'collection_id',
            'saved_post_id'
        )->withTimestamps();
    }
}