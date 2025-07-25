<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'map_state',
        'last_activity'
    ];

    protected $casts = [
        'map_state' => 'array',
        'last_activity' => 'datetime'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
