<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('user_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->json('map_state'); // Store current map view, layers, etc.
            $table->timestamp('last_activity');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('user_sessions');
    }
};
