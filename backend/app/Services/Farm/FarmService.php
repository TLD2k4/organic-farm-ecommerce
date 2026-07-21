<?php

namespace App\Services\Farm;

use App\Models\Farm;
use App\Models\FarmPolicyAcceptance;
use App\Models\Product;
use App\Models\SubOrder;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class FarmService
{
    private const NEW_PRODUCT_DAYS = 7;
    private const BEST_SELLER_DAYS = 30;
    private const BEST_SELLER_MIN_QUANTITY = 20;

    public function __construct(
        private SellerPolicyAccessService $sellerPolicyAccessService,
    ) {}
    // =====================================================
    // PUBLIC FARM
    // =====================================================

    public function getAll(array $filters)
    {
        $farms = Farm::query()
            ->with([
                'seller:id,name,avatar',

                'products' => function ($query) {
                    $query
                        ->select([
                            'id',
                            'farm_id',
                        ])
                        ->publiclyVisible()
                        ->withCount([
                            'visibleRatingReviews as review_count',
                            'visibleComments as comment_count',
                            'visibleReviewReplies as reply_comment_count',
                        ])
                        ->withAvg(
                            'visibleRatingReviews as rating_avg',
                            'rating'
                        );
                },
            ])
            ->withCount([
                'products as product_count' => function ($query) {
                    $query->publiclyVisible();
                },
            ])
            ->where(
                'status',
                Farm::STATUS_ACTIVE
            )
            ->when(
                !empty($filters['keyword']),
                function ($query) use ($filters) {
                    $keyword = trim(
                        $filters['keyword']
                    );

                    $query->where(
                        function ($subQuery) use ($keyword) {
                            $subQuery
                                ->where(
                                    'name',
                                    'like',
                                    "%{$keyword}%"
                                )
                                ->orWhere(
                                    'address',
                                    'like',
                                    "%{$keyword}%"
                                )
                                ->orWhere(
                                    'description',
                                    'like',
                                    "%{$keyword}%"
                                );
                        }
                    );
                }
            )
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(
                $filters['limit'] ?? 12
            );

        $farms->getCollection()->transform(
            function (Farm $farm) {
                $orderAvailability = $this->sellerPolicyAccessService
                    ->availability($farm);
                $totalReviews = (int) $farm->products->sum(
                    fn ($product) => (int) ($product->review_count ?? 0)
                );
                $totalComments = (int) $farm->products->sum(
                    fn ($product) => (int) ($product->comment_count ?? 0)
                        + (int) ($product->reply_comment_count ?? 0)
                );
                $ratingTotal = (float) $farm->products->sum(
                    fn ($product) => (float) ($product->rating_avg ?? 0)
                        * (int) ($product->review_count ?? 0)
                );

                $farm->setAttribute(
                    'rating',
                    [
                        'average' => $totalReviews > 0
                            ? round($ratingTotal / $totalReviews, 1)
                            : 0,
                        'total' => $totalReviews,
                    ]
                );

                $farm->setAttribute('comment_count', $totalComments);

                $farm->setAttribute(
                    'accepting_orders',
                    $orderAvailability['accepting_orders']
                );
                $farm->setAttribute(
                    'order_unavailable_reason',
                    $orderAvailability['reason']
                );

                unset($farm->products);

                return $farm;
            }
        );

        return $farms;
    }

    public function getBySlug(
        string $slug,
        array $filters = []
    ): Farm {
        $farm = Farm::query()
            ->where('slug', $slug)
            ->where(
                'status',
                Farm::STATUS_ACTIVE
            )
            ->with([
                'seller:id,name,email,avatar',
            ])
            ->withCount([
                'products as product_count' => function ($query) {
                    $query->publiclyVisible();
                },
            ])
            ->firstOrFail();

        $farm = $this->appendPublicFarmSummary(
            $farm
        );
        $orderAvailability = $this->sellerPolicyAccessService
            ->availability($farm);
        $farm->setAttribute(
            'accepting_orders',
            $orderAvailability['accepting_orders']
        );
        $farm->setAttribute(
            'order_unavailable_reason',
            $orderAvailability['reason']
        );

        $page = max(
            1,
            (int) ($filters['page'] ?? 1)
        );

        $perPage = min(
            24,
            max(
                1,
                (int) ($filters['per_page'] ?? 12)
            )
        );

        $products = Product::query()
            ->where(
                'farm_id',
                $farm->id
            )
            ->publiclyVisible()
            ->with([
                'category:id,name,slug',

                'certificates' => function ($certificateQuery) {
                    $certificateQuery
                        ->where('status', 1)
                        ->whereDate(
                            'expiry_date',
                            '>=',
                            today()
                        )
                        ->with([
                            'certification:id,name',
                        ]);
                },
            ])
            ->withCount([
                'visibleRatingReviews as review_count',
                'visibleComments as comment_count',
                'visibleReviewReplies as reply_comment_count',
            ])
            ->withAvg(
                'visibleRatingReviews as rating_avg',
                'rating'
            )
            ->withSum(
                'completedOrderItems as sold_quantity',
                'quantity'
            )
            ->withSum(
                [
                    'completedOrderItems as sold_quantity_30_days' =>
                    function ($orderItemQuery) {
                        $orderItemQuery->where(
                            'order_items.created_at',
                            '>=',
                            now()->subDays(
                                self::BEST_SELLER_DAYS
                            )
                        );
                    },
                ],
                'quantity'
            )
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(
                $perPage,
                ['*'],
                'page',
                $page
            );

        $products->getCollection()->transform(
            function (Product $product) use ($orderAvailability) {
                $product = $this->appendPublicProductCardData($product);
                $product->setAttribute(
                    'accepting_orders',
                    $orderAvailability['accepting_orders']
                );
                $product->setAttribute(
                    'order_unavailable_reason',
                    $orderAvailability['reason']
                );

                return $product;
            }
        );

        $farm->setRelation(
            'products',
            $products->getCollection()
        );

        $farm->setAttribute(
            'products_meta',
            [
                'total' => $products->total(),
                'per_page' => $products->perPage(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'from' => $products->firstItem(),
                'to' => $products->lastItem(),
            ]
        );

        return $farm;
    }


    // =====================================================
    // OWNER FARM
    // =====================================================

    /**
     * Lấy Farm của tài khoản hiện tại.
     *
     * Bao gồm cả Farm đã xóa mềm để tài khoản
     * không được đăng ký Farm mới.
     */
    public function getMyFarm(User $user): ?Farm
    {
        $farm = Farm::withTrashed()
            ->where(
                'seller_id',
                $user->id
            )
            ->with([
                'seller:id,name,email,phone,avatar,status,deleted_at',

                'approver:id,name,email',

                'products' => function ($query) {
                    $query
                        ->withoutGlobalScope(
                            'farm_not_deleted'
                        )
                        ->withTrashed()
                        ->with([
                            'category:id,name,slug',

                            'certificates' => function ($certificateQuery) {
                                $certificateQuery
                                    ->where('status', 1)
                                    ->whereDate(
                                        'expiry_date',
                                        '>=',
                                        today()
                                    )
                                    ->with([
                                        'certification:id,name',
                                    ]);
                            },

                            'reviews' => function ($reviewQuery) {
                                $reviewQuery->where(
                                    'status',
                                    1
                                )->with([
                                    'replies' => function ($replyQuery) {
                                        $replyQuery->where('status', 1);
                                    },
                                ]);
                            },
                        ])
                        ->orderByDesc('created_at');
                },
            ])
            ->withCount([
                'products as product_count' => function ($query) {
                    $query
                        ->withoutGlobalScope(
                            'farm_not_deleted'
                        )
                        ->withTrashed();
                },

                'subOrders as sub_order_count' => function ($query) {
                    $query->withTrashed();
                },
            ])
            ->first();

        if (!$farm) {
            return null;
        }

        return $this->appendRatingAndCertifications(
            $farm
        );
    }

    public function register(
        User $user,
        array $data,
        array $policyAcceptance
    ): Farm {
        return DB::transaction(
            function () use ($user, $data, $policyAcceptance) {
                /*
                 * Khóa User trong lúc kiểm tra và tạo Farm,
                 * tránh hai request đăng ký chạy cùng lúc.
                 */
                $lockedUser = User::query()
                    ->whereKey($user->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $existingFarm = Farm::withTrashed()
                    ->where(
                        'seller_id',
                        $lockedUser->id
                    )
                    ->first();

                if ($existingFarm) {
                    if ($existingFarm->trashed()) {
                        throw ValidationException::withMessages([
                            'farm' => [
                                'Nông trại của tài khoản đã bị xóa mềm. Vui lòng khôi phục hoặc nhờ quản trị viên xóa vĩnh viễn trước khi đăng ký mới.',
                            ],
                        ]);
                    }

                    throw ValidationException::withMessages([
                        'farm' => [
                            'Mỗi tài khoản chỉ được sở hữu duy nhất một nông trại.',
                        ],
                    ]);
                }

                /*
                 * Chỉ Customer và Admin được đăng ký Farm.
                 */
                if (
                    !$lockedUser->hasRole('customer') &&
                    !$lockedUser->hasRole('admin')
                ) {
                    throw ValidationException::withMessages([
                        'farm' => [
                            'Vai trò tài khoản hiện tại không được phép đăng ký nông trại.',
                        ],
                    ]);
                }

                $isAdmin = $lockedUser->hasRole(
                    'admin'
                );

                $farm = Farm::create([
                    'seller_id' => $lockedUser->id,

                    'approved_by' => $isAdmin
                        ? $lockedUser->id
                        : null,

                    'name' => $data['name'],

                    'slug' => $this->generateUniqueSlug(
                        $data['name']
                    ),

                    'description' =>
                    $data['description'] ?? null,

                    'logo' =>
                    $data['logo'] ?? null,

                    'cover_image' =>
                    $data['cover_image'] ?? null,

                    'phone' =>
                    $data['phone'] ?? null,

                    'address' =>
                    $data['address'],

                    'status' => $isAdmin
                        ? Farm::STATUS_ACTIVE
                        : Farm::STATUS_PENDING,

                    'approved_at' => $isAdmin
                        ? now()
                        : null,

                    'rejection_reason' => null,
                ]);

                FarmPolicyAcceptance::create([
                    'user_id' => $lockedUser->id,
                    'farm_id' => $farm->id,
                    'seller_policy_id' => $policyAcceptance['seller_policy_id'] ?? null,
                    'policy_version' =>
                    $policyAcceptance['policy_version'],
                    'accepted_at' => now(),
                    'ip_address' =>
                    $policyAcceptance['ip_address'] ?? null,
                    'user_agent' =>
                    $policyAcceptance['user_agent'] ?? null,
                ]);

                return $farm;
            }
        );
    }

    public function updateOwnedFarm(
        User $user,
        int $farmId,
        array $data
    ): Farm {
        /*
         * Farm::query() không lấy Farm đã xóa mềm.
         */
        $farm = Farm::query()
            ->whereKey($farmId)
            ->where(
                'seller_id',
                $user->id
            )
            ->firstOrFail();

        if ($farm->isSuspended()) {
            throw ValidationException::withMessages([
                'farm' => [
                    'Nông trại đang bị đình chỉ. Không thể cập nhật thông tin.',
                ],
            ]);
        }

        if (
            array_key_exists('name', $data) &&
            $data['name'] !== $farm->name
        ) {
            $data['slug'] =
                $this->generateUniqueSlug(
                    $data['name'],
                    $farm->id
                );
        }

        /*
         * Farm bị từ chối sửa xong vẫn giữ status = 2.
         * Chủ Farm phải gọi API resubmit riêng.
         */
        $farm->update($data);

        return $farm->fresh([
            'seller:id,name,email,phone,avatar,status,deleted_at',
            'approver:id,name,email',
        ]);
    }

    public function resubmit(
        User $user,
        int $farmId
    ): Farm {
        return DB::transaction(
            function () use ($user, $farmId) {
                $farm = Farm::query()
                    ->whereKey($farmId)
                    ->where(
                        'seller_id',
                        $user->id
                    )
                    ->lockForUpdate()
                    ->firstOrFail();

                if (!$farm->isRejected()) {
                    throw ValidationException::withMessages([
                        'farm' => [
                            'Chỉ nông trại bị từ chối mới được gửi duyệt lại.',
                        ],
                    ]);
                }

                $farm->update([
                    'status' => Farm::STATUS_PENDING,
                    'approved_by' => null,
                    'approved_at' => null,
                    'rejection_reason' => null,
                ]);

                return $farm->fresh([
                    'seller:id,name,email,phone,avatar,status,deleted_at',
                    'approver:id,name,email',
                ]);
            }
        );
    }

    /**
     * Chủ Farm xóa cứng trực tiếp.
     *
     * Chỉ cho phép khi:
     * - status = 0 hoặc 2;
     * - không còn sản phẩm;
     * - không còn đơn hàng.
     */
    public function ownerForceDelete(
        User $user,
        int $farmId
    ): Farm {
        return DB::transaction(
            function () use ($user, $farmId) {
                $farm = Farm::query()
                    ->whereKey($farmId)
                    ->where(
                        'seller_id',
                        $user->id
                    )
                    ->lockForUpdate()
                    ->firstOrFail();

                if (
                    !in_array(
                        $farm->status,
                        [
                            Farm::STATUS_PENDING,
                            Farm::STATUS_REJECTED,
                        ],
                        true
                    )
                ) {
                    throw ValidationException::withMessages([
                        'farm' => [
                            'Chỉ được xóa vĩnh viễn hồ sơ nông trại đang chờ duyệt hoặc bị từ chối.',
                        ],
                    ]);
                }

                $this->ensureNoRelatedData(
                    $farm->id
                );

                $farm->forceDelete();

                /*
                 * Trường hợp dữ liệu role bị lệch.
                 * Admin không bị đổi role.
                 */
                if ($user->hasRole('seller')) {
                    $user->syncRoles([
                        'customer',
                    ]);
                }

                return $farm;
            }
        );
    }

    // =====================================================
    // ADMIN FARM
    // =====================================================

    public function adminGetAll(array $filters)
    {
        return Farm::withTrashed()
            ->with([
                'seller:id,name,email,phone,avatar,status,deleted_at',
                'approver:id,name,email',
            ])
            ->withCount([
                'products as product_count' => function ($query) {
                    $query
                        ->withoutGlobalScope(
                            'farm_not_deleted'
                        )
                        ->withTrashed();
                },

                'subOrders as sub_order_count' => function ($query) {
                    $query->withTrashed();
                },
            ])

            ->when(
                !empty($filters['keyword']),
                function ($query) use ($filters) {
                    $keyword = trim(
                        $filters['keyword']
                    );

                    $query->where(
                        function (Builder $subQuery) use ($keyword) {
                            $subQuery
                                ->where(
                                    'name',
                                    'like',
                                    "%{$keyword}%"
                                )
                                ->orWhere(
                                    'slug',
                                    'like',
                                    "%{$keyword}%"
                                )
                                ->orWhere(
                                    'phone',
                                    'like',
                                    "%{$keyword}%"
                                )
                                ->orWhere(
                                    'address',
                                    'like',
                                    "%{$keyword}%"
                                )
                                ->orWhereHas(
                                    'seller',
                                    function ($sellerQuery) use ($keyword) {
                                        $sellerQuery->where(
                                            function ($userQuery) use ($keyword) {
                                                $userQuery
                                                    ->where(
                                                        'name',
                                                        'like',
                                                        "%{$keyword}%"
                                                    )
                                                    ->orWhere(
                                                        'email',
                                                        'like',
                                                        "%{$keyword}%"
                                                    )
                                                    ->orWhere(
                                                        'phone',
                                                        'like',
                                                        "%{$keyword}%"
                                                    );
                                            }
                                        );
                                    }
                                );
                        }
                    );
                }
            )

            ->when(
                array_key_exists('status', $filters) &&
                    $filters['status'] !== null &&
                    $filters['status'] !== '',
                function ($query) use ($filters) {
                    $query->where(
                        'status',
                        (int) $filters['status']
                    );
                }
            )

            ->when(
                array_key_exists('deleted', $filters) &&
                    $filters['deleted'] !== null &&
                    $filters['deleted'] !== '',
                function ($query) use ($filters) {
                    if (
                        (int) $filters['deleted'] === 1
                    ) {
                        $query->onlyTrashed();
                    } else {
                        $query->withoutTrashed();
                    }
                }
            )

            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(
                $filters['limit'] ?? 10
            );
    }

    public function adminGetById(
        int $farmId
    ): Farm {
        $farm = Farm::withTrashed()
            ->with([
                'seller:id,name,email,phone,avatar,status,created_at,deleted_at',

                'approver:id,name,email',

                'products' => function ($query) {
                    $query
                        ->withoutGlobalScope(
                            'farm_not_deleted'
                        )
                        ->withTrashed()
                        ->with([
                            'category:id,name,slug',

                            'certificates' => function ($certificateQuery) {
                                $certificateQuery->with([
                                    'certification:id,name',
                                    'approver:id,name,email',
                                ]);
                            },

                            'reviews.replies',
                        ])
                        ->orderByDesc('created_at');
                },
            ])
            ->withCount([
                'products as product_count' => function ($query) {
                    $query
                        ->withoutGlobalScope(
                            'farm_not_deleted'
                        )
                        ->withTrashed();
                },

                'subOrders as sub_order_count' => function ($query) {
                    $query->withTrashed();
                },
            ])
            ->findOrFail($farmId);

        return $this->appendRatingAndCertifications(
            $farm
        );
    }

    public function approve(
        User $admin,
        int $farmId
    ): Farm {
        return DB::transaction(
            function () use ($admin, $farmId) {
                $farm = Farm::query()
                    ->with('seller')
                    ->whereKey($farmId)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (!$farm->isPending()) {
                    throw ValidationException::withMessages([
                        'farm' => [
                            'Chỉ nông trại đang chờ duyệt mới được duyệt.',
                        ],
                    ]);
                }

                $seller = $farm->seller;

                if (!$seller) {
                    throw ValidationException::withMessages([
                        'farm' => [
                            'Không tìm thấy tài khoản chủ nông trại.',
                        ],
                    ]);
                }

                if ($seller->trashed()) {
                    throw ValidationException::withMessages([
                        'farm' => [
                            'Không thể duyệt vì tài khoản chủ nông trại đã bị xóa.',
                        ],
                    ]);
                }

                if ((int) $seller->status !== 1) {
                    throw ValidationException::withMessages([
                        'farm' => [
                            'Không thể duyệt vì tài khoản chủ nông trại đang bị khóa.',
                        ],
                    ]);
                }

                $farm->update([
                    'status' => Farm::STATUS_ACTIVE,

                    'approved_by' => $admin->id,
                    'approved_at' => now(),

                    'rejection_reason' => null,
                ]);

                /*
                 * Một tài khoản chỉ có một role.
                 *
                 * Customer:
                 * customer → seller.
                 *
                 * Admin:
                 * vẫn giữ admin.
                 */
                if ($seller->hasRole('customer')) {
                    $seller->syncRoles([
                        'seller',
                    ]);
                } elseif (
                    !$seller->hasRole('seller') &&
                    !$seller->hasRole('admin')
                ) {
                    throw ValidationException::withMessages([
                        'farm' => [
                            'Vai trò của chủ nông trại không hợp lệ.',
                        ],
                    ]);
                }

                return $farm->fresh([
                    'seller:id,name,email,phone,avatar,status,deleted_at',
                    'approver:id,name,email',
                ]);
            }
        );
    }

    public function reject(
        User $admin,
        int $farmId,
        string $reason
    ): Farm {
        return DB::transaction(
            function () use ($admin, $farmId, $reason) {
                $farm = Farm::query()
                    ->whereKey($farmId)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (!$farm->isPending()) {
                    throw ValidationException::withMessages([
                        'farm' => [
                            'Chỉ nông trại đang chờ duyệt mới được từ chối.',
                        ],
                    ]);
                }

                $farm->update([
                    'status' => Farm::STATUS_REJECTED,
                    'approved_by' => $admin->id,
                    'approved_at' => now(),
                    'rejection_reason' => $reason,
                ]);

                return $farm->fresh([
                    'seller:id,name,email,phone,avatar,status,deleted_at',
                    'approver:id,name,email',
                ]);
            }
        );
    }

    public function suspend(
        User $admin,
        int $farmId,
        string $reason
    ): Farm {
        $farm = Farm::query()
            ->findOrFail($farmId);

        if (!$farm->isActive()) {
            throw ValidationException::withMessages([
                'farm' => [
                    'Chỉ nông trại đang hoạt động mới được đình chỉ.',
                ],
            ]);
        }

        $farm->update([
            'status' => Farm::STATUS_SUSPENDED,
            'approved_by' => $admin->id,
            'approved_at' => now(),
            'rejection_reason' => trim($reason),
        ]);

        /*
         * Không xóa sản phẩm, đơn hàng hoặc role.
         * Seller vẫn được xử lý đơn cũ.
         */
        return $farm->fresh([
            'seller:id,name,email,phone,avatar,status,deleted_at',
            'approver:id,name,email',
        ]);
    }

    public function reopen(
        User $admin,
        int $farmId
    ): Farm {
        $farm = Farm::query()
            ->with('seller')
            ->findOrFail($farmId);

        if (!$farm->isSuspended()) {
            throw ValidationException::withMessages([
                'farm' => [
                    'Chỉ nông trại đang bị đình chỉ mới được mở lại.',
                ],
            ]);
        }

        if (
            !$farm->seller ||
            $farm->seller->trashed() ||
            (int) $farm->seller->status !== 1
        ) {
            throw ValidationException::withMessages([
                'farm' => [
                    'Không thể mở lại vì tài khoản chủ nông trại không hoạt động.',
                ],
            ]);
        }

        $farm->update([
            'status' => Farm::STATUS_ACTIVE,
            'approved_by' => $admin->id,
            'approved_at' => now(),
            'rejection_reason' => null,
        ]);

        return $farm->fresh([
            'seller:id,name,email,phone,avatar,status,deleted_at',
            'approver:id,name,email',
        ]);
    }

    // =====================================================
    // ADMIN DELETE / RESTORE
    // =====================================================

    /**
     * Admin xóa mềm.
     *
     * Điều kiện:
     * - không được là Farm đang hoạt động;
     * - không còn sản phẩm;
     * - không còn đơn hàng.
     */
    public function adminSoftDelete(
        User $admin,
        int $farmId,
        string $reason
    ): Farm {
        return DB::transaction(
            function () use ($admin, $farmId, $reason) {
                $farm = Farm::query()
                    ->whereKey($farmId)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($farm->isActive()) {
                    throw ValidationException::withMessages([
                        'farm' => [
                            'Nông trại đang hoạt động. Vui lòng đình chỉ trước khi xóa.',
                        ],
                    ]);
                }

                if (
                    !in_array(
                        $farm->status,
                        [
                            Farm::STATUS_PENDING,
                            Farm::STATUS_REJECTED,
                            Farm::STATUS_SUSPENDED,
                        ],
                        true
                    )
                ) {
                    throw ValidationException::withMessages([
                        'farm' => [
                            'Trạng thái hiện tại không cho phép xóa nông trại.',
                        ],
                    ]);
                }

                /*
                 * Theo nghiệp vụ đã chốt:
                 * xóa mềm cũng phải không còn dữ liệu liên quan.
                 */
                $this->ensureNoRelatedData(
                    $farm->id
                );

                $farm->update([
                    'approved_by' => $admin->id,
                    'approved_at' => now(),
                    'rejection_reason' => trim($reason),
                ]);

                $farm->delete();

                return $farm;
            }
        );
    }

    public function restore(
        User $admin,
        int $farmId
    ): Farm {
        return DB::transaction(
            function () use ($admin, $farmId) {
                $farm = Farm::withTrashed()
                    ->with('seller')
                    ->whereKey($farmId)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (!$farm->trashed()) {
                    throw ValidationException::withMessages([
                        'farm' => [
                            'Nông trại chưa bị xóa mềm.',
                        ],
                    ]);
                }

                if (
                    !$farm->seller ||
                    $farm->seller->trashed()
                ) {
                    throw ValidationException::withMessages([
                        'farm' => [
                            'Vui lòng khôi phục tài khoản chủ nông trại trước.',
                        ],
                    ]);
                }

                $farm->restore();
                $farm->update([
                    'approved_by' => $admin->id,
                    'approved_at' => now(),
                    'rejection_reason' => null,
                ]);

                /*
                 * Giữ nguyên status cũ.
                 * Farm active không được xóa mềm,
                 * nên status khôi phục chỉ là 0, 2 hoặc 3.
                 */
                return $farm->fresh([
                    'seller:id,name,email,phone,avatar,status,deleted_at',
                    'approver:id,name,email',
                ]);
            }
        );
    }

    /**
     * Admin xóa vĩnh viễn.
     *
     * Điều kiện:
     * - Farm phải xóa mềm trước;
     * - không còn sản phẩm;
     * - không còn đơn hàng.
     */
    public function forceDelete(
        int $farmId
    ): Farm {
        return DB::transaction(
            function () use ($farmId) {
                $farm = Farm::withTrashed()
                    ->with('seller')
                    ->whereKey($farmId)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (!$farm->trashed()) {
                    throw ValidationException::withMessages([
                        'farm' => [
                            'Vui lòng xóa mềm nông trại trước khi xóa vĩnh viễn.',
                        ],
                    ]);
                }

                /*
                 * Kiểm tra lại để bảo vệ dữ liệu,
                 * dù trước đó lúc xóa mềm đã kiểm tra.
                 */
                $this->ensureNoRelatedData(
                    $farm->id
                );

                $seller = $farm->seller;

                $farm->forceDelete();

                /*
                 * Seller mất Farm vĩnh viễn:
                 * seller → customer.
                 *
                 * Admin vẫn giữ admin.
                 */
                if (
                    $seller &&
                    $seller->hasRole('seller')
                ) {
                    $seller->syncRoles([
                        'customer',
                    ]);
                }

                return $farm;
            }
        );
    }

    // =====================================================
    // KIỂM TRA FARM CHO CÁC SERVICE KHÁC
    // =====================================================

    /**
     * Lấy Farm chưa bị xóa mềm của User.
     */
    public function getOwnedFarm(
        User $user
    ): Farm {
        $farm = Farm::query()
            ->where(
                'seller_id',
                $user->id
            )
            ->first();

        if (!$farm) {
            throw ValidationException::withMessages([
                'farm' => [
                    'Tài khoản chưa có nông trại hoặc nông trại đã bị xóa.',
                ],
            ]);
        }

        return $farm;
    }

    /**
     * Chỉ Farm active mới được làm nghiệp vụ bán hàng mới.
     *
     * ProductService, HarvestLotService,
     * ProductCertificateService gọi hàm này.
     */
    public function getActiveFarm(
        User $user
    ): Farm {
        $farm = $this->getOwnedFarm(
            $user
        );

        if (!$farm->isActive()) {
            throw ValidationException::withMessages([
                'farm' => [
                    match ($farm->status) {
                        Farm::STATUS_PENDING =>
                        'Nông trại đang chờ quản trị viên duyệt.',

                        Farm::STATUS_REJECTED =>
                        'Nông trại đã bị từ chối. Vui lòng sửa thông tin và gửi duyệt lại.',

                        Farm::STATUS_SUSPENDED =>
                        'Nông trại đang bị đình chỉ, không được thực hiện nghiệp vụ bán hàng mới.',

                        default =>
                        'Nông trại hiện không hoạt động.',
                    },
                ],
            ]);
        }

        return $farm;
    }

    /**
     * Farm active hoặc suspended được xử lý đơn cũ.
     */
    public function getOrderManageableFarm(
        User $user
    ): Farm {
        $farm = $this->getOwnedFarm(
            $user
        );

        if (
            !in_array(
                $farm->status,
                [
                    Farm::STATUS_ACTIVE,
                    Farm::STATUS_SUSPENDED,
                ],
                true
            )
        ) {
            throw ValidationException::withMessages([
                'farm' => [
                    match ($farm->status) {
                        Farm::STATUS_PENDING =>
                        'Nông trại đang chờ duyệt, chưa được phép xử lý đơn hàng.',

                        Farm::STATUS_REJECTED =>
                        'Nông trại đã bị từ chối, chưa được phép xử lý đơn hàng.',

                        default =>
                        'Nông trại không được phép xử lý đơn hàng.',
                    },
                ],
            ]);
        }

        return $farm;
    }

    /**
     * Kiểm tra sản phẩm có thuộc đúng Farm không.
     */
    public function ensureProductBelongsToFarm(
        Product $product,
        Farm $farm
    ): void {
        if (
            (int) $product->farm_id !==
            (int) $farm->id
        ) {
            throw ValidationException::withMessages([
                'product' => [
                    'Bạn không có quyền thao tác với sản phẩm này.',
                ],
            ]);
        }
    }

    /**
     * Checkout gọi để kiểm tra Farm có nhận đơn mới không.
     */
    public function ensureFarmCanSell(
        Farm $farm
    ): void {
        if ($farm->trashed()) {
            throw ValidationException::withMessages([
                'farm' => [
                    'Nông trại đã bị xóa.',
                ],
            ]);
        }

        if (!$farm->isActive()) {
            throw ValidationException::withMessages([
                'farm' => [
                    match ($farm->status) {
                        Farm::STATUS_PENDING =>
                        'Nông trại đang chờ duyệt.',

                        Farm::STATUS_REJECTED =>
                        'Nông trại đã bị từ chối.',

                        Farm::STATUS_SUSPENDED =>
                        'Nông trại đang bị đình chỉ và không nhận đơn hàng mới.',

                        default =>
                        'Nông trại hiện không nhận đơn hàng mới.',
                    },
                ],
            ]);
        }
    }

    // =====================================================
    // PRIVATE HELPERS
    // =====================================================

    private function ensureNoRelatedData(
        int $farmId
    ): void {
        if ($this->hasAnyProducts($farmId)) {
            throw ValidationException::withMessages([
                'farm' => [
                    'Không thể xóa vì nông trại vẫn còn dữ liệu sản phẩm, kể cả sản phẩm đã xóa mềm.',
                ],
            ]);
        }

        if ($this->hasAnySubOrders($farmId)) {
            throw ValidationException::withMessages([
                'farm' => [
                    'Không thể xóa vì nông trại vẫn còn dữ liệu đơn hàng.',
                ],
            ]);
        }
    }

    private function hasAnyProducts(
        int $farmId
    ): bool {
        return Product::withoutGlobalScope(
            'farm_not_deleted'
        )
            ->withTrashed()
            ->where(
                'farm_id',
                $farmId
            )
            ->exists();
    }

    private function hasAnySubOrders(
        int $farmId
    ): bool {
        return SubOrder::withTrashed()
            ->where(
                'farm_id',
                $farmId
            )
            ->exists();
    }

    private function appendPublicFarmSummary(
        Farm $farm
    ): Farm {
        $products = Product::query()
            ->select([
                'id',
                'farm_id',
            ])
            ->where(
                'farm_id',
                $farm->id
            )
            ->where(
                'status',
                1
            )
            ->withCount([
                'visibleRatingReviews as review_count',
                'visibleComments as comment_count',
                'visibleReviewReplies as reply_comment_count',
            ])
            ->withAvg(
                'visibleRatingReviews as rating_avg',
                'rating'
            )
            ->with([
                'certificates' => function ($certificateQuery) {
                    $certificateQuery
                        ->where('status', 1)
                        ->whereDate(
                            'expiry_date',
                            '>=',
                            today()
                        )
                        ->with([
                            'certification:id,name',
                        ]);
                },
            ])
            ->get();

        $totalReviews = (int) $products->sum(
            function ($product) {
                return (int) (
                    $product->review_count ?? 0
                );
            }
        );

        $ratingTotal = (float) $products->sum(
            function ($product) {
                $reviewCount = (int) (
                    $product->review_count ?? 0
                );

                $ratingAverage = (float) (
                    $product->rating_avg ?? 0
                );

                return $ratingAverage * $reviewCount;
            }
        );

        $farm->setAttribute(
            'rating',
            [
                'average' => $totalReviews > 0
                    ? round(
                        $ratingTotal / $totalReviews,
                        1
                    )
                    : 0,

                'total' => $totalReviews,
            ]
        );

        $farm->setAttribute(
            'comment_count',
            (int) $products->sum(
                fn ($product) => (int) ($product->comment_count ?? 0)
                    + (int) ($product->reply_comment_count ?? 0)
            )
        );

        $certifications = $products
            ->flatMap(function ($product) {
                return $product->certificates;
            })
            ->pluck('certification.name')
            ->filter()
            ->unique()
            ->values();

        $farm->setAttribute(
            'certifications',
            $certifications
        );

        return $farm;
    }

    private function appendPublicProductCardData(
        Product $product
    ): Product {
        $soldQuantity = (float) (
            $product->sold_quantity ?? 0
        );

        $soldQuantity30Days = (float) (
            $product->sold_quantity_30_days ?? 0
        );

        $price = (float) (
            $product->price ?? 0
        );

        $salePrice = $product->sale_price !== null
            ? (float) $product->sale_price
            : null;

        $discountPercent = 0;

        if (
            $price > 0 &&
            $salePrice !== null &&
            $salePrice > 0 &&
            $salePrice < $price
        ) {
            $discountPercent = (int) round(
                (($price - $salePrice) / $price) * 100
            );
        }

        $isNew = $product->created_at
            ? $product->created_at->gte(
                now()->subDays(
                    self::NEW_PRODUCT_DAYS
                )
            )
            : false;

        $product->setAttribute(
            'rating',
            [
                'average' => round(
                    (float) (
                        $product->rating_avg ?? 0
                    ),
                    1
                ),

                'total' => (int) (
                    $product->review_count ?? 0
                ),
            ]
        );

        $product->setAttribute(
            'comment_count',
            (int) ($product->comment_count ?? 0)
                + (int) ($product->reply_comment_count ?? 0)
        );

        $product->setAttribute(
            'sold_quantity',
            $soldQuantity
        );

        $product->setAttribute(
            'sold_quantity_30_days',
            $soldQuantity30Days
        );

        $product->setAttribute(
            'discount_percent',
            $discountPercent
        );

        $product->setAttribute(
            'is_new',
            $isNew
        );

        $product->setAttribute(
            'is_hot',
            (bool) $product->is_hot
        );

        $product->setAttribute(
            'is_best_seller',
            $soldQuantity30Days >=
                self::BEST_SELLER_MIN_QUANTITY
        );

        return $product;
    }

    private function appendRatingAndCertifications(
        Farm $farm
    ): Farm {
        $contents = $farm->products
            ->flatMap(function ($product) {
                return $product->reviews;
            });

        $ratingReviews = $contents->filter(
            fn ($review) => $review->rating !== null
        );

        $directComments = $contents->filter(
            fn ($review) => trim((string) $review->comment) !== ''
        );

        $replyComments = $contents
            ->flatMap(fn ($review) => $review->replies ?? collect())
            ->filter(fn ($reply) => trim((string) $reply->comment) !== '');

        $farm->setAttribute(
            'rating',
            [
                'average' => round(
                    $ratingReviews->avg('rating') ?? 0,
                    1
                ),

                'total' => $ratingReviews->count(),
            ]
        );

        $farm->setAttribute(
            'comment_count',
            $directComments->count() + $replyComments->count()
        );

        $farm->products->each(
            function ($product) {
                $soldQuantity = (float) (
                    $product->sold_quantity ?? 0
                );

                $soldQuantity30Days = (float) (
                    $product->sold_quantity_30_days ?? 0
                );

                $price = (float) ($product->price ?? 0);

                $salePrice = $product->sale_price !== null
                    ? (float) $product->sale_price
                    : null;

                $discountPercent = 0;

                if (
                    $price > 0 &&
                    $salePrice !== null &&
                    $salePrice > 0 &&
                    $salePrice < $price
                ) {
                    $discountPercent = (int) round(
                        (($price - $salePrice) / $price) * 100
                    );
                }

                $isNew = $product->created_at
                    ? $product->created_at->gte(
                        now()->subDays(
                            self::NEW_PRODUCT_DAYS
                        )
                    )
                    : false;

                $product->setAttribute(
                    'rating',
                    [
                        'average' => round(
                            $product->reviews
                                ->avg('rating') ?? 0,
                            1
                        ),

                        'total' =>
                        $product->reviews
                            ->count(),
                    ]
                );

                $product->setAttribute(
                    'sold_quantity',
                    $soldQuantity
                );

                $product->setAttribute(
                    'sold_quantity_30_days',
                    $soldQuantity30Days
                );

                $product->setAttribute(
                    'discount_percent',
                    $discountPercent
                );

                $product->setAttribute(
                    'is_new',
                    $isNew
                );

                $product->setAttribute(
                    'is_hot',
                    (bool) $product->is_hot
                );

                $product->setAttribute(
                    'is_best_seller',
                    $soldQuantity30Days >=
                        self::BEST_SELLER_MIN_QUANTITY
                );

                unset($product->reviews);
            }
        );

        $certifications = $farm->products
            ->flatMap(function ($product) {
                return $product->certificates;
            })
            ->pluck('certification.name')
            ->filter()
            ->unique()
            ->values();

        $farm->setAttribute(
            'certifications',
            $certifications
        );

        return $farm;
    }

    private function generateUniqueSlug(
        string $name,
        ?int $ignoreId = null
    ): string {
        $baseSlug = Str::slug(
            $name
        );

        if ($baseSlug === '') {
            $baseSlug = 'nong-trai';
        }

        $slug = $baseSlug;
        $counter = 2;

        while (
            Farm::withTrashed()
            ->when(
                $ignoreId,
                fn($query) => $query->where(
                    'id',
                    '!=',
                    $ignoreId
                )
            )
            ->where(
                'slug',
                $slug
            )
            ->exists()
        ) {
            $slug = $baseSlug
                . '-'
                . $counter;

            $counter++;
        }

        return $slug;
    }
}
