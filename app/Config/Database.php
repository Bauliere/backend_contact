<?php

namespace App\Config;

use App\Core\Env;
use PDO;

final class Database
{
    private ?PDO $connection = null;

    public function connection(): PDO
    {
        if ($this->connection instanceof PDO) {
            return $this->connection;
        }

        $host = Env::get('DB_HOST', '127.0.0.1');
        $port = Env::get('DB_PORT', '3306');
        $database = Env::get('DB_NAME', 'agenda_contactos');
        $user = Env::get('DB_USER', 'root');
        $password = Env::get('DB_PASS', '');

        $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";

        $this->connection = new PDO($dsn, $user, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        return $this->connection;
    }
}
