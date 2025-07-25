<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SearchController extends Controller
{
    public function searchLocation(Request $request): JsonResponse
    {
        $request->validate([
            'query' => 'required|string|max:255'
        ]);

        $query = $request->input('query');

        try {
            $client = new Client();
            $response = $client->get('https://nominatim.openstreetmap.org/search', [
                'query' => [
                    'format' => 'json',
                    'q' => $query,
                    'limit' => 5,
                    'addressdetails' => 1
                ],
                'headers' => [
                    'User-Agent' => 'MSPO Deforestation Maps'
                ]
            ]);

            $data = json_decode($response->getBody(), true);

            $results = collect($data)->map(function ($item) {
                return [
                    'display_name' => $item['display_name'],
                    'lat' => (float) $item['lat'],
                    'lon' => (float) $item['lon'],
                    'type' => $item['type'] ?? 'unknown',
                    'importance' => $item['importance'] ?? 0
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $results
            ]);

        } catch (RequestException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Search service unavailable'
            ], 503);
        }
    }
}
