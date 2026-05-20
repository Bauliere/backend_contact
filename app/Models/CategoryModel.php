<?php

namespace App\Models;

final class CategoryModel extends BaseModel
{
    public function all(): array
    {
        return $this->callProcedure('sp_categorias_listar');
    }

    public function create(string $name, ?string $description, string $color): array
    {
        return $this->callProcedure('sp_categoria_crear', [$name, $description, $color]);
    }

    public function update(int $id, string $name, ?string $description, string $color): array
    {
        return $this->callProcedure('sp_categoria_actualizar', [$id, $name, $description, $color]);
    }

    public function delete(int $id): array
    {
        return $this->callProcedure('sp_categoria_eliminar', [$id]);
    }
}
