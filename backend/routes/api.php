<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Cart\CartController;
use App\Http\Controllers\Category\CategoryController;
use App\Http\Controllers\Certification\CertificationController;
use App\Http\Controllers\Dashboard\AdminDashboardController;
use App\Http\Controllers\Dashboard\SellerDashboardController;
use App\Http\Controllers\Farm\FarmController;
use App\Http\Controllers\Order\BuyerOrderController;
use App\Http\Controllers\Order\CheckoutController;
use App\Http\Controllers\Order\SellerOrderController;
use App\Http\Controllers\Order\AdminOrderController;
use App\Http\Controllers\Product\HarvestLotController;
use App\Http\Controllers\Product\ProductController;
use App\Http\Controllers\Product\AdminProductController;
use App\Http\Controllers\Report\AdminReportController;
use App\Http\Controllers\Upload\UploadController;
use App\Http\Controllers\User\UserController;
use App\Http\Controllers\Address\AddressController;
use App\Http\Controllers\Payment\MomoController;
use App\Http\Controllers\Home\HomeController;
use App\Http\Controllers\Review\ReviewController;
use App\Http\Controllers\Review\SellerReviewController;
use App\Http\Controllers\Review\AdminReviewController;
use App\Http\Controllers\Dashboard\SellerRevenueController;
use App\Http\Controllers\Audit\AuditLogController;
use App\Http\Controllers\Notification\NotificationController;


// PUBLIC AUTH
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

//IPN MOMO
Route::get('/payments/momo/redirect', [MomoController::class, 'redirect']);
Route::post('/payments/momo/ipn', [MomoController::class, 'ipn']);


// PUBLIC DANH MỤC
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{slug}', [CategoryController::class, 'show']);


// PUBLIC CHỨNG CHỈ
Route::get('/certifications', [CertificationController::class, 'index']);
Route::get('/certifications/{id}', [CertificationController::class, 'show']);

// PUBLIC TRANG CHỦ
Route::get('/home', [HomeController::class, 'index']);

// PUBLIC NÔNG TRẠI
Route::get('/farms', [FarmController::class, 'index']);

// PUBLIC SẢN PHẨM
Route::get('/products/filters', [ProductController::class, 'filters']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}/reviews', [ProductController::class, 'reviews']);
Route::get('/products/{slug}', [ProductController::class, 'show']);


// UPLOAD FILE REGISTER
Route::post(
    '/uploads/register-avatar',
    [UploadController::class, 'storeRegisterAvatar']
);


