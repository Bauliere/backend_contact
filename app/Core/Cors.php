<?php

namespace App\Core;

final class Cors
{
    public static function apply(): void
    {
        $requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowedOrigins = self::allowedOrigins();
        $origin = '*';

        if (!in_array('*', $allowedOrigins, true)) {
            $origin = in_array($requestOrigin, $allowedOrigins, true)
                ? $requestOrigin
                : $allowedOrigins[0];
        }

        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Max-Age: 86400');
        header('Vary: Origin');
        header('Content-Type: application/json; charset=utf-8');
    }

    private static function allowedOrigins(): array
    {
        $raw = Env::get('CORS_ORIGINS', Env::get('CORS_ORIGIN', '*'));
        $origins = array_map('trim', explode(',', (string) $raw));
        $origins = array_values(array_filter($origins, static fn (string $origin): bool => $origin !== ''));

        return $origins ?: ['*'];
    }
}
