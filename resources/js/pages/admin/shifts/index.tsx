import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
    DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, User, MapPin, Eye, DollarSign, Package } from 'lucide-react';

interface Branch {
    id: number;
    name: string;
}

interface UserData {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    base_unit?: {
        name: string;
    };
}

interface SessionProduct {
    id: number;
    product_id: number;
    starting_packs: number;
    starting_quantity: number;
    sold_quantity: number;
    actual_ending_packs: number | null;
    actual_ending_loose_pcs: number | null;
    actual_ending_quantity: number | null;
    product: Product;
}

interface CashierSession {
    id: number;
    user_id: number;
    branch_id: number;
    starting_cash: number;
    expected_ending_cash: number;
    actual_ending_cash: number | null;
    difference: number | null;
    status: 'open' | 'closed';
    opened_at: string;
    closed_at: string | null;
    user: UserData;
    branch: Branch;
    session_products: SessionProduct[];
}

interface PaginatedData {
    data: CashierSession[];
    current_page: number;
    last_page: number;
    links: any[];
}

interface Props {
    sessions: PaginatedData;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Riwayat Shift & Sesi Kasir', href: '/admin/shifts' },
];

export default function ShiftsIndex({ sessions }: Props) {
    const [selectedSession, setSelectedSession] = useState<CashierSession | null>(null);

    const fmt = (val: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);

    const formatDate = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'dd MMM yyyy, HH:mm', { locale: id });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Riwayat Sesi Kasir" />

            <div className="mx-auto flex h-full max-w-7xl flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Riwayat Shift & Sesi Kasir
                    </h1>
                    <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                        Pantau rekonsiliasi uang laci dan barang bawaan kasir harian dari setiap cabang.
                    </p>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-zinc-200 bg-zinc-50 font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50">
                                <tr>
                                    <th className="px-6 py-4">Buka Shift</th>
                                    <th className="px-6 py-4">Tutup Shift</th>
                                    <th className="px-6 py-4">Kasir / Cabang</th>
                                    <th className="px-6 py-4">Modal Awal</th>
                                    <th className="px-6 py-4 text-right">Ekspektasi Uang</th>
                                    <th className="px-6 py-4 text-right">Uang Fisik</th>
                                    <th className="px-6 py-4 text-right">Selisih</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Detail</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {sessions.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-zinc-500">
                                            Belum ada data riwayat shift kasir.
                                        </td>
                                    </tr>
                                ) : (
                                    sessions.data.map((s) => {
                                        const diffVal = Number(s.difference || 0);

                                        return (
                                            <tr key={s.id} className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                                                <td className="px-6 py-4 whitespace-nowrap font-medium">
                                                    {formatDate(s.opened_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-zinc-500">
                                                    {s.closed_at ? formatDate(s.closed_at) : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{s.user.name}</div>
                                                    <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                                        <MapPin className="h-3 w-3" /> {s.branch.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap font-medium">
                                                    {fmt(s.starting_cash)}
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap font-medium text-zinc-700 dark:text-zinc-300">
                                                    {fmt(s.expected_ending_cash)}
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap font-bold text-zinc-900 dark:text-zinc-100">
                                                    {s.actual_ending_cash !== null ? fmt(s.actual_ending_cash) : '-'}
                                                </td>
                                                <td className={`px-6 py-4 text-right whitespace-nowrap font-bold ${diffVal < 0 ? 'text-rose-600 dark:text-rose-400' : diffVal > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`}>
                                                    {s.closed_at ? (diffVal > 0 ? '+' : '') + fmt(diffVal) : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    {s.status === 'open' ? (
                                                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-400">
                                                            Aktif
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-800/50 dark:bg-zinc-800/30 dark:text-zinc-400">
                                                            Selesai
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setSelectedSession(s)}
                                                        className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            <Dialog open={!!selectedSession} onOpenChange={(isOpen) => !isOpen && setSelectedSession(null)}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <Eye className="h-5 w-5 text-zinc-500" />
                            Detail Sesi Kasir ({selectedSession?.user.name})
                        </DialogTitle>
                        <DialogDescription>
                            Cabang: {selectedSession?.branch.name} • Status: {selectedSession?.status === 'open' ? 'Sesi Aktif' : 'Shift Selesai'}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedSession && (
                        <div className="space-y-6 py-4">
                            {/* Waktu & Kas Info */}
                            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/40">
                                <div className="space-y-1">
                                    <span className="text-xs text-zinc-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> Waktu Buka:</span>
                                    <p className="text-sm font-semibold">{formatDate(selectedSession.opened_at)}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-zinc-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> Waktu Tutup:</span>
                                    <p className="text-sm font-semibold">{selectedSession.closed_at ? formatDate(selectedSession.closed_at) : 'Masih Berlangsung'}</p>
                                </div>
                                <div className="space-y-1 mt-2">
                                    <span className="text-xs text-zinc-500 flex items-center gap-1"><DollarSign className="h-3 w-3" /> Modal Rupiah:</span>
                                    <p className="text-sm font-bold text-zinc-950 dark:text-zinc-100">{fmt(selectedSession.starting_cash)}</p>
                                </div>
                                <div className="space-y-1 mt-2">
                                    <span className="text-xs text-zinc-500 flex items-center gap-1"><DollarSign className="h-3 w-3" /> Uang Hasil Penjualan:</span>
                                    <p className="text-sm font-bold text-zinc-950 dark:text-zinc-100">{fmt(selectedSession.expected_ending_cash - selectedSession.starting_cash)}</p>
                                </div>
                            </div>

                            {/* Rekonsiliasi Uang Akhir */}
                            {selectedSession.status === 'closed' && (
                                <div className="border border-zinc-200/60 rounded-2xl p-4 space-y-3 dark:border-zinc-800">
                                    <h4 className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">Rekonsiliasi Kas Akhir:</h4>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-zinc-100/60 p-2.5 rounded-lg dark:bg-zinc-800/50">
                                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Sistem</span>
                                            <p className="text-xs font-bold mt-1">{fmt(selectedSession.expected_ending_cash)}</p>
                                        </div>
                                        <div className="bg-zinc-100/60 p-2.5 rounded-lg dark:bg-zinc-800/50">
                                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Fisik</span>
                                            <p className="text-xs font-bold mt-1">{fmt(selectedSession.actual_ending_cash || 0)}</p>
                                        </div>
                                        <div className={`p-2.5 rounded-lg ${Number(selectedSession.difference || 0) < 0 ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'}`}>
                                            <span className="text-[10px] uppercase font-semibold opacity-80">Selisih</span>
                                            <p className="text-xs font-bold mt-1">{(Number(selectedSession.difference || 0) > 0 ? '+' : '') + fmt(selectedSession.difference || 0)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Detail Barang Bawaan Dimsum */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-sm text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                    <Package className="h-4 w-4" /> Modal Dimsum yang Dibawa & Sisa:
                                </h4>
                                <div className="max-h-[200px] overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-zinc-50 font-medium text-zinc-500 dark:bg-zinc-800/50">
                                            <tr>
                                                <th className="px-4 py-3">Nama Dimsum</th>
                                                <th className="px-4 py-3 text-center">Buka (Pack/Pcs)</th>
                                                <th className="px-4 py-3 text-center">Terjual (Pcs)</th>
                                                <th className="px-4 py-3 text-center">Sisa (Pack/Pcs)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                            {selectedSession.session_products.map((sp) => {
                                                const expectedRemaining = sp.starting_quantity - sp.sold_quantity;

                                                return (
                                                    <tr key={sp.id}>
                                                        <td className="px-4 py-3 font-semibold">{sp.product.name}</td>
                                                        <td className="px-4 py-3 text-center font-medium">
                                                            {sp.starting_packs} pack <span className="text-zinc-400">({sp.starting_quantity} {sp.product.base_unit?.name || 'pcs'})</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-bold text-orange-600 dark:text-orange-400">
                                                            {sp.sold_quantity} {sp.product.base_unit?.name || 'pcs'}
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-medium">
                                                            {sp.actual_ending_packs !== null ? (
                                                                <span>
                                                                    {sp.actual_ending_packs} pack
                                                                    {sp.actual_ending_loose_pcs && sp.actual_ending_loose_pcs > 0 ? ` ${sp.actual_ending_loose_pcs} ${sp.product.base_unit?.name || 'pcs'}` : ''}{' '}
                                                                    <span className="text-zinc-400">({sp.actual_ending_quantity} {sp.product.base_unit?.name || 'pcs'})</span>
                                                                </span>
                                                            ) : (
                                                                <span className="text-zinc-400">Belum Tutup (Ekspektasi: {expectedRemaining} {sp.product.base_unit?.name || 'pcs'})</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Tutup</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
