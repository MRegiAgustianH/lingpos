<?php

use App\Http\Controllers\Api\Mobile\AuthController;
use App\Http\Controllers\Api\Mobile\MobileController;
use Illuminate\Support\Facades\Route;

Route::prefix('mobile')->group(function () {
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [MobileController::class, 'me']);
        Route::get('dashboard', [MobileController::class, 'dashboard']);
        Route::get('branches', [MobileController::class, 'branches']);
        Route::get('menus', [MobileController::class, 'menus']);
        Route::get('products', [MobileController::class, 'products']);
        Route::get('inventory', [MobileController::class, 'inventory']);
        Route::get('cashier/session', [MobileController::class, 'currentSession']);
        Route::post('cashier/session/open', [MobileController::class, 'openSession']);
        Route::post('cashier/session/close', [MobileController::class, 'closeSession']);
        Route::post('pos/checkout', [MobileController::class, 'checkout']);
        Route::get('pos/receipt/{transaction}', [MobileController::class, 'receipt']);
        Route::get('transactions', [MobileController::class, 'transactions']);
    });
});
