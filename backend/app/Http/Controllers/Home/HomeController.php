<?php

namespace App\Http\Controllers\Home;

use App\Http\Controllers\Controller;
use App\Http\Requests\Home\HomeRequest;
use App\Services\Home\HomeService;
use Illuminate\Http\JsonResponse;

class HomeController extends Controller
{
    public function __construct(
        private HomeService $homeService
    ) {}

    public function index(HomeRequest $request): JsonResponse
    {
        $data = $this->homeService->getHomeData(
            filters: $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Lấy dữ liệu trang chủ thành công',
            'data' => $data,
        ]);
    }
}
