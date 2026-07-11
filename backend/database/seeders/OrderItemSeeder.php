<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\SubOrder;
use Illuminate\Database\Seeder;

class OrderItemSeeder extends Seeder
{
    public function run(): void
    {
        $subOrders = SubOrder::all();

        foreach ($subOrders as $subOrder) {
            $products = Product::where('farm_id', $subOrder->farm_id)
                ->orderBy('id')
                ->take(3)
                ->get();

            $itemsTotal = 0;

            foreach ($products as $index => $product) {
                $quantity = $index === 0 ? 1 : 2;
                $price = $product->sale_price ?? $product->price;
                $subtotal = $quantity * $price;

                // Order item tạo sau sub order vài phút
                $itemDate = $subOrder->created_at->copy()->addMinutes($index + 1);

                OrderItem::create([
                    'sub_order_id' => $subOrder->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_image' => $product->thumbnail,
                    'unit' => $product->unit,
                    'quantity' => $quantity,
                    'price' => $price,
                    'subtotal' => $subtotal,

                    'created_at' => $itemDate,
                    'updated_at' => $itemDate,
                ]);

                $itemsTotal += $subtotal;
            }

            $shippingFee = 15000;

            // updated_at thể hiện thời điểm trạng thái cuối cùng của sub order
            $subOrderUpdatedAt = $this->getStatusUpdatedAt(
                $subOrder->created_at,
                $subOrder->status
            );

            $subOrder->update([
                'items_total' => $itemsTotal,
                'shipping_fee' => $shippingFee,
                'total' => $itemsTotal + $shippingFee,
                'updated_at' => $subOrderUpdatedAt,
            ]);
        }

        $orders = Order::with('subOrders')->get();

        foreach ($orders as $order) {
            $itemsTotal = $order->subOrders->sum('items_total');
            $shippingFee = $order->subOrders->sum('shipping_fee');

            // updated_at thể hiện thời điểm trạng thái cuối cùng của order
            $orderUpdatedAt = $this->getStatusUpdatedAt(
                $order->created_at,
                $order->status
            );

            $order->update([
                'items_total' => $itemsTotal,
                'shipping_fee' => $shippingFee,
                'grand_total' => $itemsTotal + $shippingFee,
                'updated_at' => $orderUpdatedAt,
            ]);
        }
    }

    private function getStatusUpdatedAt($createdAt, int $status)
    {
        return match ($status) {
            0 => $createdAt->copy()->addMinutes(30), // Pending
            1 => $createdAt->copy()->addHours(2),    // Processing
            2 => $createdAt->copy()->addDay(),       // Shipping
            3 => $createdAt->copy()->addDays(3),     // Delivered
            4 => $createdAt->copy()->addHours(4),    // Cancelled
            default => $createdAt->copy()->addMinutes(10),
        };
    }
}