<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Polygon extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'object_id',
        'license_no',
        'smallholder_name',
        'state',
        'district',
        'subdistrict',
        'spoc_name',
        'spoc_code',
        'lot_no',
        'certified_area_ha',
        'planted_area_ha',
        'longitude',
        'latitude',
        'mspo_certification',
        'land_title',
        'geometry',
        'centroid',
        'area_km2'
    ];

    protected $casts = [
        'geometry' => 'array',
        'centroid' => 'array',
        'certified_area_ha' => 'decimal:3',
        'planted_area_ha' => 'decimal:3',
        'longitude' => 'decimal:6',
        'latitude' => 'decimal:6',
        'area_km2' => 'decimal:3'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeWithinBounds($query, $northLat, $southLat, $eastLng, $westLng)
    {
        return $query->whereBetween('latitude', [$southLat, $northLat])
                    ->whereBetween('longitude', [$westLng, $eastLng]);
    }

    public function scopeByState($query, $state)
    {
        return $query->where('state', $state);
    }
}
