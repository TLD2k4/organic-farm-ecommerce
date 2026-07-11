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

        $query = HarvestLot::query()
            ->with([
                'productCertificate.certification',
                'productCertificate.product.category',
                'productCertificate.product.farm',
            ])
            ->whereHas('productCertificate.product', function ($query) use ($farm) {
                $query->where('farm_id', $farm->id);
            })
            ->orderBy('id', 'desc');

        if (!empty($filters['product_id'])) {
            $query->whereHas('productCertificate', function ($query) use ($filters) {
                $query->where('product_id', $filters['product_id']);
            });
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

        if (!empty($filters['lot_code'])) {
            $query->where('lot_code', 'like', '%' . $filters['lot_code'] . '%');
        }

        $limit = $filters['per_page'] ?? $filters['limit'] ?? 10;

        return $query->paginate($limit);
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
        ->map(function ($product) {
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

    return [
        'products' => $products,
    ];
}
    public function getVendorLotDetail(int $lotId, int $sellerId): HarvestLot
    {
        return $this->findSellerLot($lotId, $sellerId)
            ->load([
                'productCertificate.certification',
                'productCertificate.product.category',
                'productCertificate.product.farm',
            ]);
    }

    public function createVendorLot(array $data, int $sellerId): HarvestLot
    {
        $farm = $this->getSellerFarm($sellerId);

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
    $lot = $this->findSellerLot($lotId, $sellerId)
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

        if (array_key_exists('quantity_imported', $data)) {
            if ((float) $lot->quantity_sold > 0) {
                throw ValidationException::withMessages([
                    'quantity_imported' => ['Không được sửa số lượng nhập khi lô đã phát sinh bán hàng.'],
                ]);
            }

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
        $lot = $this->findSellerLot($lotId, $sellerId)
            ->load('productCertificate.product');

        if ((float) $lot->quantity_sold > 0) {
            throw ValidationException::withMessages([
                'lot' => ['Không thể xóa lô đã phát sinh bán hàng. Có thể tạm ẩn lô thay vì xóa.'],
            ]);
        }

        $productId = $lot->productCertificate->product_id;

        DB::transaction(function () use ($lot, $productId) {
            $lot->delete();

            $this->syncProductStock($productId);
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

    private function findSellerLot(int $lotId, int $sellerId): HarvestLot
    {
        $farm = $this->getSellerFarm($sellerId);

        return HarvestLot::where('id', $lotId)
            ->whereHas('productCertificate.product', function ($query) use ($farm) {
                $query->where('farm_id', $farm->id);
            })
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