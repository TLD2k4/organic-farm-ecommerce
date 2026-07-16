<?php

namespace App\Http\Middleware;

use App\Models\FarmPolicyAcceptance;
use App\Models\SellerPolicy;
use Closure;
use Illuminate\Http\Request;

class EnsureSellerPolicyAccepted
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user || $user->hasRole('admin') || !$user->farm || $request->isMethodSafe()) {
            return $next($request);
        }

        // Hoàn tất nghĩa vụ với đơn hàng hiện có luôn được ưu tiên. Seller vẫn
        // được chuyển trạng thái đơn đang chuẩn bị/đang giao dù chưa đồng ý
        // phiên bản chính sách mới; các thao tác kinh doanh mới vẫn bị chặn.
        if ($request->is('api/vendor/orders/*/status') && $request->isMethod('patch')) {
            return $next($request);
        }

        $policy = SellerPolicy::current();

        if (!$policy || !$policy->requires_reacceptance) {
            return $next($request);
        }

        $accepted = FarmPolicyAcceptance::query()
            ->where('user_id', $user->id)
            ->where('farm_id', $user->farm->id)
            ->where('seller_policy_id', $policy->id)
            ->exists();

        if (!$accepted) {
            return response()->json([
                'success' => false,
                'error' => 'Bạn cần đọc và chấp thuận chính sách người bán mới trước khi tiếp tục.',
                'code' => 'SELLER_POLICY_ACCEPTANCE_REQUIRED',
                'seller_policy_id' => $policy->id,
                'policy_version' => $policy->version,
            ], 428);
        }

        return $next($request);
    }
}
