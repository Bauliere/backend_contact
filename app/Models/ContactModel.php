<?php

namespace App\Models;

final class ContactModel extends BaseModel
{
    public function all(): array
    {
        return $this->callProcedure('sp_contactos_todos');
    }

    public function detail(int $id): array
    {
        return $this->callProcedure('sp_contacto_detalle', [$id]);
    }

    public function create(string $name, string $lastname, ?string $birthdate, int $categoryId): array
    {
        return $this->callProcedure('sp_contacto_crear', [$name, $lastname, $birthdate, $categoryId]);
    }

    public function update(int $id, string $name, string $lastname, ?string $birthdate, int $categoryId): array
    {
        return $this->callProcedure('sp_contacto_actualizar', [$id, $name, $lastname, $birthdate, $categoryId]);
    }

    public function delete(int $id): array
    {
        return $this->callProcedure('sp_contacto_eliminar', [$id]);
    }
}
