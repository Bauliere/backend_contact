<?php

namespace App\Controllers;

use App\Core\Response;
use App\Models\ContactDataModel;

final class ContactDataController extends BaseController
{
    public function __construct(private ContactDataModel $dataModel)
    {
    }

    public function create(): void
    {
        $data = $this->input();
        $result = $this->dataModel->create(
            $this->requireInt($data, 'id_contacto'),
            $this->type($data),
            $this->requireString($data, 'valor'),
            (bool) ($data['es_principal'] ?? false)
        );

        Response::json(['message' => 'Dato de contacto creado', 'data' => $result], 201);
    }

    public function update(array $params): void
    {
        $data = $this->input();
        $result = $this->dataModel->update(
            (int) $params['id'],
            $this->requireInt($data, 'id_contacto'),
            $this->type($data),
            $this->requireString($data, 'valor'),
            (bool) ($data['es_principal'] ?? false)
        );

        Response::json(['message' => 'Dato de contacto actualizado', 'data' => $result]);
    }

    public function delete(array $params): void
    {
        $result = $this->dataModel->delete((int) $params['id']);
        Response::json(['message' => 'Dato de contacto eliminado', 'data' => $result]);
    }

    private function type(array $data): string
    {
        $type = $this->requireString($data, 'tipo_dato');
        $key = strtolower(strtr($type, [
            'á' => 'a',
            'é' => 'e',
            'í' => 'i',
            'ó' => 'o',
            'ú' => 'u',
            'Á' => 'a',
            'É' => 'e',
            'Í' => 'i',
            'Ó' => 'o',
            'Ú' => 'u',
        ]));

        $normalized = [
            'telefono' => 'Telefono',
            'correo' => 'Correo',
            'direccion' => 'Direccion',
        ][$key] ?? $type;

        if (!in_array($normalized, ['Telefono', 'Correo', 'Direccion'], true)) {
            throw new \InvalidArgumentException('El tipo de dato debe ser Telefono, Correo o Direccion.');
        }

        return $normalized;
    }
}
