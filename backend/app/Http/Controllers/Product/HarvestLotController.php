<?php

namespace App\Http\Controllers\Product;
use App\Models\HarvestLot;
use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreHarvestLotRequest;
use App\Http\Requests\Product\UpdateHarvestLotRequest;
use App\Services\Product\HarvestLotService;
use Illuminate\Http\Request;

class HarvestLotController extends Controller
{
    public function __construct(
        private HarvestLotService $harvestLotService
    ) {}

    public function index(Request $request)
    {
        $filters = $request->validate([
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'status' => ['nullable', 'integer', 'in:1,2,3,4'],
            'deleted' => ['nullable', 'integer', 'in:0,1'],
            'lot_code' => ['nullable', 'string', 'max:10'],
            'keyword' => ['nullable', 'string', 'max:100'],

            'per_page' => ['nullable', 'integer', 'min:5', 'max:50'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],

            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $lots = $this->harvestLotService->getVendorLots(
            filters: $filters,
            sellerId: (int) $request->user()->getAuthIdentifier()
        );
        $stats = $this->harvestLotService->getVendorLotStats(
            sellerId: (int) $request->user()->getAuthIdentifier()
        );

        return response()->json([
            'success' => true,
            'data' => collect($lots->items())->map(function ($lot) {
                return $this->formatLot($lot);
            }),
            'stats' => $stats,
            'meta' => [
                'total' => $lots->total(),
                'per_page' => $lots->perPage(),
                'current_page' => $lots->currentPage(),
                'last_page' => $lots->lastPage(),
                'from' => $lots->firstItem(),
                'to' => $lots->lastItem(),
            ],
        ]);
    }

    public function show(Request $request, int $id)
    {
        $lot = $this->harvestLotService->getVendorLotDetail(
            lotId: $id,
            sellerId: (int) $request->user()->getAuthIdentifier()
        );

        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết lô sản phẩm thành công.',
            'data' => $this->formatLot($lot, true),
        ]);
    }

    public function store(StoreHarvestLotRequest $request)
    {
        $lot = $this->harvestLotService->createVendorLot(
            data: $request->validated(),
            sellerId: (int) $request->user()->getAuthIdentifier()
        );

        return response()->json([
            'success' => true,
            'message' => 'Tạo lô sản phẩm thành công.',
            'id' => $lot->id,
            'data' => $this->formatLot($lot, true),
        ], 201);
    }

