<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SavedPost extends Model
{
    protected $fillable = [
        'user_id',
        'post_id',
    ];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Post, $this> */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    /** @return BelongsToMany<SavedPostCollection, $this> */
    public function collections(): BelongsToMany
    {
        return $this->belongsToMany(
            SavedPostCollection::class,
            'saved_post_collection_items',
            'saved_post_id',
            'collection_id'
        )->withTimestamps();
    }
}