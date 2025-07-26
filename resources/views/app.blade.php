<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="icon" type="image/png" href="/favicon.png">

    <!-- Meta Tags -->
    <meta name="description" content="Laravel Application">
    <meta name="author" content="{{ config('app.name') }}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:title" content="{{ config('app.name') }}">
    <meta property="og:description" content="Laravel Application">
    <meta property="og:image" content="{{ asset('images/og-image.jpg') }}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="{{ url()->current() }}">
    <meta property="twitter:title" content="{{ config('app.name') }}">
    <meta property="twitter:description" content="Laravel Application">
    <meta property="twitter:image" content="{{ asset('images/og-image.jpg') }}">

    <!-- Theme Color -->
    <meta name="theme-color" content="#FF2D20">
    <meta name="msapplication-TileColor" content="#FF2D20">

    <!-- Scripts -->
    @routes
    @vite(['resources/js/app.js', "resources/js/Pages/{$page['component']}.vue"])
    @inertiaHead
</head>
<body class="font-sans antialiased h-full bg-gray-50 dark:bg-gray-900">
    @inertia

    <!-- Development helpers (remove in production) -->
    @env('local')
        <script>
            // Laravel development helpers
            if (typeof window !== 'undefined') {
                window.Laravel = {
                    csrfToken: '{{ csrf_token() }}',
                    appUrl: '{{ config('app.url') }}',
                    environment: '{{ app()->environment() }}'
                };
            }
        </script>
    @endenv
</body>
</html>
