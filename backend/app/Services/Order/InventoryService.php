<?php

namespace App\Services\Order;

use App\Models\HarvestLot;
use App\Models\OrderItem;
use App\Models\OrderItemLot;
use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    /**
     * Xuất kho theo FIFO.
     *
     * harvest_date ASC
     * id ASC
     */
    public function allocateLots(OrderItem $orderItem): void
    {
        DB::transaction(function () use ($orderItem) {
            $needQuantity = round((float) $orderItem->quantity, 2);

            $lots = $this->getAvailableLots($orderItem->product_id);

            foreach ($lots as $lot) {
                if ($needQuantity <= 0) {
                    break;
                }

                $available = round((float) $lot->quantity_remaining, 2);

                if ($available <= 0) {
                    continue;
                }

                $take = round(min($available, $needQuantity), 2);

                OrderItemLot::create([
                    'order_item_id' => $orderItem->id,
                    'harvest_lot_id' => $lot->id,
                    'quantity' => $take,
                ]);

                $lot->quantity_sold = round((float) $lot->quantity_sold + $take, 2);
                $lot->quantity_remaining = round($available - $take, 2);

                if ($lot->expiry_date->lt(today())) {
                    $lot->status = 4;
                } elseif ($lot->quantity_remaining <= 0) {
                    $lot->status = 3;
                } else {
                    $lot->status = 1;
                }

                $lot->save();

                $needQuantity = round($needQuantity - $take, 2);
            }

            if ($needQuantity > 0.001) {
                throw ValidationException::withMessages([
                    'stock' => [
                        'Sản phẩm "' . $orderItem->product_name . '" không đủ tồn kho.'
                    ],
                ]);
            }

            $this->syncProductStock($orderItem->product_id);
        });
    }

    /**
     * Hoàn kho khi hủy đơn.
     */
    public function restoreLots(OrderItem $orderItem): void
    {
        DB::transaction(function () use ($orderItem) {
            foreach ($orderItem->orderItemLots as $itemLot) {
                $lot = HarvestLot::withTrashed()
                    ->lockForUpdate()
                    ->find($itemLot->harvest_lot_id);

                if (!$lot) {
                    continue;
                }

                $previousStatus = (int) $lot->status;
                $restoredQuantity = round((float) $itemLot->quantity, 2);
                $lot->quantity_remaining = round(
                    (float) $lot->quantity_remaining + $restoredQuantity,
                    2,
                );
                $lot->quantity_sold = round(
                    (float) $lot->quantity_sold - $restoredQuantity,
                    2,
                );

                if ($lot->quantity_sold < 0) {
                    $lot->quantity_sold = 0;
                }

                if ($lot->expiry_date->lt(today())) {
                    $lot->status = 4;
                } elseif (in_array($previousStatus, [2, 4], true)) {
                    // Hoàn kho không được tự mở lại lô mà Seller đã tạm ẩn
                    // hoặc lô đã được đánh dấu hết hạn.
                    $lot->status = $previousStatus;
                } elseif ($lot->quantity_remaining > 0) {
                    // Chỉ lô trước đó đang bán/hết hàng mới tự quay lại Đang bán.
                    $lot->status = 1;
                } else {
                    $lot->status = 3;
                }

                $lot->save();
            }

            // Xóa mapping để tránh hoàn kho nhiều lần
            $orderItem->orderItemLots()->delete();

            $this->syncProductStock($orderItem->product_id);
        });
    }

    /**
     * Kiểm tra tồn kho trước khi đặt hàng.
     */
    public function checkStock(int $productId, float $quantity): void
    {
        $available = HarvestLot::whereHas('productCertificate', function ($query) use ($productId) {
                $query->where('product_id', $productId)
                    ->where('status', 1)
                    ->whereDate('expiry_date', '>=', today());
            })
            ->where('status', 1)
            ->whereDate('expiry_date', '>=', today())
            ->sum('quantity_remaining');

        if ((float) $available + 0.0001 < round($quantity, 2)) {
            $product = Product::find($productId);

            throw ValidationException::withMessages([
                'stock' => [
                    'Sản phẩm "' . ($product?->name ?? '') . '" không đủ tồn kho.'
                ],
            ]);
        }
    }

    /**
     * Đồng bộ tồn kho Product.
     */
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

    /**
     * Lấy danh sách lô còn hàng theo FIFO.
     */
    private function getAvailableLots(int $productId): Collection
    {
        return HarvestLot::whereHas('productCertificate', function ($query) use ($productId) {
                $query->where('product_id', $productId)
                    ->where('status', 1)
                    ->whereDate('expiry_date', '>=', today());
            })
            ->where('status', 1)
            ->where('quantity_remaining', '>', 0)
            ->whereDate('expiry_date', '>=', today())
            ->orderBy('harvest_date')
            ->orderBy('id')
            ->lockForUpdate()
            ->get();
    }
}
