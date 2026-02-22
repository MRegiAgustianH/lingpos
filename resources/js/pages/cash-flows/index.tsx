import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Plus,
    Trash2,
    FilterX,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface CashFlow {
    id: number;
    branch_id: number;
    user_id: number;
    type: 'income' | 'expense';
    category: string;
    amount: number;
    description: string | null;
    transaction_date: string;
    user: { id: number; name: string };
    branch: { id: number; name: string } | null;
}

interface Summary {
    total_income: number;
    total_expense: number;
    net_flow: number;
}

interface Props {
    cashFlows: {
        data: CashFlow[];
        links: any[];
    };
    summary: Summary;
    filters: {
        type?: string;
        category?: string;
        start_date?: string;
        end_date?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Arus Kas', href: '/cash-flows' },
];

const categoryLabels: Record<string, string> = {
    modal: 'Modal',
    penjualan_kasir: 'Penjualan Kasir',
    bahan_baku: 'Bahan Baku',
    operasional: 'Operasional',
    gaji_karyawan: 'Gaji Karyawan',
    lainnya: 'Lainnya',
};

const fmt = (val: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val);

export default function CashFlowIndex({ cashFlows, summary, filters }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [formType, setFormType] = useState<'income' | 'expense'>('expense');
    const [formCategory, setFormCategory] = useState('bahan_baku');
    const [formAmount, setFormAmount] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formDate, setFormDate] = useState(
        new Date().toISOString().split('T')[0],
    );
    const [processing, setProcessing] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Filters state
    const [filterType, setFilterType] = useState(filters.type || 'all');
    const [filterCategory, setFilterCategory] = useState(
        filters.category || 'all',
    );
    const [filterStartDate, setFilterStartDate] = useState(
        filters.start_date || '',
    );
    const [filterEndDate, setFilterEndDate] = useState(filters.end_date || '');

    const applyFilters = () => {
        const query: any = {};
        if (filterType !== 'all') query.type = filterType;
        if (filterCategory !== 'all') query.category = filterCategory;
        if (filterStartDate) query.start_date = filterStartDate;
        if (filterEndDate) query.end_date = filterEndDate;
        router.get('/cash-flows', query, { preserveState: true });
    };

    const resetFilters = () => {
        setFilterType('all');
        setFilterCategory('all');
        setFilterStartDate('');
        setFilterEndDate('');
        router.get('/cash-flows');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.post(
            '/cash-flows',
            {
                type: formType,
                category: formCategory,
                amount: Number(formAmount),
                description: formDesc,
                transaction_date: formDate,
            },
            {
                onSuccess: () => {
                    setCreateOpen(false);
                    setFormAmount('');
                    setFormDesc('');
                    setProcessing(false);
                },
                onError: () => setProcessing(false),
            },
        );
    };

