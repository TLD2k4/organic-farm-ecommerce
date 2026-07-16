<?php

namespace App\Http\Controllers\Farm;

use App\Http\Controllers\Controller;
use App\Models\FarmPolicyAcceptance;
use App\Models\SellerPolicy;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SellerPolicyController extends Controller
{
    public function current()
    {
        $policy = SellerPolicy::current();

        return response()->json([
            'success' => true,
            'data' => $policy ? $this->formatPolicy($policy) : null,
        ]);
    }

    public function status(Request $request)
    {
        $user = $request->user();
        $farm = $user->farm;
        $policy = SellerPolicy::current();

        if (!$policy || $user->hasRole('admin') || !$farm) {
            return response()->json(['success' => true, 'data' => [
                'current_policy' => $policy ? $this->formatPolicy($policy, false) : null,
                'current_version' => $policy?->version,
                'effective_at' => $policy?->effective_at?->toIso8601String(),
                'accepted' => true,
                'requires_acceptance' => false,
                'can_accept' => false,
                'applicable' => false,
                'latest_acceptance' => null,
            ]]);
        }

        $latest = FarmPolicyAcceptance::query()
            ->where('user_id', $user->id)
            ->where('farm_id', $farm->id)
            ->with('policy:id,version,title')
            ->latest('accepted_at')
            ->first();
        $acceptedCurrent = FarmPolicyAcceptance::query()
            ->where('user_id', $user->id)
            ->where('farm_id', $farm->id)
            ->where('seller_policy_id', $policy->id)
            ->exists();
        $requiresAcceptance = $policy->requires_reacceptance && !$acceptedCurrent;

        return response()->json(['success' => true, 'data' => [
            'current_policy' => $this->formatPolicy($policy, false),
            'current_version' => $policy->version,
            'effective_at' => $policy->effective_at?->toIso8601String(),
            'accepted' => $acceptedCurrent,
            'requires_acceptance' => $requiresAcceptance,
            'can_accept' => !$acceptedCurrent,
            'applicable' => true,
            'acceptance_required_by_policy' => (bool) $policy->requires_reacceptance,
            'latest_acceptance' => $latest ? [
                'seller_policy_id' => $latest->seller_policy_id,
                'policy_version' => $latest->policy_version,
                'accepted_at' => $latest->accepted_at?->toIso8601String(),
            ] : null,
        ]]);
    }

    public function history(Request $request)
    {
        $items = FarmPolicyAcceptance::query()
            ->where('user_id', $request->user()->id)
            ->with('policy:id,version,title,summary,content,effective_at,published_at')
            ->latest('accepted_at')
            ->get();

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function accept(Request $request)
    {
        $user = $request->user();
        $farm = $user->farm;
        abort_unless($farm, 422, 'Bạn chưa có hồ sơ nông trại.');
        $policy = SellerPolicy::current();
        abort_unless($policy, 422, 'Chưa có chính sách người bán đang hiệu lực.');

        $validated = $request->validate([
            'policy_accepted' => ['required', 'accepted'],
            'seller_policy_id' => ['required', 'integer', Rule::in([$policy->id])],
            'policy_version' => ['required', 'string', Rule::in([$policy->version])],
        ]);

        $acceptance = FarmPolicyAcceptance::firstOrCreate(
            ['user_id' => $user->id, 'farm_id' => $farm->id, 'seller_policy_id' => $policy->id],
            [
                'policy_version' => $validated['policy_version'],
                'accepted_at' => now(),
                'ip_address' => $request->ip(),
                'user_agent' => mb_substr((string) $request->userAgent(), 0, 1000),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Đã ghi nhận chấp thuận chính sách người bán.',
            'data' => $acceptance,
        ]);
    }

    private function formatPolicy(SellerPolicy $policy, bool $withContent = true): array
    {
        return [
            'id' => $policy->id,
            'version' => $policy->version,
            'title' => $policy->title,
            'summary' => $policy->summary,
            'content' => $withContent ? $policy->content : null,
            'requires_reacceptance' => $policy->requires_reacceptance,
            'effective_at' => $policy->effective_at?->toIso8601String(),
            'published_at' => $policy->published_at?->toIso8601String(),
            'change_note' => $policy->change_note,
        ];
    }
}
