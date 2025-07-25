<?php

namespace App\Policies;

use App\Models\Polygon;
use App\Models\User;

class PolygonPolicy
{
    public function view(User $user, Polygon $polygon): bool
    {
        return $user->id === $polygon->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Polygon $polygon): bool
    {
        return $user->id === $polygon->user_id;
    }

    public function delete(User $user, Polygon $polygon): bool
    {
        return $user->id === $polygon->user_id;
    }
}
