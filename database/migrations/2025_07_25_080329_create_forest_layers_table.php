<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('forest_layers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('type')->comment('deforestation, regrowth, primary_forest, disturbed_forest');
            $table->string('color')->default('#3b82f6');
            $table->json('geometry'); // Store GeoJSON geometry
            $table->json('properties')->nullable(); // Additional properties
            $table->decimal('area_km2', 10, 3)->nullable();
            $table->boolean('visible')->default(true);
            $table->decimal('opacity', 3, 2)->default(0.70);
            $table->timestamps();

            $table->index(['user_id', 'type']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('forest_layers');
    }
};
