import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface TopMenu {
    menu_name: string;
    total_sold: number;
}

interface LowStockItem {
    id: number;
    stock: number;
    product: { name: string; base_unit?: { name: string } };
}

interface WeeklySale {
    x: string;
    y: number[];
}

interface TransactionItem {
    id: number;
    order_id: string;
    customer_name: string;
    date: string;
    items_count: number;
    total: number;
    status: string;
}

interface Props {
    todaySales: number;
    thisMonthNetProfit: number;
    todayTransactions: number;
    lowStockCount: number;
    topMenus: TopMenu[];
    lowStockItems: LowStockItem[];
    weeklySales: WeeklySale[];
    activeInventory: number;
    recentTransactions: TransactionItem[];
    isAdmin: boolean;
    filters?: {
        start_date: string;
        end_date: string;
    };
}

export default function Dashboard({
    todaySales,
    thisMonthNetProfit,
    todayTransactions,
    lowStockCount,
    topMenus,
    lowStockItems,
    weeklySales,
    activeInventory,
    recentTransactions,
    isAdmin,
    filters = { start_date: '', end_date: '' },
}: Props) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [Chart, setChart] = useState<any>(null);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        setStartDate(filters.start_date || '');
        setEndDate(filters.end_date || '');
    }, [filters.start_date, filters.end_date]);

    useEffect(() => {
        import('react-apexcharts').then((mod) => {
            setChart(() => mod.default);
        });
    }, []);

    useEffect(() => {
        const checkDark = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        checkDark();
        const observer = new MutationObserver(checkDark);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });
        return () => observer.disconnect();
    }, []);

    const handleDateChange = (type: 'start' | 'end', value: string) => {
        let newStart = startDate;
        let newEnd = endDate;
        if (type === 'start') {
            newStart = value;
            setStartDate(value);
        } else {
            newEnd = value;
            setEndDate(value);
        }
        router.get(
            '/dashboard',
            { start_date: newStart, end_date: newEnd },
            { preserveState: true, preserveScroll: true }
        );
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        })
            .format(val)
            .replace('Rp', 'Rp ');
    };

    const chartSeries = [
        {
            data: weeklySales.map((sale) => ({
                x: new Date(sale.x).getTime(),
                y: sale.y,
            })),
        },
    ];

    const chartOptions = {
        chart: {
            type: 'candlestick' as const,
            height: 320,
            toolbar: {
                show: false,
            },
            background: 'transparent',
        },
        theme: {
            mode: (isDark ? 'dark' : 'light') as const,
        },
        xaxis: {
            type: 'datetime' as const,
            labels: {
                style: {
                    colors: isDark ? '#a1a1aa' : '#71717a',
                    fontFamily: 'Inter, sans-serif',
                },
            },
        },
        yaxis: {
            tooltip: {
                enabled: true,
            },
            labels: {
                formatter: (val: number) => {
                    return new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                    })
                        .format(val)
                        .replace('Rp', 'Rp ');
                },
                style: {
                    colors: isDark ? '#a1a1aa' : '#71717a',
                    fontFamily: 'Inter, sans-serif',
                },
            },
        },
        plotOptions: {
            candlestick: {
                colors: {
                    upward: '#10b981', // emerald-500
                    downward: '#ef4444', // red-500
                },
                wick: {
                    useFillColor: true,
                },
            },
        },
        grid: {
            borderColor: isDark ? '#27272a' : '#e4e4e7',
        },
        tooltip: {
            theme: isDark ? 'dark' : 'light',
        },
    };

    if (isAdmin) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head>
                    <title>Dashboard</title>
                    <link
                        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                        rel="stylesheet"
                    />
                </Head>

                <div className="flex flex-1 flex-col gap-6 p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Ringkasan
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Berikut adalah ringkasan penjualan hari ini.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-muted-foreground">Dari</span>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => handleDateChange('start', e.target.value)}
                                    className="w-40 border-sidebar-border bg-card text-foreground"
                                />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-muted-foreground">Sampai</span>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => handleDateChange('end', e.target.value)}
                                    className="w-40 border-sidebar-border bg-card text-foreground"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                        <div className="flex flex-col justify-between rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm transition-all hover:shadow-md dark:border-sidebar-border">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-muted-foreground">
                                    Pemasukan Hari Ini
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                                    <span className="material-symbols-outlined text-xl">
                                        payments
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="text-3xl font-bold tracking-tight">
                                    {formatCurrency(todaySales)}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm transition-all hover:shadow-md dark:border-sidebar-border">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-muted-foreground">
                                    Laba Bersih (Bulan Ini)
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                                    <span className="material-symbols-outlined text-xl">
                                        account_balance_wallet
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4">
                                <div
                                    className={`text-3xl font-bold tracking-tight ${thisMonthNetProfit < 0 ? 'text-red-500' : ''}`}
                                >
                                    {formatCurrency(thisMonthNetProfit)}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm transition-all hover:shadow-md dark:border-sidebar-border">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-muted-foreground">
                                    Pesanan Hari Ini
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                                    <span className="material-symbols-outlined text-xl">
                                        shopping_bag
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="text-3xl font-bold tracking-tight">
                                    {todayTransactions}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm transition-all hover:shadow-md dark:border-sidebar-border">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-muted-foreground">
                                    Stok Aktif
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
                                    <span className="material-symbols-outlined text-xl">
                                        inventory_2
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="text-3xl font-bold tracking-tight">
                                    {activeInventory?.toLocaleString('id-ID') ||
                                        0}{' '}
                                    Items
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm transition-all hover:shadow-md dark:border-sidebar-border">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-muted-foreground">
                                    Peringatan Stok Rendah
                                </div>
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-full ${lowStockCount > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'}`}
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {lowStockCount > 0
                                            ? 'warning'
                                            : 'check_circle'}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4">
                                <div
                                    className={`text-3xl font-bold tracking-tight ${lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : ''}`}
                                >
                                    {lowStockCount} Items
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Weekly Sales Chart */}
                        <div className="col-span-1 flex flex-col rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm lg:col-span-2 dark:border-sidebar-border">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold">
                                        Tren Kecepatan Penjualan (OHLC)
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Performa penjualan harian berdasarkan jam operasional harian
                                    </p>
                                </div>
                            </div>

                            <div className="mt-auto h-80 w-full">
                                {Chart && weeklySales && weeklySales.length > 0 ? (
                                    <Chart
                                        options={chartOptions}
                                        series={chartSeries}
                                        type="candlestick"
                                        height={320}
                                    />
                                ) : !Chart ? (
                                    <div className="flex h-full w-full flex-col gap-3 justify-center">
                                        <Skeleton className="h-6 w-full" />
                                        <Skeleton className="h-64 w-full" />
                                    </div>
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <p className="text-sm text-muted-foreground">
                                            Tidak ada data transaksi untuk periode ini.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Selling Items */}
                        <div className="col-span-1 flex flex-col rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold">
                                    Produk Terlaris
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Produk terpopuler
                                </p>
                            </div>
                            <div className="flex-1 space-y-4">
                                {!topMenus || topMenus.length === 0 ? (
                                    <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                        Tidak ada data.
                                    </p>
                                ) : (
                                    topMenus.slice(0, 5).map((menu, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-4 rounded-lg border border-transparent p-3 transition-colors hover:border-border/50 hover:bg-muted/50"
                                        >
                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-400">
                                                <span className="material-symbols-outlined text-lg">
                                                    restaurant_menu
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold">
                                                    {menu.menu_name}
                                                </p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {menu.total_sold} terjual
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="mb-6 overflow-hidden rounded-xl border border-sidebar-border/70 bg-card shadow-sm dark:border-sidebar-border">
                        <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 p-6">
                            <div>
                                <h3 className="text-lg font-bold">
                                    Transaksi Terbaru
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Transaksi terakhir
                                </p>
                            </div>
                            <a
                                href="/transactions"
                                className="text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400"
                            >
                                View All
                            </a>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/30 text-xs font-semibold text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-6 py-4">Order ID</th>
                                        <th className="px-6 py-4">Customer</th>
                                        <th className="px-6 py-4">
                                            Date & Time
                                        </th>
                                        <th className="px-6 py-4">Items</th>
                                        <th className="px-6 py-4 text-right">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {!recentTransactions ||
                                    recentTransactions.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-6 py-8 text-center text-muted-foreground"
                                            >
                                                Tidak ada transaksi.
                                            </td>
                                        </tr>
                                    ) : (
                                        recentTransactions.map((tx) => (
                                            <tr
                                                key={tx.id}
                                                className="transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-6 py-4 font-medium">
                                                    {tx.order_id}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold dark:bg-slate-700">
                                                            {tx.customer_name
                                                                .substring(0, 2)
                                                                .toUpperCase()}
                                                        </div>
                                                        <span>
                                                            {tx.customer_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {tx.date}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {tx.items_count}
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold">
                                                    {formatCurrency(tx.total)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    } else {
        return (
            <AppLayout>
                <Head>
                    <title>Dashboard</title>
                    <link
                        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                        rel="stylesheet"
                    />
                </Head>
            </AppLayout>
        );
    }
}
