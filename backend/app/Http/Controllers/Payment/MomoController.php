<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Payment\MomoPaymentService;
use Illuminate\Http\Request;

class MomoController extends Controller
{
    public function __construct(
        private MomoPaymentService $momoPaymentService,
    ) {}

    public function ipn(Request $request)
    {
        $data = $request->all();

        if (!$this->momoPaymentService->verifyCallbackSignature($data)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid signature.',
            ], 400);
        }

        $order = Order::with(['payment', 'subOrders'])
            ->whereHas('payment', fn ($query) => $query->where('transaction_code', $data['orderId'] ?? null))
            ->first();

        if (!$order || !$order->payment) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        if (!$this->callbackMatchesOrder($data, $order)) {
            return response()->json([
                'success' => false,
                'message' => 'Payment amount or request id does not match.',
            ], 400);
        }

        if ((int) ($data['resultCode'] ?? -1) === 0) {
            $order->payment()->update([
                'status' => 1,
                'paid_at' => now(),
            ]);

            $order->subOrders()
                ->where('status', '!=', 4)
                ->update([
                    'payment_status' => 1,
                ]);
        } else {
            $updated = $order->payment()
                ->where('status', '!=', 1)
                ->update(['status' => 2]);

            if ($updated > 0) {
                $order->subOrders()
                    ->where('payment_status', '!=', 1)
                    ->update(['payment_status' => 2]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'IPN received.',
        ]);
    }

    public function mockSuccess(Request $request, Order $order)
    {
        if (!app()->isLocal()) {
            abort(404);
        }

        if ((int) $order->user_id !== (int) $request->user()->id) {
            abort(403, 'Bạn không có quyền cập nhật đơn hàng này.');
        }

        $order->load(['payment', 'subOrders']);

        if (!$order->payment) {
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng chưa có thanh toán.',
            ], 422);
        }

        if ($order->payment->payment_method !== 'MOMO') {
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng này không phải thanh toán MoMo.',
            ], 422);
        }

        $order->payment->update([
            'status' => 1,
            'paid_at' => now(),
        ]);

        $order->subOrders()
            ->where('status', '!=', 4)
            ->update([
                'payment_status' => 1,
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Demo thanh toán MoMo thành công.',
            'data' => [
                'order_id' => $order->id,
                'order_code' => $order->order_code,
                'payment_status' => 1,
            ],
        ]);
    }
    public function redirect(Request $request)
{
    $data = $request->all();

    if (!$this->momoPaymentService->verifyCallbackSignature($data)) {
        $frontendUrl = rtrim(config('services.frontend_url'), '/');

        return redirect()->away(
            $frontendUrl . '/profile?tab=orders&payment=invalid'
        );
    }

    $order = Order::with(['payment', 'subOrders'])
        ->whereHas('payment', fn ($query) => $query->where('transaction_code', $data['orderId'] ?? null))
        ->first();

    if (!$order || !$order->payment) {
        $frontendUrl = rtrim(config('services.frontend_url'), '/');

        return redirect()->away(
            $frontendUrl . '/profile?tab=orders&payment=not_found'
        );
    }

    if (!$this->callbackMatchesOrder($data, $order)) {
        $frontendUrl = rtrim(config('services.frontend_url'), '/');

        return redirect()->away(
            $frontendUrl . '/profile?tab=orders&payment=invalid'
        );
    }

    if ((int) ($data['resultCode'] ?? -1) === 0) {
        $order->payment()->update([
            'status' => 1,
            'paid_at' => now(),
        ]);

        $order->subOrders()
            ->where('status', '!=', 4)
            ->update([
                'payment_status' => 1,
            ]);

        $frontendUrl = rtrim(config('services.frontend_url'), '/');

        return redirect()->away(
            $frontendUrl . '/order-success?payment=success&method=MOMO&order=' . $order->id
        );
    }

    $updated = $order->payment()
        ->where('status', '!=', 1)
        ->update(['status' => 2]);

    if ($updated > 0) {
        $order->subOrders()
            ->where('payment_status', '!=', 1)
            ->update(['payment_status' => 2]);
    }

    $frontendUrl = rtrim(config('services.frontend_url'), '/');

    return redirect()->away(
        $frontendUrl . '/profile?tab=orders&payment=failed&order=' . $order->id
    );
}

private function callbackMatchesOrder(array $data, Order $order): bool
{
    $expectedAmount = (int) round((float) $order->payment->amount);
    $callbackAmount = filter_var(
        $data['amount'] ?? null,
        FILTER_VALIDATE_INT
    );

    if ($callbackAmount === false || $callbackAmount !== $expectedAmount) {
        return false;
    }

    $requestId = (string) ($data['requestId'] ?? '');
    $expectedRequestId = (string) ($order->payment->transaction_code ?? '');

    return $requestId !== ''
        && $expectedRequestId !== ''
        && hash_equals($expectedRequestId, $requestId);
}

}
