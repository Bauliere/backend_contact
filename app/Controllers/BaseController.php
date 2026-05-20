<?php

namespace App\Controllers;

use App\Core\Request;

abstract class BaseController
{
    protected function input(): array
    {
        return Request::json();
    }

    protected function requireString(array $data, string $key): string
    {
        $value = trim((string) ($data[$key] ?? ''));
        if ($value === '') {
            throw new \InvalidArgumentException("El campo {$key} es obligatorio.");
        }

        return $value;
    }

    protected function optionalString(array $data, string $key): ?string
    {
        $value = trim((string) ($data[$key] ?? ''));
        return $value === '' ? null : $value;
    }

    protected function requireInt(array $data, string $key): int
    {
        if (!isset($data[$key]) || !is_numeric($data[$key])) {
            throw new \InvalidArgumentException("El campo {$key} debe ser numerico.");
        }

        return (int) $data[$key];
    }
}