    public function update(UpdateHarvestLotRequest $request, int $id)
    {
        $lot = $this->harvestLotService->updateVendorLot(
            data: $request->validated(),
            lotId: $id,
            sellerId: (int) $request->user()->getAuthIdentifier()
        );

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật lô sản phẩm thành công.',
            'id' => $lot->id,
            'data' => $this->formatLot($lot, true),
        ]);
    }

    public function destroy(Request $request, int $id)
    {
        $this->harvestLotService->deleteVendorLot(
            lotId: $id,
            sellerId: (int) $request->user()->getAuthIdentifier()
        );

        return response()->json([
            'success' => true,
            'message' => 'Đã chuyển lô sang mục Đã xóa.',
        ]);
    }

    public function restore(Request $request, int $id)
    {
        $lot = $this->harvestLotService->restoreVendorLot(
            lotId: $id,
            sellerId: (int) $request->user()->getAuthIdentifier()
        );

        return response()->json([
            'success' => true,
            'message' => 'Khôi phục lô thành công. Lô được đưa về Tạm ẩn để kiểm tra trước khi bán.',
            'data' => $this->formatLot($lot, true),
        ]);
    }

    public function forceDestroy(Request $request, int $id)
    {
        $this->harvestLotService->forceDeleteVendorLot(
            lotId: $id,
            sellerId: (int) $request->user()->getAuthIdentifier()
        );

        return response()->json([
            'success' => true,
            'message' => 'Xóa vĩnh viễn lô thành công. Mã lô đã được giải phóng.',
        ]);
    }

    private function formatLot(HarvestLot $lot, bool $isDetail = false): array
    {
        $certificate = $lot->productCertificateIncludingDeleted;
        $product = $certificate?->productIncludingDeleted;
        $isDeleted = $lot->trashed();
        $productIsDeleted = $product?->trashed() ?? true;
        $certificateIsDeleted = $certificate?->trashed() ?? true;

        $displayStatus = (int) $lot->status;

        if (!$isDeleted) {
            if ($lot->expiry_date && $lot->expiry_date->lt(today())) {
                $displayStatus = 4;
            } elseif ((float) $lot->quantity_remaining <= 0) {
                $displayStatus = 3;
            }
        }

        $farmIsActive = $product?->farm
            && !$product->farm->trashed()
            && (int) $product->farm->status === 1;
        $isPubliclyVisible = $product?->isPubliclyVisible() ?? false;
        $canMutate = !$isDeleted
            && !$productIsDeleted
            && !$certificateIsDeleted
            && $farmIsActive;
        $orderItemLotsCount = (int) ($lot->order_item_lots_count ?? 0);
        $canDeletePermanently = (float) $lot->quantity_sold <= 0
            && $orderItemLotsCount === 0;

        $data = [
            'id' => $lot->id,
            'product_certificate_id' => $lot->product_certificate_id,

            'lot_code' => $lot->lot_code,
            'harvest_date' => optional($lot->harvest_date)->format('Y-m-d'),
            'expiry_date' => optional($lot->expiry_date)->format('Y-m-d'),

            'quantity_imported' => (float) $lot->quantity_imported,
            'quantity_sold' => (float) $lot->quantity_sold,
            'quantity_remaining' => (float) $lot->quantity_remaining,

            'status' => (int) $lot->status,
            'display_status' => $displayStatus,
            'status_text' => $isDeleted ? 'Đã xóa' : $this->getStatusText($displayStatus),
            'status_class' => $isDeleted ? 'danger' : $this->getStatusClass($displayStatus),

            'is_deleted' => $isDeleted,
            'deleted_at' => optional($lot->deleted_at)->format('d/m/Y H:i'),
            'can_mutate' => $canMutate,
            'mutation_block_reason' => $this->getMutationBlockReason(
                $isDeleted,
                $productIsDeleted,
                $certificateIsDeleted,
                $farmIsActive
            ),
            'can_delete' => !$isDeleted && $canMutate && $canDeletePermanently,
            'can_restore' => $isDeleted && !$productIsDeleted && !$certificateIsDeleted && $farmIsActive,
            'can_force_delete' => $isDeleted && $canDeletePermanently,
            'order_item_lots_count' => $orderItemLotsCount,

            'is_expired' => $displayStatus === 4,
            'is_out_of_stock' => $displayStatus === 3,

            'note' => $lot->note,

            'product' => $product ? [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'thumbnail' => $product->thumbnail,
                'unit' => $product->unit,
                'status' => $product->status,
                'is_deleted' => $productIsDeleted,
                'is_publicly_visible' => $isPubliclyVisible,
            ] : null,

            'certificate' => $certificate ? [
                'id' => $certificate->id,
                'certification_id' => $certificate->certification_id,
                'certification_name' => $certificate->certification?->name,
                'certificate_number' => $certificate->certificate_number,
                'certificate_file' => $certificate->certificate_file,
                'issued_date' => optional($certificate->issued_date)->format('Y-m-d'),
                'expiry_date' => optional($certificate->expiry_date)->format('Y-m-d'),
                'status' => $certificate->status,
                'is_deleted' => $certificateIsDeleted,
            ] : null,
        ];

        if ($isDetail) {
            $data['farm'] = $product?->farm ? [
                'id' => $product->farm->id,
                'name' => $product->farm->name,
            ] : null;

            $data['category'] = $product?->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
            ] : null;

            $data['created_at'] = optional($lot->created_at)->format('Y-m-d H:i:s');
            $data['updated_at'] = optional($lot->updated_at)->format('Y-m-d H:i:s');
            $data['deleted_at'] = optional($lot->deleted_at)->format('d/m/Y H:i');
        }

        return $data;
    }

    private function getMutationBlockReason(
        bool $isDeleted,
        bool $productIsDeleted,
        bool $certificateIsDeleted,
        bool $farmIsActive
    ): ?string {
        if ($isDeleted) {
            return 'Lô đang ở mục Đã xóa.';
        }

        if ($productIsDeleted) {
            return 'Sản phẩm của lô đang ở mục Đã xóa. Hãy khôi phục sản phẩm trước.';
        }

        if ($certificateIsDeleted) {
            return 'Hồ sơ chứng chỉ của lô đã bị xóa.';
        }

        if (!$farmIsActive) {
            return 'Gian hàng phải đang hoạt động mới được thay đổi lô.';
        }

        return null;
    }

    private function getStatusText(int $status): string
    {
        return match ($status) {
            1 => 'Đang bán',
            2 => 'Tạm ẩn',
            3 => 'Hết hàng',
            4 => 'Hết hạn sử dụng',
            default => 'Không xác định',
        };
    }
    private function getStatusClass(int $status): string
    {
        return match ($status) {
            1 => 'active',
            2 => 'hidden',
            3 => 'warning',
            4 => 'danger',
            default => 'pending',
        };
    }
    public function options(Request $request)
{
    return response()->json([
        'success' => true,
        'data' => $this->harvestLotService->getVendorLotOptions(
            sellerId: (int) $request->user()->getAuthIdentifier()
        ),
    ]);
}
}
