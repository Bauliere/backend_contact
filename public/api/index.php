<?php

use App\Config\Database;
use App\Controllers\CategoryController;
use App\Controllers\ContactController;
use App\Controllers\ContactDataController;
use App\Controllers\ReportController;
use App\Core\Cors;
use App\Core\Env;
use App\Core\Response;
use App\Core\Router;
use App\Models\CategoryModel;
use App\Models\ContactDataModel;
use App\Models\ContactModel;
use App\Models\ReportModel;

spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';
    $baseDir = dirname(__DIR__, 2) . '/app/';

    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relativeClass = substr($class, strlen($prefix));
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (is_file($file)) {
        require $file;
    }
});

Env::load(dirname(__DIR__, 2) . '/.env');
Cors::apply();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $path = preg_replace('#^/api#', '', $path) ?: '/';
    $path = '/' . trim($path, '/');

    if ($path === '/health') {
        Response::json([
            'status' => 'ok',
            'service' => 'backend-contactos',
        ]);
        exit;
    }

    $pdo = (new Database())->connection();

    $contacts = new ContactController(new ContactModel($pdo));
    $categories = new CategoryController(new CategoryModel($pdo));
    $contactData = new ContactDataController(new ContactDataModel($pdo));
    $reports = new ReportController(new ReportModel($pdo));

    $router = new Router();
    $router->get('/contactos', [$contacts, 'index']);
    $router->get('/contactos/telefonos-principales', [$reports, 'primaryPhones']);
    $router->get('/contactos/recientes', [$reports, 'recent']);
    $router->get('/contactos/categoria/{nombre}', [$reports, 'byCategory']);
    $router->get('/contactos/{id}', [$contacts, 'detail']);
    $router->post('/contactos', [$contacts, 'create']);
    $router->put('/contactos/{id}', [$contacts, 'update']);
    $router->delete('/contactos/{id}', [$contacts, 'delete']);

    $router->get('/categorias', [$categories, 'index']);
    $router->get('/categorias/conteo', [$reports, 'categoryCounts']);
    $router->post('/categorias', [$categories, 'create']);
    $router->put('/categorias/{id}', [$categories, 'update']);
    $router->delete('/categorias/{id}', [$categories, 'delete']);

    $router->post('/datos-contacto', [$contactData, 'create']);
    $router->put('/datos-contacto/{id}', [$contactData, 'update']);
    $router->delete('/datos-contacto/{id}', [$contactData, 'delete']);

    $router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', $path);
} catch (InvalidArgumentException $exception) {
    Response::json(['error' => $exception->getMessage()], 422);
} catch (PDOException $exception) {
    $debug = filter_var(Env::get('APP_DEBUG', 'false'), FILTER_VALIDATE_BOOLEAN);
    Response::json([
        'error' => 'No fue posible conectar o consultar la base de datos.',
        'detail' => $debug ? $exception->getMessage() : null,
    ], 500);
} catch (Throwable $exception) {
    $debug = filter_var(Env::get('APP_DEBUG', 'false'), FILTER_VALIDATE_BOOLEAN);
    Response::json([
        'error' => 'Error interno del servidor.',
        'detail' => $debug ? $exception->getMessage() : null,
    ], 500);
}
