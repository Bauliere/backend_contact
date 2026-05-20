<?php

namespace App\Core;

final class Router
{
    private array $routes = [];

    public function get(string $path, callable|array $handler): void
    {
        $this->add('GET', $path, $handler);
    }

    public function post(string $path, callable|array $handler): void
    {
        $this->add('POST', $path, $handler);
    }

    public function put(string $path, callable|array $handler): void
    {
        $this->add('PUT', $path, $handler);
    }

    public function delete(string $path, callable|array $handler): void
    {
        $this->add('DELETE', $path, $handler);
    }

    private function add(string $method, string $path, callable|array $handler): void
    {
        $this->routes[] = compact('method', 'path', 'handler');
    }

    public function dispatch(string $method, string $path): void
    {
        foreach ($this->routes as $route) {
            $params = $this->match($route['path'], $path);
            if ($params === null || $route['method'] !== $method) {
                continue;
            }

            $handler = $route['handler'];
            if (is_array($handler)) {
                [$controller, $action] = $handler;
                $controller->{$action}($params);
                return;
            }

            $handler($params);
            return;
        }

        Response::json([
            'error' => 'Ruta no encontrada',
            'path' => $path,
        ], 404);
    }

    private function match(string $routePath, string $requestPath): ?array
    {
        $pattern = preg_replace('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#', '(?P<$1>[^/]+)', $routePath);
        $pattern = '#^' . $pattern . '$#';

        if (!preg_match($pattern, $requestPath, $matches)) {
            return null;
        }

        return array_filter(
            $matches,
            static fn (string|int $key): bool => is_string($key),
            ARRAY_FILTER_USE_KEY
        );
    }
}
