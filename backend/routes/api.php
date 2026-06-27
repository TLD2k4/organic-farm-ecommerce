<?php
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Product\ProductController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::middleware('role:seller')->group(function () {
        Route::post('/vendor/products', [ProductController::class, 'storeVendorProduct']);
        Route::put('/vendor/products/{id}', [ProductController::class, 'updateVendorProduct']);
        Route::delete('/vendor/products/{id}', [ProductController::class, 'deleteVendorProduct']);
    });
});