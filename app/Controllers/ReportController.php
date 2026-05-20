<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Models\ReportModel;

final class ReportController
{
    public function __construct(private ReportModel $reports)
    {
    }

    public function primaryPhones(): void
    {
        Response::json(['data' => $this->reports->primaryPhones()]);
    }

    public function categoryCounts(): void
    {
        Response::json(['data' => $this->reports->categoryCounts()]);
    }

    public function byCategory(array $params): void
    {
        Response::json([
            'data' => $this->reports->byCategory(urldecode((string) $params['nombre'])),
        ]);
    }

    public function recent(): void
    {
        $limit = max(1, min(50, (int) Request::query('limit', 5)));
        Response::json(['data' => $this->reports->recent($limit)]);
    }
}
