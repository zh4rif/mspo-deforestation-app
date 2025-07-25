<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Polygon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class PolygonController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Auth::user()->polygons();

        // Filter by bounds if provided
        if ($request->has(['north', 'south', 'east', 'west'])) {
            $query->withinBounds(
                $request->north,
                $request->south,
                $request->east,
                $request->west
            );
        }

        // Filter by state if provided
        if ($request->has('state')) {
            $query->byState($request->state);
        }

        $polygons = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $polygons
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'object_id' => 'required|integer|unique:polygons,object_id',
                'license_no' => 'required|string|max:255',
                'smallholder_name' => 'required|string|max:255',
                'state' => 'required|string|max:255',
                'district' => 'required|string|max:255',
                'subdistrict' => 'nullable|string|max:255',
                'spoc_name' => 'nullable|string|max:255',
                'spoc_code' => 'nullable|string|max:255',
                'lot_no' => 'nullable|string|max:255',
                'certified_area_ha' => 'required|numeric|min:0',
                'planted_area_ha' => 'required|numeric|min:0',
                'longitude' => 'required|numeric|between:-180,180',
                'latitude' => 'required|numeric|between:-90,90',
                'mspo_certification' => 'nullable|string|max:255',
                'land_title' => 'nullable|string|max:255',
                'geometry' => 'required|array',
                'centroid' => 'required|array',
                'area_km2' => 'required|numeric|min:0'
            ]);

            $validated['user_id'] = Auth::id();

            $polygon = Polygon::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Polygon created successfully',
                'data' => $polygon
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }
    }

    public function show(Polygon $polygon): JsonResponse
    {
        $this->authorize('view', $polygon);

        return response()->json([
            'success' => true,
            'data' => $polygon
        ]);
    }

    public function update(Request $request, Polygon $polygon): JsonResponse
    {
        $this->authorize('update', $polygon);

        try {
            $validated = $request->validate([
                'license_no' => 'string|max:255',
                'smallholder_name' => 'string|max:255',
                'state' => 'string|max:255',
                'district' => 'string|max:255',
                'subdistrict' => 'nullable|string|max:255',
                'spoc_name' => 'nullable|string|max:255',
                'spoc_code' => 'nullable|string|max:255',
                'lot_no' => 'nullable|string|max:255',
                'certified_area_ha' => 'numeric|min:0',
                'planted_area_ha' => 'numeric|min:0',
                'mspo_certification' => 'nullable|string|max:255',
                'land_title' => 'nullable|string|max:255',
                'geometry' => 'array',
                'centroid' => 'array',
                'area_km2' => 'numeric|min:0'
            ]);

            $polygon->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Polygon updated successfully',
                'data' => $polygon
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }
    }

    public function destroy(Polygon $polygon): JsonResponse
    {
        $this->authorize('delete', $polygon);

        $polygon->delete();

        return response()->json([
            'success' => true,
            'message' => 'Polygon deleted successfully'
        ]);
    }

    public function export(): JsonResponse
    {
        $polygons = Auth::user()->polygons()->get();

        $geojson = [
            'type' => 'FeatureCollection',
            'features' => $polygons->map(function ($polygon) {
                return [
                    'type' => 'Feature',
                    'id' => $polygon->id,
                    'properties' => [
                        'object_id' => $polygon->object_id,
                        'license_no' => $polygon->license_no,
                        'smallholder_name' => $polygon->smallholder_name,
                        'state' => $polygon->state,
                        'district' => $polygon->district,
                        'certified_area_ha' => $polygon->certified_area_ha,
                        'planted_area_ha' => $polygon->planted_area_ha,
                        'area_km2' => $polygon->area_km2,
                        'created_at' => $polygon->created_at->toISOString()
                    ],
                    'geometry' => $polygon->geometry
                ];
            })
        ];

        return response()->json([
            'success' => true,
            'data' => $geojson
        ]);
    }

    public function import(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'geojson' => 'required|array',
                'geojson.type' => 'required|string|in:FeatureCollection',
                'geojson.features' => 'required|array'
            ]);

            $imported = 0;
            $errors = [];

            foreach ($request->geojson['features'] as $index => $feature) {
                try {
                    $properties = $feature['properties'] ?? [];

                    $polygonData = [
                        'user_id' => Auth::id(),
                        'object_id' => $properties['object_id'] ?? (Auth::user()->polygons()->max('object_id') + 1),
                        'license_no' => $properties['license_no'] ?? 'IMPORTED',
                        'smallholder_name' => $properties['smallholder_name'] ?? 'Imported Feature',
                        'state' => $properties['state'] ?? 'UNKNOWN',
                        'district' => $properties['district'] ?? 'UNKNOWN',
                        'certified_area_ha' => $properties['certified_area_ha'] ?? 0,
                        'planted_area_ha' => $properties['planted_area_ha'] ?? 0,
                        'longitude' => $properties['longitude'] ?? 0,
                        'latitude' => $properties['latitude'] ?? 0,
                        'geometry' => $feature['geometry'],
                        'centroid' => $this->calculateCentroid($feature['geometry']),
                        'area_km2' => $properties['area_km2'] ?? 0
                    ];

                    Polygon::create($polygonData);
                    $imported++;

                } catch (\Exception $e) {
                    $errors[] = "Feature {$index}: " . $e->getMessage();
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Successfully imported {$imported} polygon(s)",
                'imported' => $imported,
                'errors' => $errors
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid GeoJSON format',
                'errors' => $e->errors()
            ], 422);
        }
    }

    private function calculateCentroid($geometry): array
    {
        if ($geometry['type'] !== 'Polygon') {
            return [0, 0];
        }

        $coordinates = $geometry['coordinates'][0];
        $x = 0;
        $y = 0;
        $count = count($coordinates) - 1; // Exclude the closing coordinate

        for ($i = 0; $i < $count; $i++) {
            $x += $coordinates[$i][0];
            $y += $coordinates[$i][1];
        }

        return [$y / $count, $x / $count]; // Return as [lat, lng]
    }
}
