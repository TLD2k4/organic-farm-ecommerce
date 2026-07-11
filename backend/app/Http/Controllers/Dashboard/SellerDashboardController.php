<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\SellerDashboardRequest;
use App\Services\Dashboard\SellerDashboardService;

class SellerDashboardController extends Controller
{
    public function __construct(
        private SellerDashboardService $sellerDashboardService
    ) {}

    public function index(SellerDashboardRequest $request)
    {
        $sellerId = (int) $request->user()->getAuthIdentifier();

        $dashboard = $this->sellerDashboardService->getSellerDashboard(
            sellerId: $sellerId,
            filters: $request->validated()
        );

        return response()->json([
            'success' => true,
            'data' => $dashboard,
        ]);
    }
}