<?php
use App\Http\Controllers\API\ForestLayerController;
use App\Http\Controllers\API\PolygonController;
use App\Http\Controllers\API\SearchController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Protected API routes
Route::middleware('auth:sanctum')->group(function () {

    // Polygon management
    Route::apiResource('polygons', PolygonController::class);
    Route::get('polygons/export/geojson', [PolygonController::class, 'export']);
    Route::post('polygons/import/geojson', [PolygonController::class, 'import']);

    // Forest layer management
    Route::apiResource('forest-layers', ForestLayerController::class);

    // Search functionality
    Route::get('search/location', [SearchController::class, 'searchLocation']);

    // User session management
    Route::post('session/save-state', function (Request $request) {
        $request->validate([
            'map_state' => 'required|array'
        ]);

        auth()->user()->userSession()->updateOrCreate(
            ['user_id' => auth()->id()],
            [
                'map_state' => $request->map_state,
                'last_activity' => now()
            ]
        );

        return response()->json(['success' => true]);
    });

    Route::get('session/get-state', function () {
        $session = auth()->user()->userSession;

        return response()->json([
            'success' => true,
            'data' => $session ? $session->map_state : null
        ]);
    });
});
