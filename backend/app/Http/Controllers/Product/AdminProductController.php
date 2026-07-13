<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\AdminProductIndexRequest;
use App\Http\Requests\Product\ApproveAdminProductRequest;
use App\Http\Requests\Product\RejectAdminProductCertificateRequest;
use App\Http\Requests\Product\RejectAdminProductRequest;
use App\Services\Product\AdminProductService;
use Illuminate\Http\Request;

class AdminProductController extends Controller
{
    public function __construct(
        private AdminProductService $adminProductService
    ) {}

    public function index(AdminProductIndexRequest $request)
    {
        $filters = $request->validated();
        $filters['limit'] = $filters['limit'] ?? 10;

        $products = $this->adminProductService->getAll($filters);

        return response()->json([
            'success' => true,
            'data' => $products->items(),
            'meta' => [
                'total' => $products->total(),
                'per_page' => $products->perPage(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'from' => $products->firstItem(),
                'to' => $products->lastItem(),
            ],
            'stats' => $this->adminProductService->getStats(),
        ]);
    }

    public function options()
    {
        return response()->json([
            'success' => true,
            'data' => $this->adminProductService->getOptions(),
        ]);
    }

    public function show(int $id)
    {
        return response()->json([
            'success' => true,
            'data' => $this->adminProductService->getById($id),
        ]);
    }

    public function approve(
        ApproveAdminProductRequest $request,
        int $id
    ) {
        $product = $this->adminProductService->approveProduct(
            admin: $request->user(),
            productId: $id,
            certificateId: $request->validated('certificate_id')
        );

        return response()->json([
            'success' => true,
            'message' => 'Duyệt sản phẩm thành công.',
            'data' => $product,
        ]);
    }

    public function reject(
        RejectAdminProductRequest $request,
        int $id
    ) {
        $product = $this->adminProductService->rejectProduct(
            admin: $request->user(),
            productId: $id,
            reason: $request->validated('rejection_reason')
        );

        return response()->json([
            'success' => true,
            'message' => 'Từ chối sản phẩm thành công.',
            'data' => $product,
        ]);
    }

    public function approveCertificate(
        Request $request,
        int $productId,
        int $certificateId
    ) {
        $product = $this->adminProductService->approveCertificate(
            admin: $request->user(),
            productId: $productId,
            certificateId: $certificateId
        );

        return response()->json([
            'success' => true,
            'message' => 'Duyệt hồ sơ chứng chỉ thành công.',
            'data' => $product,
        ]);
    }

    public function rejectCertificate(
        RejectAdminProductCertificateRequest $request,
        int $productId,
        int $certificateId
    ) {
        $product = $this->adminProductService->rejectCertificate(
            admin: $request->user(),
            productId: $productId,
            certificateId: $certificateId,
            reason: $request->validated('rejection_reason')
        );

        return response()->json([
            'success' => true,
            'message' => 'Từ chối hồ sơ chứng chỉ thành công.',
            'data' => $product,
        ]);
    }
}
