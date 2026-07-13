<?php

namespace App\Services\Product;

use App\Models\Category;
use App\Models\Certification;
use App\Models\Farm;
use App\Models\Product;
use App\Models\ProductCertificate;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdminProductService
{
    private const PRODUCT_PENDING = 0;
    private const PRODUCT_ACTIVE = 1;
    private const PRODUCT_REJECTED = 2;
    private const PRODUCT_HIDDEN = 3;

    private const CERTIFICATE_PENDING = 0;
    private const CERTIFICATE_APPROVED = 1;
    private const CERTIFICATE_REJECTED = 2;
    private const CERTIFICATE_EXPIRED = 3;
    private const CERTIFICATE_REPLACED = 4;

    public function getAll(array $filters): LengthAwarePaginator
    {
        $query = $this->adminProductQuery();

        if (!empty($filters['keyword'])) {
            $keyword = trim((string) $filters['keyword']);

            $query->where(function (Builder $subQuery) use ($keyword) {
                $subQuery
                    ->where('products.name', 'like', "%{$keyword}%")
                    ->orWhere('products.slug', 'like', "%{$keyword}%")
                    ->orWhereHas('farm', function (Builder $farmQuery) use ($keyword) {
                        $farmQuery
                            ->withTrashed()
                            ->where(function (Builder $nestedFarmQuery) use ($keyword) {
                                $nestedFarmQuery
                                    ->where('name', 'like', "%{$keyword}%")
                                    ->orWhereHas('seller', function (Builder $sellerQuery) use ($keyword) {
                                        $sellerQuery
                                            ->where('name', 'like', "%{$keyword}%")
                                            ->orWhere('email', 'like', "%{$keyword}%");
                                    });
                            });
                    })
                    ->orWhereHas('certificates', function (Builder $certificateQuery) use ($keyword) {
                        $certificateQuery->where(
                            'certificate_number',
                            'like',
                            "%{$keyword}%"
                        );
                    });
            });
        }

        if (
            array_key_exists('status', $filters) &&
            $filters['status'] !== null &&
            $filters['status'] !== ''
        ) {
            $query->where('products.status', (int) $filters['status']);
        }

        if (!empty($filters['farm_id'])) {
            $query->where('products.farm_id', (int) $filters['farm_id']);
        }

        if (!empty($filters['category_id'])) {
            $query->where('products.category_id', (int) $filters['category_id']);
        }

        if (!empty($filters['certificate_status'])) {
            $this->applyCertificateStatusFilter(
                $query,
                (string) $filters['certificate_status']
            );
        }

        if (
            array_key_exists('deleted', $filters) &&
            $filters['deleted'] !== null &&
            $filters['deleted'] !== ''
        ) {
            if ((int) $filters['deleted'] === 1) {
                $query->onlyTrashed();
            } else {
                $query->withoutTrashed();
            }
        }

        $products = $query
            ->orderByDesc('products.created_at')
            ->orderByDesc('products.id')
            ->paginate((int) ($filters['limit'] ?? 10));

        $products->getCollection()->transform(
            fn(Product $product) => $this->formatProduct($product)
        );

        return $products;
    }

    public function getStats(): array
    {
        $base = Product::withoutGlobalScope('farm_not_deleted')
            ->withoutTrashed();

        $expiredCertificateProducts = Product::withoutGlobalScope('farm_not_deleted')
            ->withoutTrashed()
            ->where('status', self::PRODUCT_ACTIVE)
            ->whereDoesntHave('certificates', function (Builder $query) {
                $query
                    ->where('status', self::CERTIFICATE_APPROVED)
                    ->whereDate('expiry_date', '>=', today());
            })
            ->whereHas('certificates', function (Builder $query) {
                $query->where(function (Builder $certificateQuery) {
                    $certificateQuery
                        ->where('status', self::CERTIFICATE_EXPIRED)
                        ->orWhere(function (Builder $approvedQuery) {
                            $approvedQuery
                                ->where('status', self::CERTIFICATE_APPROVED)
                                ->whereDate('expiry_date', '<', today());
                        });
                });
            })
            ->count();

        $pendingCertificates = ProductCertificate::query()
            ->where('status', self::CERTIFICATE_PENDING)
            ->whereHas('product', function (Builder $query) {
                $query
                    ->withoutGlobalScope('farm_not_deleted')
                    ->withoutTrashed();
            })
            ->count();

        return [
            'total' => (clone $base)->count(),
            'pending_products' => (clone $base)
                ->where('status', self::PRODUCT_PENDING)
                ->count(),
            'active_products' => (clone $base)
                ->where('status', self::PRODUCT_ACTIVE)
                ->count(),
            'rejected_products' => (clone $base)
                ->where('status', self::PRODUCT_REJECTED)
                ->count(),
            'pending_certificates' => $pendingCertificates,
            'expired_certificate_products' => $expiredCertificateProducts,
        ];
    }

    public function getOptions(): array
    {
        return [
            'farms' => Farm::withTrashed()
                ->select([
                    'id',
                    'name',
                    'status',
                    'deleted_at',
                ])
                ->orderBy('name')
                ->get(),

            'categories' => Category::withTrashed()
                ->select([
                    'id',
                    'name',
                    'status',
                    'deleted_at',
                ])
                ->orderBy('name')
                ->get(),
        ];
    }

    public function getById(int $productId): array
    {
        $product = $this->adminProductQuery()
            ->whereKey($productId)
            ->firstOrFail();

        return $this->formatProduct($product, true);
    }

    public function approveProduct(
        User $admin,
        int $productId,
        ?int $certificateId = null
    ): array {
        DB::transaction(function () use ($admin, $productId, $certificateId) {
            $product = $this->findProductForUpdate($productId);

            if ((int) $product->status !== self::PRODUCT_PENDING) {
                throw ValidationException::withMessages([
                    'product' => [
                        'Chỉ sản phẩm đang chờ duyệt mới được duyệt.',
                    ],
                ]);
            }

            $this->assertProductDependenciesAreActive($product);

            $validApprovedCertificate = ProductCertificate::query()
                ->where('product_id', $product->id)
                ->where('status', self::CERTIFICATE_APPROVED)
                ->whereDate('expiry_date', '>=', today())
                ->lockForUpdate()
                ->latest('id')
                ->first();

            if (!$validApprovedCertificate) {
                $pendingCertificateQuery = ProductCertificate::query()
                    ->where('product_id', $product->id)
                    ->where('status', self::CERTIFICATE_PENDING);

                if ($certificateId !== null) {
                    $pendingCertificateQuery->whereKey($certificateId);
                }

                $pendingCertificate = $pendingCertificateQuery
                    ->lockForUpdate()
                    ->latest('id')
                    ->first();

                if (!$pendingCertificate) {
                    throw ValidationException::withMessages([
                        'certificate' => [
                            'Sản phẩm chưa có hồ sơ chứng chỉ chờ duyệt và cũng không có chứng chỉ đã duyệt còn hạn.',
                        ],
                    ]);
                }

                $this->approveCertificateModel(
                    $admin,
                    $product,
                    $pendingCertificate
                );
            }

            $product->update([
                'status' => self::PRODUCT_ACTIVE,
                'approved_by' => $admin->id,
                'approved_at' => now(),
                'rejection_reason' => null,
            ]);
        });

        return $this->getById($productId);
    }

    public function rejectProduct(
        User $admin,
        int $productId,
        string $reason
    ): array {
        DB::transaction(function () use ($admin, $productId, $reason) {
            $product = $this->findProductForUpdate($productId);

            if ((int) $product->status !== self::PRODUCT_PENDING) {
                throw ValidationException::withMessages([
                    'product' => [
                        'Chỉ sản phẩm đang chờ duyệt mới được từ chối.',
                    ],
                ]);
            }

            $product->update([
                'status' => self::PRODUCT_REJECTED,
                'approved_by' => $admin->id,
                'approved_at' => now(),
                'rejection_reason' => $this->normalizeReason($reason),
            ]);
        });

        return $this->getById($productId);
    }

    public function approveCertificate(
        User $admin,
        int $productId,
        int $certificateId
    ): array {
        DB::transaction(function () use ($admin, $productId, $certificateId) {
            $product = $this->findProductForUpdate($productId);

            $this->assertProductDependenciesAreActive($product);

            $certificate = ProductCertificate::query()
                ->where('product_id', $product->id)
                ->whereKey($certificateId)
                ->lockForUpdate()
                ->firstOrFail();

            $this->approveCertificateModel(
                $admin,
                $product,
                $certificate
            );
        });

        return $this->getById($productId);
    }

    public function rejectCertificate(
        User $admin,
        int $productId,
        int $certificateId,
        string $reason
    ): array {
        DB::transaction(
            function () use (
                $admin,
                $productId,
                $certificateId,
                $reason
            ) {
                $product = $this->findProductForUpdate($productId);

                $certificate = ProductCertificate::query()
                    ->where('product_id', $product->id)
                    ->whereKey($certificateId)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ((int) $certificate->status !== self::CERTIFICATE_PENDING) {
                    throw ValidationException::withMessages([
                        'certificate' => [
                            'Chỉ hồ sơ chứng chỉ đang chờ duyệt mới được từ chối.',
                        ],
                    ]);
                }

                $certificate->update([
                    'status' => self::CERTIFICATE_REJECTED,
                    'approved_by' => $admin->id,
                    'approved_at' => now(),
                    'rejection_reason' => $this->normalizeReason($reason),
                ]);
            }
        );

        return $this->getById($productId);
    }

    private function adminProductQuery(): Builder
    {
        return Product::withoutGlobalScope('farm_not_deleted')
            ->withTrashed()
            ->with([
                'farm' => function ($query) {
                    $query
                        ->withTrashed()
                        ->with([
                            'seller' => function ($sellerQuery) {
                                $sellerQuery->withTrashed();
                            },
                        ]);
                },

                'category' => function ($query) {
                    $query->withTrashed();
                },

                'approver' => function ($query) {
                    $query->withTrashed();
                },

                'images',

                'certificates' => function ($query) {
                    $query
                        ->withTrashed()
                        ->with([
                            'certification' => function ($certificationQuery) {
                                $certificationQuery->withTrashed();
                            },

                            'approver' => function ($approverQuery) {
                                $approverQuery->withTrashed();
                            },
                        ])
                        ->orderByDesc('id');
                },
            ])
            ->withCount([
                'certificates as pending_certificate_count' => function (
                    Builder $query
                ) {
                    $query->where(
                        'status',
                        self::CERTIFICATE_PENDING
                    );
                },
            ]);
    }

    private function applyCertificateStatusFilter(
        Builder $query,
        string $status
    ): void {
        $query->whereHas(
            'certificates',
            function (Builder $certificateQuery) use ($status) {
                match ($status) {
                    'pending' => $certificateQuery
                        ->where('status', self::CERTIFICATE_PENDING),

                    'approved' => $certificateQuery
                        ->where('status', self::CERTIFICATE_APPROVED)
                        ->whereDate('expiry_date', '>=', today()),

                    'rejected' => $certificateQuery
                        ->where('status', self::CERTIFICATE_REJECTED),

                    'expired' => $certificateQuery
                        ->where(function (Builder $expiredQuery) {
                            $expiredQuery
                                ->where('status', self::CERTIFICATE_EXPIRED)
                                ->orWhere(function (Builder $approvedQuery) {
                                    $approvedQuery
                                        ->where(
                                            'status',
                                            self::CERTIFICATE_APPROVED
                                        )
                                        ->whereDate(
                                            'expiry_date',
                                            '<',
                                            today()
                                        );
                                });
                        }),

                    'replaced' => $certificateQuery
                        ->where('status', self::CERTIFICATE_REPLACED),

                    default => null,
                };
            }
        );
    }

    private function findProductForUpdate(int $productId): Product
    {
        $product = Product::withoutGlobalScope('farm_not_deleted')
            ->withTrashed()
            ->whereKey($productId)
            ->lockForUpdate()
            ->firstOrFail();

        if ($product->trashed()) {
            throw ValidationException::withMessages([
                'product' => [
                    'Sản phẩm đã bị xóa. Vui lòng khôi phục trước khi kiểm duyệt.',
                ],
            ]);
        }

        return $product;
    }

    private function assertProductDependenciesAreActive(
        Product $product
    ): void {
        $farm = Farm::withTrashed()
            ->whereKey($product->farm_id)
            ->first();

        if (
            !$farm ||
            $farm->trashed() ||
            (int) $farm->status !== Farm::STATUS_ACTIVE
        ) {
            throw ValidationException::withMessages([
                'farm' => [
                    'Không thể duyệt vì nông trại chưa hoạt động hoặc đã bị xóa.',
                ],
            ]);
        }

        $category = Category::withTrashed()
            ->whereKey($product->category_id)
            ->first();

        if (
            !$category ||
            $category->trashed() ||
            (int) $category->status !== 1
        ) {
            throw ValidationException::withMessages([
                'category' => [
                    'Không thể duyệt vì danh mục đang ẩn hoặc đã bị xóa.',
                ],
            ]);
        }
    }

    private function approveCertificateModel(
        User $admin,
        Product $product,
        ProductCertificate $certificate
    ): void {
        if ($certificate->trashed()) {
            throw ValidationException::withMessages([
                'certificate' => [
                    'Hồ sơ chứng chỉ đã bị xóa.',
                ],
            ]);
        }

        if ((int) $certificate->product_id !== (int) $product->id) {
            throw ValidationException::withMessages([
                'certificate' => [
                    'Hồ sơ chứng chỉ không thuộc sản phẩm này.',
                ],
            ]);
        }

        if ((int) $certificate->status !== self::CERTIFICATE_PENDING) {
            throw ValidationException::withMessages([
                'certificate' => [
                    'Chỉ hồ sơ chứng chỉ đang chờ duyệt mới được duyệt.',
                ],
            ]);
        }

        $certification = Certification::withTrashed()
            ->whereKey($certificate->certification_id)
            ->first();

        if (
            !$certification ||
            $certification->trashed() ||
            (int) $certification->status !== 1
        ) {
            throw ValidationException::withMessages([
                'certification' => [
                    'Loại chứng chỉ đang ẩn hoặc đã bị xóa.',
                ],
            ]);
        }

        if (
            !$certificate->issued_date ||
            !$certificate->expiry_date
        ) {
            throw ValidationException::withMessages([
                'certificate' => [
                    'Hồ sơ chứng chỉ thiếu ngày cấp hoặc ngày hết hạn.',
                ],
            ]);
        }

        if ($certificate->issued_date->gt(today())) {
            throw ValidationException::withMessages([
                'issued_date' => [
                    'Không thể duyệt chứng chỉ có ngày cấp lớn hơn ngày hiện tại.',
                ],
            ]);
        }

        if ($certificate->expiry_date->lte($certificate->issued_date)) {
            throw ValidationException::withMessages([
                'expiry_date' => [
                    'Ngày hết hạn phải sau ngày cấp chứng chỉ.',
                ],
            ]);
        }

        if ($certificate->expiry_date->lt(today())) {
            throw ValidationException::withMessages([
                'expiry_date' => [
                    'Không thể duyệt hồ sơ chứng chỉ đã hết hạn.',
                ],
            ]);
        }

        ProductCertificate::query()
            ->where('product_id', $product->id)
            ->where('id', '!=', $certificate->id)
            ->where('status', self::CERTIFICATE_APPROVED)
            ->update([
                'status' => self::CERTIFICATE_REPLACED,
            ]);

        $certificate->update([
            'status' => self::CERTIFICATE_APPROVED,
            'approved_by' => $admin->id,
            'approved_at' => now(),
            'rejection_reason' => null,
        ]);
    }

    private function normalizeReason(string $reason): string
    {
        return preg_replace(
            '/\s+/u',
            ' ',
            trim($reason)
        );
    }

    private function formatProduct(
        Product $product,
        bool $isDetail = false
    ): array {
        $certificates = $product->certificates
            ->sortByDesc('id')
            ->values();

        $pendingCertificate = $certificates
            ->first(
                fn(ProductCertificate $certificate) =>
                (int) $certificate->status === self::CERTIFICATE_PENDING &&
                !$certificate->trashed()
            );

        $currentCertificate = $certificates
            ->first(
                fn(ProductCertificate $certificate) =>
                (int) $certificate->status === self::CERTIFICATE_APPROVED &&
                !$certificate->trashed() &&
                $certificate->expiry_date &&
                $certificate->expiry_date->gte(today())
            );

        $latestCertificate = $certificates
            ->first(
                fn(ProductCertificate $certificate) =>
                !$certificate->trashed()
            );

        $isSellable =
            !$product->trashed() &&
            (int) $product->status === self::PRODUCT_ACTIVE &&
            $currentCertificate !== null &&
            $product->farm &&
            !$product->farm->trashed() &&
            (int) $product->farm->status === Farm::STATUS_ACTIVE;

        $data = [
            'id' => $product->id,
            'code' => 'SP' . str_pad(
                (string) $product->id,
                6,
                '0',
                STR_PAD_LEFT
            ),

            'farm_id' => $product->farm_id,
            'category_id' => $product->category_id,

            'name' => $product->name,
            'slug' => $product->slug,
            'description' => $product->description,

            'price' => (float) $product->price,
            'sale_price' => $product->sale_price !== null
                ? (float) $product->sale_price
                : null,
            'stock_quantity' => (float) $product->stock_quantity,
            'unit' => $product->unit,

            'thumbnail' => $product->thumbnail,
            'is_hot' => (bool) $product->is_hot,

            'status' => (int) $product->status,
            'status_text' => $this->getProductStatusText(
                (int) $product->status
            ),

            'is_sellable' => $isSellable,
            'pending_certificate_count' =>
                (int) ($product->pending_certificate_count ?? 0),

            'rejection_reason' => $product->rejection_reason,
            'approved_at' => optional($product->approved_at)
                ->format('Y-m-d H:i:s'),
            'created_at' => optional($product->created_at)
                ->format('Y-m-d H:i:s'),
            'updated_at' => optional($product->updated_at)
                ->format('Y-m-d H:i:s'),
            'deleted_at' => optional($product->deleted_at)
                ->format('Y-m-d H:i:s'),

            'farm' => $product->farm
                ? [
                    'id' => $product->farm->id,
                    'name' => $product->farm->name,
                    'slug' => $product->farm->slug,
                    'status' => (int) $product->farm->status,
                    'deleted_at' => optional(
                        $product->farm->deleted_at
                    )->format('Y-m-d H:i:s'),
                    'seller' => $product->farm->seller
                        ? [
                            'id' => $product->farm->seller->id,
                            'name' => $product->farm->seller->name,
                            'email' => $product->farm->seller->email,
                            'phone' => $product->farm->seller->phone,
                        ]
                        : null,
                ]
                : null,

            'category' => $product->category
                ? [
                    'id' => $product->category->id,
                    'name' => $product->category->name,
                    'slug' => $product->category->slug,
                    'status' => (int) $product->category->status,
                    'deleted_at' => optional(
                        $product->category->deleted_at
                    )->format('Y-m-d H:i:s'),
                ]
                : null,

            'approver' => $product->approver
                ? [
                    'id' => $product->approver->id,
                    'name' => $product->approver->name,
                    'email' => $product->approver->email,
                ]
                : null,

            'pending_certificate' => $pendingCertificate
                ? $this->formatCertificate($pendingCertificate)
                : null,

            'current_certificate' => $currentCertificate
                ? $this->formatCertificate($currentCertificate)
                : null,

            'latest_certificate' => $latestCertificate
                ? $this->formatCertificate($latestCertificate)
                : null,
        ];

        if ($isDetail) {
            $data['images'] = $product->images
                ->map(
                    fn($image) => [
                        'id' => $image->id,
                        'image_url' => $image->image_url,
                    ]
                )
                ->values();

            $data['certificates'] = $certificates
                ->map(
                    fn(ProductCertificate $certificate) =>
                    $this->formatCertificate($certificate)
                )
                ->values();
        }

        return $data;
    }

    private function formatCertificate(
        ProductCertificate $certificate
    ): array {
        $isDateExpired =
            $certificate->expiry_date &&
            $certificate->expiry_date->lt(today());

        $displayStatus = (int) $certificate->status;

        if (
            $displayStatus === self::CERTIFICATE_APPROVED &&
            $isDateExpired
        ) {
            $displayStatus = self::CERTIFICATE_EXPIRED;
        }

        return [
            'id' => $certificate->id,
            'product_id' => $certificate->product_id,
            'certification_id' => $certificate->certification_id,
            'certification_name' =>
                $certificate->certification?->name,

            'certificate_number' =>
                $certificate->certificate_number,
            'certificate_file' => $certificate->certificate_file,

            'issued_date' => optional($certificate->issued_date)
                ->format('Y-m-d'),
            'expiry_date' => optional($certificate->expiry_date)
                ->format('Y-m-d'),

            'status' => (int) $certificate->status,
            'display_status' => $displayStatus,
            'status_text' => $this->getCertificateStatusText(
                $displayStatus
            ),
            'is_expired' => $isDateExpired,

            'rejection_reason' => $certificate->rejection_reason,
            'approved_at' => optional($certificate->approved_at)
                ->format('Y-m-d H:i:s'),
            'created_at' => optional($certificate->created_at)
                ->format('Y-m-d H:i:s'),
            'updated_at' => optional($certificate->updated_at)
                ->format('Y-m-d H:i:s'),
            'deleted_at' => optional($certificate->deleted_at)
                ->format('Y-m-d H:i:s'),

            'approver' => $certificate->approver
                ? [
                    'id' => $certificate->approver->id,
                    'name' => $certificate->approver->name,
                    'email' => $certificate->approver->email,
                ]
                : null,
        ];
    }

    private function getProductStatusText(int $status): string
    {
        return match ($status) {
            self::PRODUCT_PENDING => 'Chờ duyệt',
            self::PRODUCT_ACTIVE => 'Đang bán',
            self::PRODUCT_REJECTED => 'Bị từ chối',
            self::PRODUCT_HIDDEN => 'Tạm ẩn',
            default => 'Không xác định',
        };
    }

    private function getCertificateStatusText(int $status): string
    {
        return match ($status) {
            self::CERTIFICATE_PENDING => 'Chờ duyệt',
            self::CERTIFICATE_APPROVED => 'Đã duyệt',
            self::CERTIFICATE_REJECTED => 'Bị từ chối',
            self::CERTIFICATE_EXPIRED => 'Hết hạn',
            self::CERTIFICATE_REPLACED => 'Đã thay thế',
            default => 'Không xác định',
        };
    }
}
