<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ForestLayer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'type',
        'color',
        'geometry',
        'properties',
        'area_km2',
        'visible',
        'opacity'
    ];

    protected $casts = [
        'geometry' => 'array',
        'properties' => 'array',
        'area_km2' => 'decimal:3',
        'visible' => 'boolean',
        'opacity' => 'decimal:2'
    ];

    const FOREST_TYPES = [
        'deforestation' => 'Deforestation Areas',
        'regrowth' => 'Regrowth Areas',
        'primary_forest' => 'Primary Forest',
        'disturbed_forest' => 'Disturbed Forest'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeVisible($query)
    {
        return $query->where('visible', true);
    }
}
