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
            'lot_code' => ['nullable', 'string', 'max:10'],

            'per_page' => ['nullable', 'integer', 'min:5', 'max:50'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],

            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $lots = $this->harvestLotService->getVendorLots(
            filters: $filters,
            sellerId: (int) $request->user()->getAuthIdentifier()
        );

        return response()->json([
            'success' => true,
            'data' => collect($lots->items())->map(function ($lot) {
                return $this->formatLot($lot);
            }),
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
            'message' => 'Xóa lô sản phẩm thành công.',
        ]);
    }

    private function formatLot(HarvestLot $lot, bool $isDetail = false): array
    {
        $certificate = $lot->productCertificate;
        $product = $certificate?->product;

        $displayStatus = (int) $lot->status;

        if ($lot->expiry_date && $lot->expiry_date->lt(today())) {
            $displayStatus = 4;
        } elseif ((float) $lot->quantity_remaining <= 0) {
            $displayStatus = 3;
        }

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
            'status_text' => $this->getStatusText($displayStatus),
            'status_class' => $this->getStatusClass($displayStatus),

            'is_expired' => $displayStatus === 4,
            'is_out_of_stock' => $displayStatus === 3,

            'note' => $lot->note,

            'product' => $product ? [
                'id' => $product->id,
                'name' => $product->name,
                'thumbnail' => $product->thumbnail,
                'unit' => $product->unit,
                'status' => $product->status,
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
        }

        return $data;
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