Route::middleware('auth:sanctum')->group(function () {

    // HỒ SƠ CÁ NHÂN
    Route::get('/profile', [UserController::class, 'profile']);
    Route::put('/profile', [UserController::class, 'updateProfile']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // ĐÁNH GIÁ SẢN PHẨM
    Route::get('/my-reviews', [ReviewController::class, 'myReviews']);
    Route::get('/my-reviews/reviewable-items', [ReviewController::class, 'reviewableItems']);

    //Review
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::put('/reviews/{review}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);

    // ĐỊA CHỈ
    Route::get('/addresses', [AddressController::class, 'index']);
    Route::post('/addresses', [AddressController::class, 'store']);
    Route::put('/addresses/{address}', [AddressController::class, 'update']);
    Route::delete('/addresses/{address}', [AddressController::class, 'destroy']);
    Route::patch('/addresses/{address}/default', [AddressController::class, 'setDefault']);

    // LOGOUT
    Route::post('/logout', [AuthController::class, 'logoutCurrent']);
    Route::post('/logout-all', [AuthController::class, 'logoutAll']);
    Route::get('/activity', [AuditLogController::class, 'myActivity']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);


    // UPLOAD DÙNG CHUNG
    Route::post('/uploads', [UploadController::class, 'store']);


    // NÔNG TRẠI CỦA TÀI KHOẢN
    Route::post('/farms/register', [FarmController::class, 'register']);
    Route::get('/farms/my', [FarmController::class, 'myFarm']);
    Route::put('/farms/{id}', [FarmController::class, 'update']);
    Route::patch('/farms/{id}/resubmit', [FarmController::class, 'resubmit']);
    Route::delete('/farms/{id}/force', [FarmController::class, 'ownerForceDestroy']);


    // GIỎ HÀNG
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart/items', [CartController::class, 'store']);
    Route::put('/cart/items/{id}', [CartController::class, 'update']);
    Route::delete('/cart/items/{id}', [CartController::class, 'destroy']);
    Route::delete('/cart', [CartController::class, 'clear']);


    // ĐẶT HÀNG
    Route::post('/checkout', [CheckoutController::class, 'checkout']);


    // ĐƠN HÀNG BUYER
    Route::get('/orders', [BuyerOrderController::class, 'index']);
    Route::get('/orders/{id}', [BuyerOrderController::class, 'show']);
    Route::patch('/orders/{id}/cancel', [BuyerOrderController::class, 'cancel']);
    Route::post('/orders/{id}/retry-momo', [BuyerOrderController::class, 'retryMomo']);
    Route::patch('/orders/{id}/payment-method', [BuyerOrderController::class, 'changePaymentMethod']);


    Route::middleware('role:seller|admin')->group(function () {

        // SELLER DASHBOARD
        Route::get(
            '/vendor/dashboard',
            [SellerDashboardController::class, 'index']
        );


        // SELLER ORDERS
        Route::get(
            '/vendor/orders',
            [SellerOrderController::class, 'index']
        );

        Route::get(
            '/vendor/orders/{id}',
            [SellerOrderController::class, 'show']
        );

        Route::patch(
            '/vendor/orders/{id}/status',
            [SellerOrderController::class, 'updateStatus']
        );


        // SELLER PRODUCTS
        Route::get(
            '/vendor/products/options',
            [ProductController::class, 'vendorOptions']
        );

        Route::get(
            '/vendor/products',
            [ProductController::class, 'vendorIndex']
        );

        Route::get(
            '/vendor/products/{id}',
            [ProductController::class, 'vendorShow']
        );

        Route::post(
            '/vendor/products',
            [ProductController::class, 'storeVendorProduct']
        );

        Route::put(
            '/vendor/products/{id}',
            [ProductController::class, 'updateVendorProduct']
        );

        Route::delete(
            '/vendor/products/{id}',
            [ProductController::class, 'deleteVendorProduct']
        );

        Route::patch(
            '/vendor/products/{id}/toggle-status',
            [ProductController::class, 'toggleVendorProductStatus']
        );

        Route::post(
            '/vendor/products/{id}/certificates/renew',
            [ProductController::class, 'renewVendorProductCertificate']
        );

        Route::post(
            '/vendor/products/{id}/certificates/resubmit',
            [ProductController::class, 'resubmitRejectedCertificate']
        );


        // SELLER REVIEWS
        Route::get(
            '/vendor/reviews',
            [SellerReviewController::class, 'index']
        );

        Route::patch(
            '/vendor/reviews/{review}/status',
            [SellerReviewController::class, 'updateStatus']
        );

        Route::post(
            '/vendor/reviews/{review}/replies',
            [SellerReviewController::class, 'reply']
        );
        Route::post(
            '/vendor/products/{product}/comments',
            [SellerReviewController::class, 'createProductComment']
        );

        Route::get(
            '/vendor/revenue',
            [SellerRevenueController::class, 'index']
        );


        // SELLER UPLOAD
        Route::post(
            '/vendor/uploads',
            [UploadController::class, 'store']
        );


        // SELLER HARVEST LOTS
        Route::get(
            '/vendor/harvest-lots/options',
            [HarvestLotController::class, 'options']
        );

        Route::get(
            '/vendor/harvest-lots',
            [HarvestLotController::class, 'index']
        );

        Route::get(
            '/vendor/harvest-lots/{id}',
            [HarvestLotController::class, 'show']
        );

        Route::post(
            '/vendor/harvest-lots',
            [HarvestLotController::class, 'store']
        );

        Route::put(
            '/vendor/harvest-lots/{id}',
            [HarvestLotController::class, 'update']
        );

        Route::delete(
            '/vendor/harvest-lots/{id}',
            [HarvestLotController::class, 'destroy']
        );
    });


    Route::middleware('role:admin')->group(function () {

        // ADMIN DASHBOARD
        Route::get(
            '/admin/dashboard',
            [AdminDashboardController::class, 'index']
        );


        // ADMIN REPORTS
        Route::get(
            '/admin/reports',
            [AdminReportController::class, 'index']
        );
        Route::get('/admin/audit-logs', [AuditLogController::class, 'adminIndex']);


        // ADMIN REVIEWS
        Route::get('/admin/reviews', [AdminReviewController::class, 'index']);
        Route::patch(
            '/admin/reviews/{review}/status',
            [AdminReviewController::class, 'updateStatus']
        );
        Route::delete('/admin/reviews/{id}', [AdminReviewController::class, 'destroy']);
        Route::patch(
            '/admin/reviews/{id}/restore',
            [AdminReviewController::class, 'restore']
        );
        Route::post(
            '/admin/reviews/{review}/replies',
            [AdminReviewController::class, 'reply']
        );
        Route::post(
            '/admin/products/{productId}/comments',
            [AdminReviewController::class, 'createProductComment']
        );


        // ADMIN USERS
        Route::get('/admin/users', [UserController::class, 'index']);
        Route::get('/admin/users/{id}', [UserController::class, 'show']);

        Route::patch(
            '/admin/users/{id}/status',
            [UserController::class, 'toggleStatus']
        );

        Route::delete(
            '/admin/users/{id}',
            [UserController::class, 'destroy']
        );

        Route::delete(
            '/admin/users/{id}/force',
            [UserController::class, 'forceDestroy']
        );

        Route::patch(
            '/admin/users/{id}/restore',
            [UserController::class, 'restore']
        );


        // ADMIN ORDERS
        // Đặt options trước /{id} để Laravel không hiểu "options" là id.
        Route::get(
            '/admin/orders/options',
            [AdminOrderController::class, 'options']
        );

        Route::get(
            '/admin/orders',
            [AdminOrderController::class, 'index']
        );

        Route::get(
            '/admin/orders/{id}',
            [AdminOrderController::class, 'show']
        );

        Route::patch(
            '/admin/orders/{id}/cancel',
            [AdminOrderController::class, 'cancelOrder']
        );

        Route::get(
            '/admin/sub-orders',
            [AdminOrderController::class, 'subOrderIndex']
        );

        Route::get(
            '/admin/sub-orders/{id}',
            [AdminOrderController::class, 'subOrderShow']
        );

        Route::patch(
            '/admin/sub-orders/{id}/status',
            [AdminOrderController::class, 'updateSubOrderStatus']
        );


        // ADMIN PRODUCTS
        Route::get(
            '/admin/products/options',
            [AdminProductController::class, 'options']
        );

        Route::get(
            '/admin/products',
            [AdminProductController::class, 'index']
        );

        Route::get(
            '/admin/products/{id}',
            [AdminProductController::class, 'show']
        );

        Route::patch(
            '/admin/products/{id}/approve',
            [AdminProductController::class, 'approve']
        );

        Route::patch(
            '/admin/products/{id}/reject',
            [AdminProductController::class, 'reject']
        );

        Route::patch(
            '/admin/products/{id}/suspend',
            [AdminProductController::class, 'suspend']
        );

        Route::patch(
            '/admin/products/{id}/reopen',
            [AdminProductController::class, 'reopen']
        );

        Route::patch(
            '/admin/products/{productId}/certificates/{certificateId}/approve',
            [AdminProductController::class, 'approveCertificate']
        );

        Route::patch(
            '/admin/products/{productId}/certificates/{certificateId}/reject',
            [AdminProductController::class, 'rejectCertificate']
        );


        // ADMIN CATEGORIES
        Route::get(
            '/admin/categories',
            [CategoryController::class, 'adminIndex']
        );

        Route::get(
            '/admin/categories/{id}',
            [CategoryController::class, 'adminShow']
        );

        Route::post(
            '/admin/categories',
            [CategoryController::class, 'store']
        );

        Route::put(
            '/admin/categories/{id}',
            [CategoryController::class, 'update']
        );

        Route::patch(
            '/admin/categories/{id}/toggle-status',
            [CategoryController::class, 'toggleStatus']
        );

        Route::delete(
            '/admin/categories/{id}',
            [CategoryController::class, 'destroy']
        );

        Route::delete(
            '/admin/categories/{id}/force',
            [CategoryController::class, 'forceDestroy']
        );

        Route::patch(
            '/admin/categories/{id}/restore',
            [CategoryController::class, 'restore']
        );


        // ADMIN CERTIFICATIONS
        Route::get(
            '/admin/certifications',
            [CertificationController::class, 'adminIndex']
        );

        Route::get(
            '/admin/certifications/{id}',
            [CertificationController::class, 'adminShow']
        );

        Route::post(
            '/admin/certifications',
            [CertificationController::class, 'store']
        );

        Route::put(
            '/admin/certifications/{id}',
            [CertificationController::class, 'update']
        );

        Route::patch(
            '/admin/certifications/{id}/toggle-status',
            [CertificationController::class, 'toggleStatus']
        );

        Route::delete(
            '/admin/certifications/{id}',
            [CertificationController::class, 'destroy']
        );

        Route::delete(
            '/admin/certifications/{id}/force',
            [CertificationController::class, 'forceDestroy']
        );

        Route::patch(
            '/admin/certifications/{id}/restore',
            [CertificationController::class, 'restore']
        );


        // ADMIN FARMS
        Route::get(
            '/admin/farms',
            [FarmController::class, 'adminIndex']
        );

        Route::get(
            '/admin/farms/{id}',
            [FarmController::class, 'adminShow']
        );

        Route::patch(
            '/admin/farms/{id}/approve',
            [FarmController::class, 'approve']
        );

        Route::patch(
            '/admin/farms/{id}/reject',
            [FarmController::class, 'reject']
        );

        Route::patch(
            '/admin/farms/{id}/suspend',
            [FarmController::class, 'suspend']
        );

        Route::patch(
            '/admin/farms/{id}/reopen',
            [FarmController::class, 'reopen']
        );

        Route::delete(
            '/admin/farms/{id}',
            [FarmController::class, 'adminDestroy']
        );

        Route::delete(
            '/admin/farms/{id}/force',
            [FarmController::class, 'forceDestroy']
        );

        Route::patch(
            '/admin/farms/{id}/restore',
            [FarmController::class, 'restore']
        );
    });
});

// PUBLIC CHI TIẾT NÔNG TRẠI
Route::get('/farms/{slug}', [FarmController::class, 'show']);
