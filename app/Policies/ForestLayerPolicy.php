<?php
namespace App\Policies;

use App\Models\ForestLayer;
use App\Models\User;

class ForestLayerPolicy
{
    public function view(User $user, ForestLayer $forestLayer): bool
    {
        return $user->id === $forestLayer->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, ForestLayer $forestLayer): bool
    {
        return $user->id === $forestLayer->user_id;
    }

    public function delete(User $user, ForestLayer $forestLayer): bool
    {
        return $user->id === $forestLayer->user_id;
    }
}
