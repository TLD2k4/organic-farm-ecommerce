<?php

namespace App\Services\Product;

use App\Models\Farm;
use App\Models\Product;
use App\Models\HarvestLot;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class HarvestLotService
{
    public function getVendorLots(array $filters, int $sellerId): LengthAwarePaginator
    {
        $farm = $this->getSellerFarm($sellerId);
        $showDeleted = (int) ($filters['deleted'] ?? 0) === 1;

        $query = HarvestLot::query()
            ->when($showDeleted, fn ($query) => $query->onlyTrashed())
            ->withCount('orderItemLots')
            ->with([
                'productCertificateIncludingDeleted.certification',
                'productCertificateIncludingDeleted.productIncludingDeleted.category',
                'productCertificateIncludingDeleted.productIncludingDeleted.farm',
                'productCertificateIncludingDeleted.productIncludingDeleted.approvedCertificate',
            ])
            ->whereHas(
                'productCertificateIncludingDeleted.productIncludingDeleted',
                function ($query) use ($farm) {
                    $query->where('farm_id', $farm->id);
                }
            )
            ->orderBy('id', 'desc');

        if (!empty($filters['product_id'])) {
            $query->whereHas(
                'productCertificateIncludingDeleted',
                fn ($certificateQuery) => $certificateQuery
                    ->where('product_id', $filters['product_id'])
            );
        }

        if (!empty($filters['status'])) {
            $status = (int) $filters['status'];

            if ($status === 1) {
                // Đang bán thật sự: status = 1, còn hàng, chưa hết hạn
                $query->where('status', 1)
                    ->where('quantity_remaining', '>', 0)
                    ->whereDate('expiry_date', '>=', today());
            } elseif ($status === 3) {
                // Hết hàng: còn lại <= 0
                $query->where('quantity_remaining', '<=', 0);
            } elseif ($status === 4) {
                // Hết hạn sử dụng: ngày hết hạn < hôm nay
                $query->whereDate('expiry_date', '<', today());
            } else {
                // Tạm ẩn
                $query->where('status', $status);
            }
        }

        $keyword = trim((string) ($filters['keyword'] ?? $filters['lot_code'] ?? ''));

        if ($keyword !== '') {
            $query->where(function ($keywordQuery) use ($keyword) {
                $keywordQuery
                    ->where('lot_code', 'like', "%{$keyword}%")
                    ->orWhereHas('productCertificateIncludingDeleted.productIncludingDeleted', function ($productQuery) use ($keyword) {
                        $productQuery
                            ->where('name', 'like', "%{$keyword}%")
                            ->orWhere('slug', 'like', "%{$keyword}%");
                    })
                    ->orWhereHas('productCertificateIncludingDeleted', function ($certificateQuery) use ($keyword) {
                        $certificateQuery
                            ->where('certificate_number', 'like', "%{$keyword}%")
                            ->orWhereHas('certification', function ($certificationQuery) use ($keyword) {
                                $certificationQuery->where('name', 'like', "%{$keyword}%");
                            });
                    });
            });
        }

        $limit = $filters['per_page'] ?? $filters['limit'] ?? 10;

        return $query->paginate($limit);
    }

    public function getVendorLotStats(int $sellerId): array
    {
        $farm = $this->getSellerFarm($sellerId);
        $baseQuery = HarvestLot::query()
            ->whereHas(
                'productCertificateIncludingDeleted.productIncludingDeleted',
                fn ($productQuery) => $productQuery->where('farm_id', $farm->id)
            );

        $sellableRelation = function ($certificateQuery) use ($farm) {
            $certificateQuery
                ->where('status', 1)
                ->whereDate('expiry_date', '>=', today())
                ->whereHas('product', function ($productQuery) use ($farm) {
                    $productQuery
                        ->where('farm_id', $farm->id)
                        ->where('status', 1);
                });
        };

        $farmIsActive = !$farm->trashed()
            && (int) $farm->status === Farm::STATUS_ACTIVE;

        $active = 0;
        $warning = 0;

        if ($farmIsActive) {
            $active = (clone $baseQuery)
                ->whereHas('productCertificate', $sellableRelation)
                ->where('status', 1)
                ->where('quantity_remaining', '>', 0)
                ->whereDate('expiry_date', '>=', today())
                ->count();

            $warning = (clone $baseQuery)
                ->whereHas('productCertificate', $sellableRelation)
                ->where('status', 1)
                ->where('quantity_remaining', '>', 0)
                ->whereBetween('expiry_date', [today(), today()->addDays(7)])
                ->count();
        }

        $deleted = HarvestLot::onlyTrashed()
            ->whereHas(
                'productCertificateIncludingDeleted.productIncludingDeleted',
                fn ($productQuery) => $productQuery->where('farm_id', $farm->id)
            )
            ->count();

        return [
            'total' => (clone $baseQuery)->count(),
            'deleted' => $deleted,
            'active' => $active,
            'warning' => $warning,
            'out_of_stock' => (clone $baseQuery)
                ->where('quantity_remaining', '<=', 0)
                ->count(),
        ];
    }

    public function getVendorLotOptions(int $sellerId): array
    {
        $farm = $this->getSellerFarm($sellerId);

        $products = Product::with(['category', 'approvedCertificate.certification'])
            ->where('farm_id', $farm->id)
            ->where('status', 1)
            ->whereHas('approvedCertificate')
            ->orderBy('name')
            ->get()
            ->map(function (Product $product) {
                $certificate = $product->approvedCertificate;

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'thumbnail' => $product->thumbnail,
                    'unit' => $product->unit,
                    'stock_quantity' => (float) $product->stock_quantity,
                    'category_name' => $product->category?->name,
                    'certificate' => $certificate ? [
                        'id' => $certificate->id,
                        'certification_name' => $certificate->certification?->name,
                        'certificate_number' => $certificate->certificate_number,
                        'expiry_date' => optional($certificate->expiry_date)->format('Y-m-d'),
                    ] : null,
                ];
            })
            ->values();

        $filterProducts = Product::withTrashed()
            ->withoutGlobalScope('farm_not_deleted')
            ->where('farm_id', $farm->id)
            ->orderBy('name')
            ->get(['id', 'name', 'deleted_at'])
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'is_deleted' => $product->trashed(),
            ])
            ->values();

        return [
            'products' => $products,
            'filter_products' => $filterProducts,
        ];
    }

    public function getVendorLotDetail(int $lotId, int $sellerId): HarvestLot
    {
        return $this->findSellerLot($lotId, $sellerId)
            ->loadCount('orderItemLots')
            ->load([
                'productCertificateIncludingDeleted.certification',
                'productCertificateIncludingDeleted.productIncludingDeleted.category',
                'productCertificateIncludingDeleted.productIncludingDeleted.farm',
                'productCertificateIncludingDeleted.productIncludingDeleted.approvedCertificate',
            ]);
    }

    public function createVendorLot(array $data, int $sellerId): HarvestLot
    {
        $farm = $this->getActiveSellerFarm($sellerId);

        $product = Product::with('approvedCertificate')
            ->where('id', $data['product_id'])
            ->where('farm_id', $farm->id)
            ->firstOrFail();

        if ((int) $product->status !== 1) {
            throw ValidationException::withMessages([
                'product_id' => ['Chỉ được tạo lô cho sản phẩm đã được duyệt và đang bán.'],
            ]);
        }

        $certificate = $product->approvedCertificate;

        if (!$certificate) {
            throw ValidationException::withMessages([
                'product_id' => ['Sản phẩm chưa có chứng chỉ được duyệt hoặc chứng chỉ đã hết hạn.'],
            ]);
        }

        return DB::transaction(function () use ($data, $certificate, $product) {
            $lot = HarvestLot::create([
                'product_certificate_id' => $certificate->id,
                'lot_code' => $data['lot_code'],
                'harvest_date' => $data['harvest_date'],
                'expiry_date' => $data['expiry_date'],
                'quantity_imported' => $data['quantity_imported'],
                'quantity_sold' => 0,
                'quantity_remaining' => $data['quantity_imported'],
                'status' => 1,
                'note' => $data['note'] ?? null,
            ]);

            $this->syncProductStock($product->id);

            return $lot->load([
                'productCertificate.certification',
                'productCertificate.product.category',
                'productCertificate.product.farm',
            ]);
        });
    }

