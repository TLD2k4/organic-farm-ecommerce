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
        $filters = $request->validate([
            'period' => [
                'nullable',
                'in:today,7d,30d,month,year,custom',
            ],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
        ], [
            'period.in' => 'Khoảng thống kê không hợp lệ.',
            'from.date' => 'Ngày bắt đầu không hợp lệ.',
            'to.date' => 'Ngày kết thúc không hợp lệ.',
            'to.after_or_equal' => 'Ngày kết thúc phải từ ngày bắt đầu trở đi.',
            'limit.integer' => 'Số lượng xếp hạng phải là số nguyên.',
            'limit.min' => 'Số lượng xếp hạng tối thiểu là 1.',
            'limit.max' => 'Số lượng xếp hạng tối đa là 20.',
        ]);

        $report = $this->sellerRevenueService->getReport(
            $request->user(),
            [
                'period' => $filters['period'] ?? '30d',
                'from' => $filters['from'] ?? null,
                'to' => $filters['to'] ?? null,
                'limit' => $filters['limit'] ?? 5,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Lấy báo cáo doanh thu thành công.',
            'data' => $report,
        ]);
    }
}
