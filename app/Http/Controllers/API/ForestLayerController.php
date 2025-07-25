<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ForestLayer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ForestLayerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Auth::user()->forestLayers();

        if ($request->has('type')) {
            $query->byType($request->type);
        }

        if ($request->boolean('visible_only')) {
            $query->visible();
        }

        $layers = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $layers
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:deforestation,regrowth,primary_forest,disturbed_forest',
            'color' => 'string|regex:/^#[0-9A-Fa-f]{6}$/',
            'geometry' => 'required|array',
            'properties' => 'nullable|array',
            'area_km2' => 'nullable|numeric|min:0',
            'visible' => 'boolean',
            'opacity' => 'numeric|between:0,1'
        ]);

        $validated['user_id'] = Auth::id();

        $layer = ForestLayer::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Forest layer created successfully',
            'data' => $layer
        ], 201);
    }

    public function update(Request $request, ForestLayer $forestLayer): JsonResponse
    {
        $this->authorize('update', $forestLayer);

        $validated = $request->validate([
            'name' => 'string|max:255',
            'color' => 'string|regex:/^#[0-9A-Fa-f]{6}$/',
            'visible' => 'boolean',
            'opacity' => 'numeric|between:0,1'
        ]);

        $forestLayer->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Forest layer updated successfully',
            'data' => $forestLayer
        ]);
    }

    public function destroy(ForestLayer $forestLayer): JsonResponse
    {
        $this->authorize('delete', $forestLayer);

        $forestLayer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Forest layer deleted successfully'
        ]);
    }
}
