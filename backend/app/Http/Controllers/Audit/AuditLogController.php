<?php

namespace App\Http\Controllers\Audit;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Farm;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductCertificate;
use App\Models\Review;
use App\Models\SellerPolicy;
use App\Models\SubOrder;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function adminIndex(Request $request)
    {
        $filters = $request->validate([
            'subject_type' => ['nullable', 'string', 'max:100'],
            'subject_id' => ['nullable', 'integer', 'min:1'],
            'action' => ['nullable', 'string', 'max:100'],
            'actor_id' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:50'],
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->paginate($this->applyFilters(
                AuditLog::query()->with('actor:id,name,email'),
                $filters
            ), (int) ($filters['per_page'] ?? 15)),
        ]);
    }

    public function myActivity(Request $request)
    {
        $userId = (int) $request->user()->id;

        $query = AuditLog::query()
            ->with('actor:id,name,email')
            ->where(function (Builder $builder) use ($userId) {
                $builder->where(function (Builder $subjectQuery) use ($userId) {
                    $subjectQuery->where('subject_type', 'user')
                        ->where('subject_id', $userId);
                })->orWhere('context->seller_id', $userId)
                    ->orWhere('context->buyer_id', $userId);
            });

        return response()->json([
            'success' => true,
            'data' => $this->paginate($query, 20),
        ]);
    }

    private function applyFilters(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['subject_type'] ?? null, fn (Builder $q, $value) =>
                $q->where('subject_type', $value))
            ->when($filters['subject_id'] ?? null, fn (Builder $q, $value) =>
                $q->where('subject_id', $value))
            ->when($filters['action'] ?? null, fn (Builder $q, $value) =>
                $q->where('action', $value))
            ->when($filters['actor_id'] ?? null, fn (Builder $q, $value) =>
                $q->where('actor_id', $value));
    }

    private function paginate(Builder $query, int $perPage): array
    {
        $paginator = $query->latest('id')->paginate($perPage);

        return [
            'logs' => $paginator->getCollection()->map(fn (AuditLog $log) => [
                'id' => $log->id,
                'subject_type' => $log->subject_type,
                'subject_id' => $log->subject_id,
                'subject' => $this->resolveSubject($log),
                'action' => $log->action,
                'from_status' => $log->from_status,
                'to_status' => $log->to_status,
                'reason' => $log->reason,
                'context' => $log->context,
                'ip_address' => $log->ip_address,
                'user_agent' => $log->user_agent,
                'created_at' => optional($log->created_at)->format('d/m/Y H:i:s'),
                'actor' => $log->actor ? [
                    'id' => $log->actor->id,
                    'name' => $log->actor->name,
                    'email' => $log->actor->email,
                ] : null,
            ])->values(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
            ],
        ];
    }

    /**
     * Chuyển subject_type + subject_id kỹ thuật thành đối tượng nghiệp vụ dễ đọc.
     * Audit log vẫn giữ được thông tin cơ bản khi đối tượng đã bị xóa vĩnh viễn.
     */
    private function resolveSubject(AuditLog $log): array
    {
        $type = $this->normalizeSubjectType($log->subject_type);
        $context = is_array($log->context) ? $log->context : [];
        $id = (int) $log->subject_id;

        return match ($type) {
            'user' => $this->resolveUserSubject($id, $context),
            'farm' => $this->resolveFarmSubject($id, $context),
            'product' => $this->resolveProductSubject($id, $context),
            'product_certificate', 'certificate' =>
                $this->resolveCertificateSubject($id, $context),
            'order' => $this->resolveOrderSubject($id, $context),
            'sub_order' => $this->resolveSubOrderSubject($id, $context),
            'review' => $this->resolveReviewSubject($id, $context),
            'seller_policy' => $this->resolveSellerPolicySubject($id, $context),
            default => $this->subjectPayload(
                type: $type,
                typeLabel: $this->subjectTypeLabel($type),
                id: $id,
                code: '#' . $id,
                name: $context['subject_name'] ?? null,
                detailUrl: null,
                exists: false,
            ),
        };
    }

    private function resolveUserSubject(int $id, array $context): array
    {
        $user = User::withTrashed()->find($id);

        return $this->subjectPayload(
            type: 'user',
            typeLabel: 'Tài khoản',
            id: $id,
            code: 'ND' . str_pad((string) $id, 6, '0', STR_PAD_LEFT),
            name: $user?->name ?? $context['user_name'] ?? null,
            description: $user?->email,
            detailUrl: $user ? "/admin/users?view={$id}" : null,
            exists: $user !== null,
        );
    }

    private function resolveFarmSubject(int $id, array $context): array
    {
        $farm = Farm::withTrashed()->find($id);

        return $this->subjectPayload(
            type: 'farm',
            typeLabel: 'Nông trại',
            id: $id,
            code: 'NT' . str_pad((string) $id, 6, '0', STR_PAD_LEFT),
            name: $farm?->name ?? $context['farm_name'] ?? null,
            detailUrl: $farm ? $this->farmDetailUrl($farm) : null,
            exists: $farm !== null,
        );
    }

    private function resolveProductSubject(int $id, array $context): array
    {
        $product = Product::withoutGlobalScope('farm_not_deleted')
            ->withTrashed()
            ->with([
                'farm' => fn ($query) => $query->withTrashed(),
                'approvedCertificate',
            ])
            ->find($id);

        return $this->subjectPayload(
            type: 'product',
            typeLabel: 'Sản phẩm',
            id: $id,
            code: 'SP' . str_pad((string) $id, 6, '0', STR_PAD_LEFT),
            name: $product?->name ?? $context['product_name'] ?? null,
            detailUrl: $product ? $this->productDetailUrl($product) : null,
            exists: $product !== null,
        );
    }

    private function resolveCertificateSubject(int $id, array $context): array
    {
        $certificate = ProductCertificate::withTrashed()->find($id);
        $productId = (int) ($certificate?->product_id ?? $context['product_id'] ?? 0);
        $product = $productId > 0
            ? Product::withoutGlobalScope('farm_not_deleted')
                ->withTrashed()
                ->with([
                    'farm' => fn ($query) => $query->withTrashed(),
                    'approvedCertificate',
                ])
                ->find($productId)
            : null;

        $certificateNumber = $certificate?->certificate_number
            ?? $context['certificate_number']
            ?? null;

        return $this->subjectPayload(
            type: 'product_certificate',
            typeLabel: 'Hồ sơ chứng chỉ sản phẩm',
            id: $id,
            code: 'HSCC' . str_pad((string) $id, 6, '0', STR_PAD_LEFT),
            name: $certificateNumber
                ? "Số chứng chỉ {$certificateNumber}"
                : ($context['subject_name'] ?? null),
            description: $product
                ? "Sản phẩm {$product->name} (SP" . str_pad((string) $product->id, 6, '0', STR_PAD_LEFT) . ')'
                : null,
            detailUrl: $product !== null
                ? ($this->isPublicProduct($product)
                    ? "/products/{$product->slug}"
                    : "/admin/products?view={$productId}&certificate={$id}")
                : null,
            exists: $certificate !== null,
        );
    }

    private function resolveOrderSubject(int $id, array $context): array
    {
        $order = Order::withTrashed()->find($id);

        return $this->subjectPayload(
            type: 'order',
            typeLabel: 'Đơn hàng tổng',
            id: $id,
            code: $order?->order_code ?? ('DH' . str_pad((string) $id, 6, '0', STR_PAD_LEFT)),
            name: $order?->shipping_name ?? $context['buyer_name'] ?? null,
            detailUrl: $order ? "/admin/orders?mode=orders&view={$id}" : null,
            exists: $order !== null,
        );
    }

    private function resolveSubOrderSubject(int $id, array $context): array
    {
        $subOrder = SubOrder::withTrashed()
            ->with([
                'farm' => fn ($query) => $query->withTrashed(),
                'order' => fn ($query) => $query->withTrashed(),
            ])
            ->find($id);

        return $this->subjectPayload(
            type: 'sub_order',
            typeLabel: 'Đơn hàng theo nông trại',
            id: $id,
            code: $subOrder?->sub_order_code
                ?? ('DCT' . str_pad((string) $id, 6, '0', STR_PAD_LEFT)),
            name: $subOrder?->farm?->name ?? $context['farm_name'] ?? null,
            description: $subOrder?->order?->order_code
                ? "Thuộc đơn tổng {$subOrder->order->order_code}"
                : null,
            detailUrl: $subOrder ? "/admin/orders?mode=sub_orders&view={$id}" : null,
            exists: $subOrder !== null,
        );
    }

    private function resolveReviewSubject(int $id, array $context): array
    {
        $review = Review::withTrashed()->find($id);
        $product = $review?->product_id
            ? Product::withoutGlobalScope('farm_not_deleted')
                ->withTrashed()
                ->with([
                    'farm' => fn ($query) => $query->withTrashed(),
                    'approvedCertificate',
                ])
                ->find($review->product_id)
            : null;

        $excerpt = $review?->comment
            ? mb_strimwidth(trim($review->comment), 0, 80, '…')
            : null;

        return $this->subjectPayload(
            type: 'review',
            typeLabel: $review?->rating !== null ? 'Đánh giá sản phẩm' : 'Bình luận sản phẩm',
            id: $id,
            code: 'DG' . str_pad((string) $id, 6, '0', STR_PAD_LEFT),
            name: $excerpt ?? $context['subject_name'] ?? null,
            description: $product?->name,
            detailUrl: $product ? $this->productDetailUrl($product) : null,
            exists: $review !== null,
        );
    }

    private function resolveSellerPolicySubject(int $id, array $context): array
    {
        $policy = SellerPolicy::withTrashed()->find($id);

        return $this->subjectPayload(
            type: 'seller_policy',
            typeLabel: 'Chính sách Seller',
            id: $id,
            code: $policy?->version ?? ('CS' . str_pad((string) $id, 6, '0', STR_PAD_LEFT)),
            name: $policy?->title ?? $context['subject_name'] ?? null,
            detailUrl: $policy ? '/admin/seller-policies' : null,
            exists: $policy !== null,
        );
    }

    private function farmDetailUrl(Farm $farm): string
    {
        $isPublic = !$farm->trashed()
            && (int) $farm->status === Farm::STATUS_ACTIVE
            && filled($farm->slug);

        return $isPublic
            ? "/farms/{$farm->slug}"
            : "/admin/farms?view={$farm->id}";
    }

    private function productDetailUrl(Product $product): string
    {
        return $this->isPublicProduct($product)
            ? "/products/{$product->slug}"
            : "/admin/products?view={$product->id}";
    }

    private function isPublicProduct(Product $product): bool
    {
        return filled($product->slug)
            && $product->isPubliclyVisible();
    }

    private function subjectPayload(
        string $type,
        string $typeLabel,
        int $id,
        string $code,
        ?string $name,
        ?string $description = null,
        ?string $detailUrl = null,
        bool $exists = true,
    ): array {
        return [
            'type' => $type,
            'type_label' => $typeLabel,
            'id' => $id,
            'code' => $code,
            'name' => $name,
            'description' => $description,
            'detail_url' => $detailUrl,
            'exists' => $exists,
        ];
    }

    private function normalizeSubjectType(?string $type): string
    {
        $rawType = class_basename((string) $type);

        return strtolower((string) preg_replace(
            '/([a-z0-9])([A-Z])/',
            '$1_$2',
            str_replace(['-', ' '], '_', $rawType)
        ));
    }

    private function subjectTypeLabel(string $type): string
    {
        return [
            'user' => 'Tài khoản',
            'farm' => 'Nông trại',
            'product' => 'Sản phẩm',
            'product_certificate' => 'Hồ sơ chứng chỉ sản phẩm',
            'certificate' => 'Hồ sơ chứng chỉ sản phẩm',
            'order' => 'Đơn hàng tổng',
            'sub_order' => 'Đơn hàng theo nông trại',
            'review' => 'Đánh giá/Bình luận',
            'seller_policy' => 'Chính sách Seller',
        ][$type] ?? ucfirst(str_replace('_', ' ', $type));
    }
}
