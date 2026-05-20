<?php

namespace App\Controllers;

use App\Core\Response;
use App\Models\CategoryModel;

final class CategoryController extends BaseController
{
    public function __construct(private CategoryModel $categories)
    {
    }

    public function index(): void
    {
        Response::json(['data' => $this->categories->all()]);
    }

    public function create(): void
    {
        $data = $this->input();
        $result = $this->categories->create(
            $this->requireString($data, 'nombre_categoria'),
            $this->optionalString($data, 'descripcion'),
            $this->color($data)
        );

        Response::json(['message' => 'Categoria creada', 'data' => $result], 201);
    }

    public function update(array $params): void
    {
        $data = $this->input();
        $result = $this->categories->update(
            (int) $params['id'],
            $this->requireString($data, 'nombre_categoria'),
            $this->optionalString($data, 'descripcion'),
            $this->color($data)
        );

        Response::json(['message' => 'Categoria actualizada', 'data' => $result]);
    }

    public function delete(array $params): void
    {
        $result = $this->categories->delete((int) $params['id']);
        Response::json(['message' => 'Categoria eliminada', 'data' => $result]);
    }

    private function color(array $data): string
    {
        $color = trim((string) ($data['color_categoria'] ?? '#20c787'));
        if (!preg_match('/^#[0-9a-fA-F]{6}$/', $color)) {
            throw new \InvalidArgumentException('El color de la categoria debe estar en formato hexadecimal.');
        }

        return strtolower($color);
    }
}