    const handleDelete = (id: number) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (deleteId) {
            router.delete(`/cash-flows/${deleteId}`, {
                onSuccess: () => setDeleteId(null),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Arus Kas (Cash Flow)" />

            <div className="mx-auto flex h-full max-w-7xl flex-1 flex-col gap-6 p-6">
                {/* Header & Stats */}
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                            <Wallet className="h-8 w-8 text-zinc-500" />
                            Arus Kas
                        </h1>
                        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                            Kelola pemasukan modal dan pengeluaran
                        </p>
                    </div>

                    <Button
                        onClick={() => setCreateOpen(true)}
                        className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Tambah Transaksi
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500">
                                Total Pemasukan
                            </p>
                            <h3 className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {fmt(summary.total_income)}
                            </h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                            <TrendingDown className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500">
                                Total Pengeluaran
                            </p>
                            <h3 className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
                                {fmt(summary.total_expense)}
                            </h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500">
                                Net Arus Kas
                            </p>
                            <h3 className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {fmt(summary.net_flow)}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-5">
                        <div>
                            <Label className="mb-1.5 block">Tipe</Label>
                            <Select
                                value={filterType}
                                onValueChange={setFilterType}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Tipe
                                    </SelectItem>
                                    <SelectItem value="income">
                                        Pemasukan
                                    </SelectItem>
                                    <SelectItem value="expense">
                                        Pengeluaran
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="mb-1.5 block">Kategori</Label>
                            <Select
                                value={filterCategory}
                                onValueChange={setFilterCategory}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Kategori
                                    </SelectItem>
                                    {Object.entries(categoryLabels).map(
                                        ([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="mb-1.5 block">Dari Tanggal</Label>
                            <Input
                                type="date"
                                value={filterStartDate}
                                onChange={(e) =>
                                    setFilterStartDate(e.target.value)
                                }
                            />
                        </div>
                        <div>
                            <Label className="mb-1.5 block">
                                Sampai Tanggal
                            </Label>
                            <Input
                                type="date"
                                value={filterEndDate}
                                onChange={(e) =>
                                    setFilterEndDate(e.target.value)
                                }
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={applyFilters} className="flex-1">
                                Filter
                            </Button>
                            <Button variant="outline" onClick={resetFilters}>
                                <FilterX className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-zinc-200 bg-zinc-50 font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50">
                                <tr>
                                    <th className="px-6 py-4">Tanggal</th>
                                    <th className="px-6 py-4">Cabang</th>
                                    <th className="px-6 py-4">
                                        Tipe & Kategori
                                    </th>
                                    <th className="px-6 py-4">Keterangan</th>
                                    <th className="px-6 py-4 text-right">
                                        Nominal
                                    </th>
                                    <th className="px-6 py-4 text-center">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {cashFlows.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-12 text-center text-zinc-500"
                                        >
                                            Belum ada data arus kas.
                                        </td>
                                    </tr>
                                ) : (
                                    cashFlows.data.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b border-zinc-100 transition-colors hover:bg-zinc-50/50 dark:border-zinc-800 dark:hover:bg-zinc-800/30"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {format(
                                                    new Date(
                                                        item.transaction_date,
                                                    ),
                                                    'dd MMM yyyy',
                                                    { locale: id },
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                                                {item.branch?.name ?? 'Global'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {item.type === 'income' ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-400"
                                                        >
                                                            Pemasukan
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/50 dark:bg-rose-900/20 dark:text-rose-400"
                                                        >
                                                            Pengeluaran
                                                        </Badge>
                                                    )}
                                                    <span className="text-zinc-600 dark:text-zinc-300">
                                                        •{' '}
                                                        {categoryLabels[
                                                            item.category
                                                        ] || item.category}
                                                    </span>
                                                </div>
                                            </td>
                                            <td
                                                className="max-w-xs truncate px-6 py-4 text-zinc-600 dark:text-zinc-400"
                                                title={item.description || '-'}
                                            >
                                                {item.description || '-'}
                                            </td>
                                            <td
                                                className={`px-6 py-4 text-right font-medium whitespace-nowrap ${item.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                                            >
                                                {item.type === 'income'
                                                    ? '+'
                                                    : '-'}
                                                {fmt(item.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleDelete(item.id)
                                                    }
                                                    disabled={
                                                        item.category ===
                                                        'penjualan_kasir'
                                                    }
                                                    className={`text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-900/20 ${item.category === 'penjualan_kasir' ? 'hidden cursor-not-allowed opacity-50 md:inline-flex' : ''}`}
                                                    title={
                                                        item.category ===
                                                            'penjualan_kasir'
                                                            ? 'Hapus transaksi dari riwayat Kasir'
                                                            : 'Hapus catatan ini'
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tambah Transaksi Arus Kas</DialogTitle>
                        <DialogDescription>
                            Catat pengeluaran bahan baku, operasional, atau
                            pemasukan modal.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tipe</Label>
                                <Select
                                    value={formType}
                                    onValueChange={(
                                        v: 'income' | 'expense',
                                    ) => {
                                        setFormType(v);
                                        if (v === 'income')
                                            setFormCategory('modal');
                                        else setFormCategory('bahan_baku');
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="income">
                                            Pemasukan
                                        </SelectItem>
                                        <SelectItem value="expense">
                                            Pengeluaran
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Kategori</Label>
                                <Select
                                    value={formCategory}
                                    onValueChange={setFormCategory}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(categoryLabels).map(
                                            ([key, label]) => {
                                                // Prevent manual entry of POS Sales
                                                if (key === 'penjualan_kasir')
                                                    return null;

                                                // Optional: limit categories based on type
                                                if (
                                                    formType === 'income' &&
                                                    ![
                                                        'modal',
                                                        'lainnya',
                                                    ].includes(key)
                                                )
                                                    return null;
                                                if (
                                                    formType === 'expense' &&
                                                    key === 'modal'
                                                )
                                                    return null;
                                                return (
                                                    <SelectItem
                                                        key={key}
                                                        value={key}
                                                    >
                                                        {label}
                                                    </SelectItem>
                                                );
                                            },
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Nominal (Rp)</Label>
                            <Input
                                type="number"
                                required
                                min="0"
                                value={formAmount}
                                onChange={(e) => setFormAmount(e.target.value)}
                                placeholder="0"
                                className="font-semibold"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Tanggal</Label>
                            <Input
                                type="date"
                                required
                                value={formDate}
                                onChange={(e) => setFormDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Keterangan (Opsional)</Label>
                            <Input
                                type="text"
                                value={formDesc}
                                onChange={(e) => setFormDesc(e.target.value)}
                                placeholder="Misal: Beli ayam 10kg dari supplier"
                            />
                        </div>

                        <DialogFooter className="pt-4">
                            <DialogClose asChild>
                                <Button variant="outline" type="button">
                                    Batal
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                            >
                                {processing
                                    ? 'Menyimpan...'
                                    : 'Simpan Transaksi'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <AlertDialog open={!!deleteId} onOpenChange={(isOpen) => !isOpen && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus transaksi arus kas tersebut secara permanen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
