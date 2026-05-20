<?php

namespace App\Models;

final class ContactDataModel extends BaseModel
{
    public function create(int $contactId, string $type, string $value, bool $isPrimary): array
    {
        $this->ensureTypeLimit($contactId, $type);
        return $this->callProcedure('sp_dato_contacto_crear', [$contactId, $type, $value, $isPrimary]);
    }

    public function update(int $id, int $contactId, string $type, string $value, bool $isPrimary): array
    {
        $this->ensureTypeLimit($contactId, $type, $id);
        return $this->callProcedure('sp_dato_contacto_actualizar', [$id, $contactId, $type, $value, $isPrimary]);
    }

    public function delete(int $id): array
    {
        return $this->callProcedure('sp_dato_contacto_eliminar', [$id]);
    }

    private function ensureTypeLimit(int $contactId, string $type, ?int $excludeId = null): void
    {
        $query = 'SELECT COUNT(*) FROM datos_contacto WHERE id_contacto = :contact_id AND tipo_dato = :type';
        if ($excludeId !== null) {
            $query .= ' AND id_dato <> :exclude_id';
        }

        $statement = $this->db->prepare($query);
        $statement->bindValue(':contact_id', $contactId, \PDO::PARAM_INT);
        $statement->bindValue(':type', $type);
        if ($excludeId !== null) {
            $statement->bindValue(':exclude_id', $excludeId, \PDO::PARAM_INT);
        }

        $statement->execute();
        $count = (int) $statement->fetchColumn();

        if ($count >= 2) {
            throw new \InvalidArgumentException("Cada contacto solo puede tener 2 registros de tipo {$type}.");
        }
    }
}
