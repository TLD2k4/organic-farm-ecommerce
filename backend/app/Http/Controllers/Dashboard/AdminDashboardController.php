<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\AdminDashboardRequest;
use App\Services\Dashboard\AdminDashboardService;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function __construct(
        private readonly AdminDashboardService $dashboardService
    ) {}

    public function index(
        AdminDashboardRequest $request
    ): JsonResponse {
        $days = (int) $request->input('days', 30);

        return response()->json([
            'success' => true,
            'message' => 'Lấy dữ liệu tổng quan thành công.',
            'data' => $this->dashboardService->getOverview($days),
        ]);
    }
}
