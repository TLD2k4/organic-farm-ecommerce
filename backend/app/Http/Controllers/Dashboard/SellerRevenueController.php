<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\Dashboard\SellerRevenueService;
use Illuminate\Http\Request;

class SellerRevenueController extends Controller
{
    public function __construct(
        private SellerRevenueService $sellerRevenueService
    ) {}

    public function index(Request $request)
    {
        $report = $this->sellerRevenueService->getReport(
            $request->user(),
            [
                'period' => $request->query('period', '30d'),
                'from' => $request->query('from'),
                'to' => $request->query('to'),
                'limit' => $request->query('limit', 10),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Lấy báo cáo doanh thu thành công.',
            'data' => $report,
        ]);
    }
}