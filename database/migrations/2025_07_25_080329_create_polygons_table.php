<?php
// database/migrations/2024_01_01_000001_create_polygons_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('polygons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('object_id')->unique();
            $table->string('license_no');
            $table->string('smallholder_name');
            $table->string('state');
            $table->string('district');
            $table->string('subdistrict')->nullable();
            $table->string('spoc_name')->nullable();
            $table->string('spoc_code')->nullable();
            $table->string('lot_no')->nullable();
            $table->decimal('certified_area_ha', 10, 3);
            $table->decimal('planted_area_ha', 10, 3);
            $table->decimal('longitude', 10, 6);
            $table->decimal('latitude', 10, 6);
            $table->string('mspo_certification')->nullable();
            $table->string('land_title')->nullable();
            $table->json('geometry'); // Store GeoJSON geometry
            $table->json('centroid'); // Store centroid coordinates
            $table->decimal('area_km2', 10, 3);
            $table->timestamps();

            $table->index(['user_id', 'state']);
            $table->index(['latitude', 'longitude']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('polygons');
    }
};