public function updateVendorLot(array $data, int $lotId, int $sellerId): HarvestLot
{
    $lot = $this->findSellerLotForMutation($lotId, $sellerId)
        ->load('productCertificate.product');

    $certificate = $lot->productCertificate;
    $product = $certificate->product;
    if ((int) $lot->status === 4 || $lot->expiry_date->lt(today())) {
    throw ValidationException::withMessages([
        'lot' => ['Lô đã hết hạn sử dụng, không thể cập nhật hoặc bật bán lại. Vui lòng tạo lô mới.'],
        ]);
    }
    return DB::transaction(function () use ($data, $lot, $certificate, $product) {
        unset(
            $data['product_id'],
            $data['product_certificate_id'],
            $data['lot_code'],
            $data['quantity_sold'],
            $data['quantity_remaining']
        );

        $finalHarvestDate = array_key_exists('harvest_date', $data)
            ? $data['harvest_date']
            : $lot->harvest_date->toDateString();

        $finalExpiryDate = array_key_exists('expiry_date', $data)
            ? $data['expiry_date']
            : $lot->expiry_date->toDateString();

        if (strtotime($finalExpiryDate) <= strtotime($finalHarvestDate)) {
            throw ValidationException::withMessages([
                'expiry_date' => ['Hạn sử dụng lô phải sau ngày thu hoạch.'],
            ]);
        }

        if (strtotime($finalExpiryDate) < strtotime(today()->toDateString())) {
            throw ValidationException::withMessages([
                'expiry_date' => ['Hạn sử dụng lô phải lớn hơn hoặc bằng ngày hiện tại.'],
            ]);
        }

        $finalQuantityRemaining = (float) $lot->quantity_remaining;

        if ((float) $lot->quantity_sold > 0) {
            $immutableFields = [
                'harvest_date' => $lot->harvest_date->toDateString(),
                'expiry_date' => $lot->expiry_date->toDateString(),
                'quantity_imported' => (float) $lot->quantity_imported,
            ];

            foreach ($immutableFields as $field => $currentValue) {
                if (!array_key_exists($field, $data)) {
                    continue;
                }

                $nextValue = $field === 'quantity_imported'
                    ? (float) $data[$field]
                    : (string) $data[$field];

                if ($nextValue !== $currentValue) {
                    throw ValidationException::withMessages([
                        $field => ['Lô đã phát sinh đơn hàng nên không được sửa ngày thu hoạch, hạn sử dụng hoặc số lượng nhập.'],
                    ]);
                }

                unset($data[$field]);
            }
        }

        if (array_key_exists('quantity_imported', $data)) {
            $data['quantity_remaining'] = $data['quantity_imported'];
            $finalQuantityRemaining = (float) $data['quantity_imported'];
        }

        if (array_key_exists('status', $data)) {
            $newStatus = (int) $data['status'];

            if ($newStatus === 1) {
                if ((int) $product->status !== 1) {
                    throw ValidationException::withMessages([
                        'status' => ['Không thể bật bán lô khi sản phẩm không ở trạng thái đang bán.'],
                    ]);
                }

                if (
                    (int) $certificate->status !== 1 ||
                    !$certificate->expiry_date ||
                    $certificate->expiry_date->lt(today())
                ) {
                    throw ValidationException::withMessages([
                        'status' => ['Không thể bật bán lô vì chứng chỉ sản phẩm đã hết hạn hoặc không còn hiệu lực.'],
                    ]);
                }

                if ($finalQuantityRemaining <= 0) {
                    throw ValidationException::withMessages([
                        'status' => ['Không thể bật bán lô đã hết hàng.'],
                    ]);
                }

                if (strtotime($finalExpiryDate) < strtotime(today()->toDateString())) {
                    throw ValidationException::withMessages([
                        'status' => ['Không thể bật bán lô đã hết hạn sử dụng.'],
                    ]);
                }
            }
        }

        $lot->update($data);

        $lot->refresh();

        if ((float) $lot->quantity_remaining <= 0) {
            $lot->update(['status' => 3]);
        } elseif ($lot->expiry_date->lt(today())) {
            $lot->update(['status' => 4]);
        }

        $this->syncProductStock($product->id);

        return $lot->fresh([
            'productCertificate.certification',
            'productCertificate.product.category',
            'productCertificate.product.farm',
        ]);
    });
}

    public function deleteVendorLot(int $lotId, int $sellerId): void
    {
        $lot = $this->findSellerLotForMutation($lotId, $sellerId)
            ->load('productCertificate.product');

        if ((float) $lot->quantity_sold > 0 || $lot->orderItemLots()->exists()) {
            throw ValidationException::withMessages([
                'lot' => [
                    'Không thể xóa lô đã phát sinh bán hàng hoặc đã được phân bổ cho đơn hàng. '
                    . 'Hãy chuyển lô sang Tạm ẩn để giữ lịch sử truy xuất nguồn gốc.',
                ],
            ]);
        }

        $productId = $lot->productCertificate->product_id;

        DB::transaction(function () use ($lot, $productId) {
            $lot->delete();
            $this->syncProductStock($productId);
        });
    }

    public function restoreVendorLot(int $lotId, int $sellerId): HarvestLot
    {
        $lot = $this->findSellerTrashedLotForMutation($lotId, $sellerId)
            ->loadCount('orderItemLots')
            ->load(
                'productCertificateIncludingDeleted.productIncludingDeleted'
            );

        $certificate = $lot->productCertificateIncludingDeleted;
        $product = $certificate?->productIncludingDeleted;

        if (!$certificate || $certificate->trashed()) {
            throw ValidationException::withMessages([
                'lot' => ['Không thể khôi phục lô vì hồ sơ chứng chỉ đã bị xóa.'],
            ]);
        }

        if (!$product || $product->trashed()) {
            throw ValidationException::withMessages([
                'lot' => [
                    'Sản phẩm của lô đang ở mục Đã xóa. Hãy khôi phục sản phẩm trước, sau đó khôi phục lô.',
                ],
            ]);
        }

        if ((float) $lot->quantity_sold > 0 || (int) $lot->order_item_lots_count > 0) {
            throw ValidationException::withMessages([
                'lot' => ['Không thể khôi phục lô có lịch sử phân bổ hoặc bán hàng không hợp lệ.'],
            ]);
        }

        return DB::transaction(function () use ($lot, $product, $sellerId) {
            $lot->restore();

            // Khôi phục ở trạng thái Tạm ẩn để Seller kiểm tra lại trước khi bán.
            $lot->update(['status' => 2]);
            $this->syncProductStock($product->id);

            return $this->getVendorLotDetail(
                lotId: $lot->id,
                sellerId: $sellerId
            );
        });
    }

    public function forceDeleteVendorLot(int $lotId, int $sellerId): void
    {
        $lot = $this->findSellerTrashedLotForMutation($lotId, $sellerId)
            ->loadCount('orderItemLots')
            ->load('productCertificateIncludingDeleted.productIncludingDeleted');

        if ((float) $lot->quantity_sold > 0 || (int) $lot->order_item_lots_count > 0) {
            throw ValidationException::withMessages([
                'lot' => [
                    'Không thể xóa vĩnh viễn lô đã phát sinh bán hàng hoặc đã được phân bổ cho đơn hàng.',
                ],
            ]);
        }

        $productId = $lot->productCertificateIncludingDeleted?->product_id;

        DB::transaction(function () use ($lot, $productId) {
            $lot->forceDelete();

            if ($productId) {
                $this->syncProductStock((int) $productId);
            }
        });
    }

    private function getSellerFarm(int $sellerId): Farm
    {
        $farm = Farm::where('seller_id', $sellerId)->first();

        if (!$farm) {
            abort(403, 'Tài khoản người bán chưa có gian hàng');
        }

        return $farm;
    }

    private function getActiveSellerFarm(int $sellerId): Farm
    {
        $farm = $this->getSellerFarm($sellerId);

        if ($farm->trashed() || (int) $farm->status !== Farm::STATUS_ACTIVE) {
            throw ValidationException::withMessages([
                'farm' => [
                    'Gian hàng phải đang hoạt động mới được thay đổi lô thu hoạch. '
                    . 'Bạn vẫn có thể xem dữ liệu và xử lý các đơn hàng đã phát sinh.',
                ],
            ]);
        }

        return $farm;
    }

    private function findSellerLot(int $lotId, int $sellerId): HarvestLot
    {
        $farm = $this->getSellerFarm($sellerId);

        return HarvestLot::withTrashed()
            ->where('id', $lotId)
            ->whereHas(
                'productCertificateIncludingDeleted.productIncludingDeleted',
                fn ($query) => $query->where('farm_id', $farm->id)
            )
            ->firstOrFail();
    }

    private function findSellerLotForMutation(int $lotId, int $sellerId): HarvestLot
    {
        $farm = $this->getActiveSellerFarm($sellerId);

        return HarvestLot::query()
            ->where('id', $lotId)
            ->whereHas('productCertificate', function ($certificateQuery) use ($farm) {
                $certificateQuery
                    ->whereNull('deleted_at')
                    ->whereHas('product', function ($productQuery) use ($farm) {
                        $productQuery
                            ->where('farm_id', $farm->id)
                            ->whereNull('products.deleted_at');
                    });
            })
            ->firstOrFail();
    }

    private function findSellerTrashedLotForMutation(
        int $lotId,
        int $sellerId
    ): HarvestLot {
        $farm = $this->getActiveSellerFarm($sellerId);

        return HarvestLot::onlyTrashed()
            ->where('id', $lotId)
            ->whereHas(
                'productCertificateIncludingDeleted.productIncludingDeleted',
                fn ($query) => $query->where('farm_id', $farm->id)
            )
            ->firstOrFail();
    }

    private function syncProductStock(int $productId): void
    {
        $stock = HarvestLot::whereHas('productCertificate', function ($query) use ($productId) {
                $query->where('product_id', $productId)
                    ->where('status', 1)
                    ->whereDate('expiry_date', '>=', today());
            })
            ->where('status', 1)
            ->whereDate('expiry_date', '>=', today())
            ->sum('quantity_remaining');

        Product::where('id', $productId)->update([
            'stock_quantity' => $stock,
        ]);
    }
}
