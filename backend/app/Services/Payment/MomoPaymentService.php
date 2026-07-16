<?php

namespace App\Services\Payment;

use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class MomoPaymentService
{
    public function createPayment(Order $order): array
    {
        $order->loadMissing('payment');

        $endpoint = config('services.momo.endpoint');
        $partnerCode = config('services.momo.partner_code');
        $accessKey = config('services.momo.access_key');
        $secretKey = config('services.momo.secret_key');
        $requestType = config('services.momo.request_type', 'payWithATM');
        $redirectUrl = config('services.momo.redirect_url');
        $ipnUrl = config('services.momo.ipn_url');

        if (
            !$endpoint ||
            !$partnerCode ||
            !$accessKey ||
            !$secretKey ||
            !$redirectUrl ||
            !$ipnUrl
        ) {
            throw ValidationException::withMessages([
                'momo' => [
                    'Chưa cấu hình đầy đủ MoMo (endpoint, khóa, redirect URL và IPN URL).'
                ],
            ]);
        }

        $amount = (string) (int) round((float) $order->grand_total);
        $requestId = $order->payment?->transaction_code ?: uniqid('MOMO_');
        // MoMo không cho tạo lại giao dịch với orderId cũ. Dùng mã giao dịch
        // riêng cho từng lần thử, còn mã đơn thật vẫn nằm trong orderInfo.
        $orderId = $requestId;
        $orderInfo = 'Thanh toán đơn hàng ' . $order->order_code;
        $extraData = '';

        $rawHash =
            'accessKey=' . $accessKey .
            '&amount=' . $amount .
            '&extraData=' . $extraData .
            '&ipnUrl=' . $ipnUrl .
            '&orderId=' . $orderId .
            '&orderInfo=' . $orderInfo .
            '&partnerCode=' . $partnerCode .
            '&redirectUrl=' . $redirectUrl .
            '&requestId=' . $requestId .
            '&requestType=' . $requestType;

        $signature = hash_hmac('sha256', $rawHash, $secretKey);

        $payload = [
            'partnerCode' => $partnerCode,
            'partnerName' => 'Organic Farm',
            'storeId' => 'OrganicFarmStore',
            'requestId' => $requestId,
            'amount' => $amount,
            'orderId' => $orderId,
            'orderInfo' => $orderInfo,
            'redirectUrl' => $redirectUrl,
            'ipnUrl' => $ipnUrl,
            'lang' => 'vi',
            'extraData' => $extraData,
            'requestType' => $requestType,
            'signature' => $signature,
        ];

        $response = Http::timeout(20)
            ->acceptJson()
            ->post($endpoint, $payload);

        if (!$response->successful()) {
            throw ValidationException::withMessages([
                'momo' => ['Không thể kết nối MoMo.'],
            ]);
        }

        $data = $response->json();

        if (empty($data['payUrl'])) {
            throw ValidationException::withMessages([
                'momo' => [
                    $data['message'] ?? 'Không tạo được link thanh toán MoMo ATM.'
                ],
            ]);
        }

        return [
            'payment_url' => $data['payUrl'],
            'deeplink' => $data['deeplink'] ?? null,
            'qr_code_url' => $data['qrCodeUrl'] ?? null,
            'raw' => $data,
        ];
    }

    public function verifyCallbackSignature(array $data): bool
    {
        if (empty($data['signature'])) {
            return false;
        }

        $accessKey = config('services.momo.access_key');
        $secretKey = config('services.momo.secret_key');

        $rawHash =
            'accessKey=' . $accessKey .
            '&amount=' . ($data['amount'] ?? '') .
            '&extraData=' . ($data['extraData'] ?? '') .
            '&message=' . ($data['message'] ?? '') .
            '&orderId=' . ($data['orderId'] ?? '') .
            '&orderInfo=' . ($data['orderInfo'] ?? '') .
            '&orderType=' . ($data['orderType'] ?? '') .
            '&partnerCode=' . ($data['partnerCode'] ?? '') .
            '&payType=' . ($data['payType'] ?? '') .
            '&requestId=' . ($data['requestId'] ?? '') .
            '&responseTime=' . ($data['responseTime'] ?? '') .
            '&resultCode=' . ($data['resultCode'] ?? '') .
            '&transId=' . ($data['transId'] ?? '');

        $signature = hash_hmac('sha256', $rawHash, $secretKey);

        return hash_equals($signature, $data['signature']);
    }
}
