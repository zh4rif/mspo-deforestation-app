<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue'
import MapInterface from '@/Components/MapInterface.vue'
import { Head } from '@inertiajs/vue3'
</script>

<template>
  <AuthenticatedLayout>
    <Head title="MSPO Deforestation Monitoring" />

    <MapInterface :user="$page.props.auth.user" />
  </AuthenticatedLayout>
</template>
