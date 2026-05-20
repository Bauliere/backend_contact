<?php

namespace App\Models;

use PDO;

abstract class BaseModel
{
    public function __construct(protected PDO $db)
    {
    }

    protected function callProcedure(string $procedure, array $params = []): array
    {
        $placeholders = implode(', ', array_fill(0, count($params), '?'));
        $statement = $this->db->prepare("CALL {$procedure}({$placeholders})");

        foreach (array_values($params) as $index => $value) {
            $statement->bindValue($index + 1, $value, $this->pdoType($value));
        }

        $statement->execute();
        $rows = $statement->fetchAll();
        $statement->closeCursor();

        return $rows;
    }

    private function pdoType(mixed $value): int
    {
        return match (true) {
            is_int($value) => PDO::PARAM_INT,
            is_bool($value) => PDO::PARAM_BOOL,
            $value === null => PDO::PARAM_NULL,
            default => PDO::PARAM_STR,
        };
    }
}
