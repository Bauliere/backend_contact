<?php

namespace App\Models;

final class ReportModel extends BaseModel
{
    public function primaryPhones(): array
    {
        return $this->callProcedure('sp_telefonos_principales');
    }

    public function categoryCounts(): array
    {
        return $this->callProcedure('sp_contactos_por_categoria');
    }

    public function byCategory(string $category): array
    {
        return $this->callProcedure('sp_contactos_por_categoria_nombre', [$category]);
    }

    public function recent(int $limit): array
    {
        return $this->callProcedure('sp_contactos_recientes', [$limit]);
    }
}
