<?php

namespace App\Core;

final class Cors
{
    public static function apply(): void
    {
        $origin = Env::get('CORS_ORIGIN', '*');

        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Max-Age: 86400');
        header('Content-Type: application/json; charset=utf-8');
    }
}
