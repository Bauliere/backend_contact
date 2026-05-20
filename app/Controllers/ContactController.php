<?php

namespace App\Controllers;

use App\Core\Response;
use App\Models\ContactModel;

final class ContactController extends BaseController
{
    public function __construct(private ContactModel $contacts)
    {
    }

    public function index(): void
    {
        Response::json(['data' => $this->contacts->all()]);
    }

    public function detail(array $params): void
    {
        Response::json(['data' => $this->contacts->detail((int) $params['id'])]);
    }

    public function create(): void
    {
        $data = $this->input();
        $result = $this->contacts->create(
            $this->requireString($data, 'nombre'),
            $this->requireString($data, 'apellido'),
            $this->optionalString($data, 'fecha_nacimiento'),
            $this->requireInt($data, 'id_categoria')
        );

        Response::json(['message' => 'Contacto creado', 'data' => $result], 201);
    }

    public function update(array $params): void
    {
        $data = $this->input();
        $result = $this->contacts->update(
            (int) $params['id'],
            $this->requireString($data, 'nombre'),
            $this->requireString($data, 'apellido'),
            $this->optionalString($data, 'fecha_nacimiento'),
            $this->requireInt($data, 'id_categoria')
        );

        Response::json(['message' => 'Contacto actualizado', 'data' => $result]);
    }

    public function delete(array $params): void
    {
        $result = $this->contacts->delete((int) $params['id']);
        Response::json(['message' => 'Contacto eliminado', 'data' => $result]);
    }
}
