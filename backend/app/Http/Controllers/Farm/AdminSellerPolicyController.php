<?php

namespace App\Http\Controllers\Farm;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\SellerPolicy;
use App\Models\User;
use App\Notifications\MarketplaceNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminSellerPolicyController extends Controller
{
    public function index(Request $request)
    {
        $policies = SellerPolicy::query()
            ->with(['creator:id,name', 'updater:id,name', 'publisher:id,name'])
            ->withCount('acceptances')
            ->latest('created_at')
            ->paginate(min(max((int) $request->input('per_page', 10), 1), 50));

        return response()->json(['success' => true, 'data' => $policies]);
    }

    public function show(SellerPolicy $policy)
    {
        return response()->json(['success' => true, 'data' => $policy->load([
            'creator:id,name', 'updater:id,name', 'publisher:id,name',
        ])->loadCount('acceptances')]);
    }

    public function store(Request $request)
    {
        $data = $this->validatePolicy($request);
        $data += ['status' => SellerPolicy::STATUS_DRAFT, 'created_by' => $request->user()->id];
        $data['updated_by'] = $request->user()->id;
        $policy = SellerPolicy::create($data);
        $this->audit($request, $policy, 'create', null, SellerPolicy::STATUS_DRAFT);

        return response()->json(['success' => true, 'message' => 'Đã tạo bản nháp chính sách.', 'data' => $policy], 201);
    }

    public function update(Request $request, SellerPolicy $policy)
    {
        abort_if($policy->status !== SellerPolicy::STATUS_DRAFT, 409, 'Chính sách đã công bố không được sửa trực tiếp. Hãy tạo phiên bản mới.');
        $lastKnown = $request->input('last_known_updated_at');
        abort_if(
            $lastKnown && $policy->updated_at?->toIso8601String() !== $lastKnown,
            409,
            'Bản nháp vừa được Admin khác cập nhật. Vui lòng tải lại trước khi sửa tiếp.'
        );
        $policy->update($this->validatePolicy($request, $policy) + ['updated_by' => $request->user()->id]);
        $this->audit($request, $policy, 'update', SellerPolicy::STATUS_DRAFT, SellerPolicy::STATUS_DRAFT);

        return response()->json(['success' => true, 'message' => 'Đã cập nhật bản nháp.', 'data' => $policy->fresh()]);
    }

    public function publish(Request $request, SellerPolicy $policy)
    {
        abort_if($policy->status !== SellerPolicy::STATUS_DRAFT, 409, 'Chỉ bản nháp mới được công bố.');
        abort_if($policy->effective_at?->isFuture(), 422, 'Ngày hiệu lực tương lai chưa được hỗ trợ. Hãy chọn hiện tại hoặc để trống.');
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
            'expected_current_policy_id' => ['nullable', 'integer'],
        ]);

        DB::transaction(function () use ($request, $policy, $validated) {
            $previousPolicies = SellerPolicy::query()
                ->where('status', SellerPolicy::STATUS_PUBLISHED)
                ->lockForUpdate()
                ->get();
            $actualCurrentId = $previousPolicies->first()?->id;
            abort_if(
                array_key_exists('expected_current_policy_id', $validated)
                    && (int) ($validated['expected_current_policy_id'] ?? 0) !== (int) ($actualCurrentId ?? 0),
                409,
                'Admin khác vừa công bố một phiên bản mới. Vui lòng tải lại danh sách trước khi công bố.'
            );
            SellerPolicy::query()
                ->where('status', SellerPolicy::STATUS_PUBLISHED)
                ->update([
                    'status' => SellerPolicy::STATUS_ARCHIVED,
                    'updated_by' => $request->user()->id,
                ]);
            foreach ($previousPolicies as $previousPolicy) {
                $this->audit(
                    $request,
                    $previousPolicy,
                    'archive',
                    SellerPolicy::STATUS_PUBLISHED,
                    SellerPolicy::STATUS_ARCHIVED,
                    "Thay thế bởi phiên bản {$policy->version}."
                );
            }
            $policy->update([
                'status' => SellerPolicy::STATUS_PUBLISHED,
                'effective_at' => $policy->effective_at ?: now(),
                'published_by' => $request->user()->id,
                'published_at' => now(),
                'updated_by' => $request->user()->id,
                'change_note' => $validated['reason'],
            ]);
            $this->audit($request, $policy, 'publish', SellerPolicy::STATUS_DRAFT, SellerPolicy::STATUS_PUBLISHED, $validated['reason']);
        });

        User::role('seller')->where('status', 1)->chunkById(200, function ($sellers) use ($policy, $request) {
            foreach ($sellers as $seller) {
                $message = $policy->requires_reacceptance
                    ? "Phiên bản {$policy->version} yêu cầu bạn đọc và chấp thuận lại."
                    : "Phiên bản {$policy->version} đã được công bố. Bạn có thể xem và xác nhận đã đọc; việc này không chặn thao tác Seller.";

                $seller->notify(new MarketplaceNotification(
                    'seller_policy.published',
                    'Chính sách người bán đã cập nhật',
                    $message,
                    '/seller-policy',
                    $request->user(),
                    [
                        'seller_policy_id' => $policy->id,
                        'version' => $policy->version,
                        'requires_reacceptance' => (bool) $policy->requires_reacceptance,
                    ]
                ));
            }
        });

        return response()->json(['success' => true, 'message' => 'Đã công bố chính sách mới.', 'data' => $policy->fresh()]);
    }

    public function destroy(Request $request, SellerPolicy $policy)
    {
        abort_if($policy->status !== SellerPolicy::STATUS_DRAFT, 409, 'Chỉ được xóa bản nháp.');
        $this->audit($request, $policy, 'soft_delete', SellerPolicy::STATUS_DRAFT, null);
        $policy->delete();
        return response()->json(['success' => true, 'message' => 'Đã xóa bản nháp chính sách.']);
    }

    private function validatePolicy(Request $request, ?SellerPolicy $policy = null): array
    {
        return $request->validate([
            'version' => ['required', 'string', 'max:50', Rule::unique('seller_policies', 'version')->ignore($policy?->id)],
            'title' => ['required', 'string', 'max:200'],
            'summary' => ['nullable', 'string', 'max:5000'],
            'content' => ['required', 'string', 'max:100000'],
            'requires_reacceptance' => ['required', 'boolean'],
            'effective_at' => ['nullable', 'date'],
            'change_note' => ['nullable', 'string', 'max:1000'],
            'last_known_updated_at' => ['nullable', 'date'],
        ]);
    }

    private function audit(Request $request, SellerPolicy $policy, string $action, $from, $to, ?string $reason = null): void
    {
        AuditLog::create([
            'actor_id' => $request->user()->id,
            'subject_type' => SellerPolicy::class,
            'subject_id' => $policy->id,
            'action' => $action,
            'from_status' => $from,
            'to_status' => $to,
            'reason' => $reason,
            'context' => ['version' => $policy->version],
            'ip_address' => $request->ip(),
            'user_agent' => mb_substr((string) $request->userAgent(), 0, 500),
        ]);
    }
}
