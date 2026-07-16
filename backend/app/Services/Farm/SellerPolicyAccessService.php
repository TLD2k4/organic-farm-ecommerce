<?php

namespace App\Services\Farm;

use App\Models\Farm;
use App\Models\FarmPolicyAcceptance;
use App\Models\SellerPolicy;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class SellerPolicyAccessService
{
    private bool $policyResolved = false;

    private ?SellerPolicy $requiredPolicy = null;

    private array $farmAvailability = [];

    private array $adminSellers = [];

    public function availability(?Farm $farm): array
    {
        if (!$farm) {
            return [
                'accepting_orders' => false,
                'reason' => 'Gian hàng không còn tồn tại hoặc đã ngừng hoạt động.',
                'policy_version' => null,
            ];
        }

        if ((int) $farm->status !== Farm::STATUS_ACTIVE || $farm->trashed()) {
            return [
                'accepting_orders' => false,
                'reason' => 'Gian hàng hiện đang tạm ngừng nhận đơn mới.',
                'policy_version' => null,
            ];
        }

        if (array_key_exists($farm->id, $this->farmAvailability)) {
            return $this->farmAvailability[$farm->id];
        }

        $policy = $this->requiredPolicy();

        if (!$policy || $this->isAdminSeller((int) $farm->seller_id)) {
            return $this->farmAvailability[$farm->id] = [
                'accepting_orders' => true,
                'reason' => null,
                'policy_version' => $policy?->version,
            ];
        }

        $accepted = FarmPolicyAcceptance::query()
            ->where('user_id', $farm->seller_id)
            ->where('farm_id', $farm->id)
            ->where('seller_policy_id', $policy->id)
            ->exists();

        return $this->farmAvailability[$farm->id] = [
            'accepting_orders' => $accepted,
            'reason' => $accepted
                ? null
                : 'Gian hàng tạm ngừng nhận đơn mới vì người bán chưa chấp thuận chính sách phiên bản '
                    . $policy->version . '.',
            'policy_version' => $policy->version,
        ];
    }

    public function ensureCanReceiveNewOrder(?Farm $farm): void
    {
        $availability = $this->availability($farm);

        if (!$availability['accepting_orders']) {
            throw ValidationException::withMessages([
                'farm_policy' => [$availability['reason']],
            ]);
        }
    }

    private function requiredPolicy(): ?SellerPolicy
    {
        if (!$this->policyResolved) {
            $policy = SellerPolicy::current();
            $this->requiredPolicy = $policy?->requires_reacceptance
                ? $policy
                : null;
            $this->policyResolved = true;
        }

        return $this->requiredPolicy;
    }

    private function isAdminSeller(int $sellerId): bool
    {
        if (!$sellerId) {
            return false;
        }

        if (!array_key_exists($sellerId, $this->adminSellers)) {
            $seller = User::withTrashed()
                ->with('roles:id,name')
                ->find($sellerId);
            $this->adminSellers[$sellerId] = $seller?->hasRole('admin') ?? false;
        }

        return $this->adminSellers[$sellerId];
    }
}
