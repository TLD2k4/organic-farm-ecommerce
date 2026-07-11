<?php

namespace App\Http\Controllers\Report;

use App\Http\Controllers\Controller;
use App\Http\Requests\Report\ReportFilterRequest;
use App\Services\Report\AdminReportService;
use Illuminate\Http\JsonResponse;

class AdminReportController extends Controller
{
    public function __construct(
        private readonly AdminReportService $reportService
    ) {}

    public function index(
        ReportFilterRequest $request
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => 'Lấy báo cáo thống kê thành công.',
            'data' => $this->reportService->getReport(
                $request->validated()
            ),
        ]);
    }
}
