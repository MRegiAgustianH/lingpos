<?php

use App\Http\Controllers\BranchController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

// Authenticated routes
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard (both admin & kasir)
    Route::get('dashboard', [DashboardController::class , 'index'])->name('dashboard');

    // Admin-only routes
    Route::middleware('role:admin')->group(function () {
            Route::resource('branches', BranchController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::resource('categories', CategoryController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::resource('units', UnitController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::resource('products', ProductController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::resource('menus', MenuController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::resource('users', UserController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::resource('cash-flows', \App\Http\Controllers\CashFlowController::class)->only(['index', 'store', 'destroy']);
            Route::get('inventory', [InventoryController::class , 'index'])->name('inventory.index');
            Route::post('inventory/adjust', [InventoryController::class , 'adjust'])->name('inventory.adjust');
        }
        );

        // Kasir & Admin routes
        Route::middleware('role:admin,kasir')->group(function () {
            Route::get('pos', [PosController::class , 'index'])->name('pos.index');
            Route::post('pos/checkout', [PosController::class , 'checkout'])->name('pos.checkout');
            Route::get('transactions', [TransactionController::class , 'index'])->name('transactions.index');
            Route::get('transactions/export', [TransactionController::class , 'export'])->name('transactions.export');
            Route::get('transactions/{transaction}', [TransactionController::class , 'show'])->name('transactions.show');
            Route::get('daily-restock', [InventoryController::class , 'dailyRestock'])->name('inventory.daily-restock');
            Route::post('daily-restock', [InventoryController::class , 'storeDailyRestock'])->name('inventory.store-daily-restock');
        }
        );
    });

require __DIR__ . '/settings.php';
