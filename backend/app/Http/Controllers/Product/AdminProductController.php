<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\AdminProductIndexRequest;
use App\Http\Requests\Product\ApproveAdminProductRequest;
use App\Http\Requests\Product\RejectAdminProductCertificateRequest;
use App\Http\Requests\Product\RejectAdminProductRequest;
use App\Services\Product\AdminProductService;
use App\Services\Audit\AuditLogService;
use App\Models\Product;
use App\Models\User;
use App\Notifications\MarketplaceNotification;
use Illuminate\Http\Request;

class AdminProductController extends Controller
{
    public function __construct(
        private AdminProductService $adminProductService,
        private AuditLogService $auditLogService
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

        $this->auditLogService->record(
            $request->user(),
            'product',
            $id,
            'approve',
            0,
            1,
            null,
            ['farm_id' => $product['farm']['id'] ?? $product['farm_id'] ?? null]
        );
        $this->notifySeller(
            $request->user(), $id, 'product.approved',
            'Sản phẩm đã được duyệt',
            'Sản phẩm của bạn đã được duyệt và có thể mở bán.'
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

        $this->auditLogService->record(
            $request->user(),
            'product',
            $id,
            'reject',
            0,
            2,
            $request->validated('rejection_reason'),
            ['farm_id' => $product['farm']['id'] ?? $product['farm_id'] ?? null]
        );
        $this->notifySeller(
            $request->user(), $id, 'product.rejected',
            'Sản phẩm bị từ chối',
            'Lý do: ' . $request->validated('rejection_reason')
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

        $this->auditLogService->record(
            $request->user(),
            'product_certificate',
            $certificateId,
            'approve',
            0,
            1,
            null,
            ['product_id' => $productId]
        );
        $this->notifySeller(
            $request->user(), $productId, 'certificate.approved',
            'Chứng chỉ sản phẩm đã được duyệt',
            'Hồ sơ chứng chỉ #' . $certificateId . ' đã được duyệt.'
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

        $this->auditLogService->record(
            $request->user(),
            'product_certificate',
            $certificateId,
            'reject',
            0,
            2,
            $request->validated('rejection_reason'),
            ['product_id' => $productId]
        );
        $this->notifySeller(
            $request->user(), $productId, 'certificate.rejected',
            'Chứng chỉ sản phẩm bị từ chối',
            'Lý do: ' . $request->validated('rejection_reason')
        );

        return response()->json([
            'success' => true,
            'message' => 'Từ chối hồ sơ chứng chỉ thành công.',
            'data' => $product,
        ]);
    }

    public function suspend(Request $request, int $id)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);
        $before = Product::withoutGlobalScope('farm_not_deleted')->findOrFail($id);
        $product = $this->adminProductService->suspendProduct(
            $request->user(),
            $id,
            $validated['reason']
        );

        $this->auditLogService->record(
            $request->user(), 'product', $id, 'suspend',
            (int) $before->status, 3, $validated['reason']
        );
        $this->notifySeller(
            $request->user(), $id, 'product.suspended',
            'Sản phẩm bị đình chỉ',
            'Lý do: ' . $validated['reason']
        );

        return response()->json([
            'success' => true,
            'message' => 'Đình chỉ sản phẩm thành công.',
            'data' => $product,
        ]);
    }

    public function reopen(Request $request, int $id)
    {
        $product = $this->adminProductService->reopenProduct($request->user(), $id);

        $this->auditLogService->record(
            $request->user(), 'product', $id, 'reopen', 3, 1
        );
        $this->notifySeller(
            $request->user(), $id, 'product.reopened',
            'Sản phẩm đã được mở lại',
            'Quản trị viên đã cho phép sản phẩm hoạt động trở lại.'
        );

        return response()->json([
            'success' => true,
            'message' => 'Mở lại sản phẩm thành công.',
            'data' => $product,
        ]);
    }

    private function notifySeller(
        User $admin,
        int $productId,
        string $eventType,
        string $title,
        string $message
    ): void {
        $product = Product::withoutGlobalScope('farm_not_deleted')
            ->with('farm.seller')
            ->find($productId);

        $product?->farm?->seller?->notify(new MarketplaceNotification(
            $eventType,
            $title,
            $message,
            '/seller/products',
            $admin,
            ['product_id' => $productId]
        ));
    }
}
