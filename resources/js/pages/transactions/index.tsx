import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BoxIcon } from '@/components/ui/box-icon';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Transaksi', href: '/transactions' },
];

interface Branch {
    id: number;
    name: string;
}
interface TransactionItemData {
    id: number;
    menu_name: string;
    price: number;
    quantity: number;
    subtotal: number;
}
interface Transaction {
    id: number;
    invoice_number: string;
    total: number;
    payment_method: string;
    amount_paid: number;
    change: number;
    created_at: string;
    user: { name: string };
    branch: Branch;
    transaction_items: TransactionItemData[];
}
interface PaginatedData {
    data: Transaction[];
    current_page: number;
    last_page: number;
}
interface Props {
    transactions: PaginatedData;
    branches: Branch[];
    filters: { branch_id?: string; date?: string };
    totalRevenue: number;
}

export default function TransactionIndex({
    transactions,
    branches,
    filters,
    totalRevenue,
}: Props) {
    const fmt = (val: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Riwayat Transaksi" />
            <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                <div className="space-y-4 p-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Label>Cabang:</Label>
                            <Select
                                value={filters.branch_id || 'all'}
                                onValueChange={(v) =>
                                    router.get('/transactions', {
                                        ...filters,
                                        branch_id: v === 'all' ? undefined : v,
                                    })
                                }
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Semua Cabang" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Cabang
                                    </SelectItem>
                                    {branches.map((b) => (
                                        <SelectItem
                                            key={b.id}
                                            value={String(b.id)}
                                        >
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label>Tanggal:</Label>
                            <Input
                                type="date"
                                value={filters.date ?? ''}
                                onChange={(e) =>
                                    router.get('/transactions', {
                                        ...filters,
                                        date: e.target.value || undefined,
                                    })
                                }
                                className="w-44"
                            />
                        </div>
                        <div className="ml-auto">
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => {
                                    const searchParams = new URLSearchParams();
                                    if (filters.branch_id)
                                        searchParams.set(
                                            'branch_id',
                                            filters.branch_id,
                                        );
                                    if (filters.date)
                                        searchParams.set('date', filters.date);
                                    window.location.href = `/transactions/export?${searchParams.toString()}`;
                                }}
                            >
                                <BoxIcon
                                    name="bx-download"
                                    className="h-4 w-4"
                                />
                                Cetak CSV
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground">
                                Total Pendapatan
                            </h3>
                            <p className="text-2xl font-bold text-primary">
                                {fmt(totalRevenue)}
                            </p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                            <p>Sesuai filter aktif</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="p-3">Invoice</th>
                                    <th className="p-3">Kasir</th>
                                    <th className="p-3">Total</th>
                                    <th className="p-3">Bayar</th>
                                    <th className="p-3">Metode</th>
                                    <th className="p-3">Waktu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.data.map((t) => (
                                    <tr
                                        key={t.id}
                                        className="cursor-pointer border-b hover:bg-muted/50"
                                        onClick={() =>
                                            router.get(`/transactions/${t.id}`)
                                        }
                                    >
                                        <td className="p-3 font-mono font-medium text-blue-600">
                                            {t.invoice_number}
                                        </td>
                                        <td className="p-3">{t.user?.name}</td>
                                        <td className="p-3 font-bold">
                                            {fmt(t.total)}
                                        </td>
                                        <td className="p-3">
                                            {fmt(t.amount_paid)}
                                        </td>
                                        <td className="p-3">
                                            <span
                                                className={`rounded px-2 py-1 text-xs ${t.payment_method === 'cash' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}
                                            >
                                                {t.payment_method.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            {new Date(
                                                t.created_at,
                                            ).toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                                {transactions.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="p-6 text-center text-muted-foreground"
                                        >
                                            Belum ada transaksi
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {transactions.last_page > 1 && (
                        <div className="mt-4 flex justify-center gap-2">
                            {Array.from(
                                { length: transactions.last_page },
                                (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() =>
                                            router.get('/transactions', {
                                                ...filters,
                                                page: i + 1,
                                            })
                                        }
                                        className={`rounded px-3 py-1 text-sm ${transactions.current_page === i + 1 ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ),
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
