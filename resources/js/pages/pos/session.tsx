import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Wallet, Package, AlertTriangle, ArrowRight, Play, Power, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
    id: number;
    name: string;
    base_unit?: { name: string };
}

interface SessionProduct {
    id: number;
    product_id: number;
    starting_packs: number;
    starting_quantity: number;
    sold_quantity: number;
    product: Product;
}

interface CashierSession {
    id: number;
    starting_cash: number;
    expected_ending_cash: number;
    status: string;
    opened_at: string;
    branch_id: number;
    branch?: { name: string };
    session_products: SessionProduct[];
}

interface Branch {
    id: number;
    name: string;
}

interface Props {
    session: CashierSession | null;
    is_open: boolean;
    products: Product[];
    packUnitId: number | null;
    branches: Branch[];
}

export default function SessionPage({ session, is_open, products, packUnitId, branches }: Props) {
    const [startingCash, setStartingCash] = useState('100000');
    const [branchId, setBranchId] = useState('');
    const [actualEndingCash, setActualEndingCash] = useState('');
    const [packsInput, setPacksInput] = useState<Record<number, string>>(
        products.reduce((acc, p) => ({ ...acc, [p.id]: '0' }), {})
    );
    const [pcsInput, setPcsInput] = useState<Record<number, string>>(
        products.reduce((acc, p) => ({ ...acc, [p.id]: '0' }), {})
    );
    const [processing, setProcessing] = useState(false);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);
    };

    const handlePackChange = (productId: number, val: string) => {
        setPacksInput((prev) => ({
            ...prev,
            [productId]: val,
        }));
    };

    const handlePcsChange = (productId: number, val: string) => {
        setPcsInput((prev) => ({
            ...prev,
            [productId]: val,
        }));
    };

    const formatPacksAndPcs = (totalPcs: number, conversion: number, unitName: string) => {
        const packs = Math.floor(totalPcs / conversion);
        const pcs = totalPcs % conversion;
        const parts = [];
        if (packs > 0) parts.push(`${packs} pack`);
        if (pcs > 0 || parts.length === 0) parts.push(`${pcs} ${unitName}`);
        return parts.join(' ');
    };

    const handleOpenSession = (e: React.FormEvent) => {
        e.preventDefault();
        if (!branchId) {
            toast.error('Harap pilih cabang operasional terlebih dahulu.');
            return;
        }

        setProcessing(true);

        const items = Object.entries(packsInput).map(([prodId, val]) => ({
            product_id: Number(prodId),
            packs: Number(val || 0),
        }));

        router.post(
            '/cashier/session/open',
            {
                branch_id: Number(branchId),
                starting_cash: Number(startingCash),
                items: items,
            },
            {
                onSuccess: () => {
                    toast.success('Sesi kasir berhasil dibuka!');
                    setProcessing(false);
                },
                onError: (errors) => {
                    Object.values(errors).forEach((err: any) => toast.error(err));
                    setProcessing(false);
                },
            }
        );
    };

    const handleCloseSession = (e: React.FormEvent) => {
        e.preventDefault();
        if (!actualEndingCash) {
            toast.error('Harap masukkan nominal uang fisik akhir di laci.');
            return;
        }

        setProcessing(true);

        const items = spInputList();

        router.post(
            '/cashier/session/close',
            {
                actual_ending_cash: Number(actualEndingCash),
                items: items,
            },
            {
                onSuccess: () => {
                    toast.success('Sesi kasir berhasil ditutup.');
                    setProcessing(false);
                },
                onError: (errors) => {
                    Object.values(errors).forEach((err: any) => toast.error(err));
                    setProcessing(false);
                },
            }
        );
    };

    // Helper to map packs inputs during close session
    const spInputList = () => {
        if (!session) return [];
        return session.session_products.map((sp) => ({
            product_id: sp.product_id,
            packs: Number(packsInput[sp.product_id] || 0),
            pcs: Number(pcsInput[sp.product_id] || 0),
        }));
    };

    const breadcrumbs = [
        { title: 'POS Kasir', href: '/pos' },
        { title: is_open ? 'Tutup Kasir' : 'Buka Kasir', href: '/cashier/session' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={is_open ? 'Tutup Kasir' : 'Buka Kasir'} />

            <div className="mx-auto max-w-3xl p-6">
                {!is_open ? (
                    /* ====== BUKA KASIR FORM ====== */
                    <form onSubmit={handleOpenSession} className="space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Mulai Sesi Kasir (Shift Baru)</h1>
                            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                                Harap pilih cabang tempat Anda bertugas hari ini, masukkan modal awal, dan hitung stok barang bawaan.
                            </p>
                        </div>

                        {/* Pilih Cabang */}
                        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                                <MapPin className="h-6 w-6 text-zinc-500" />
                                <h3 className="text-lg font-semibold">Cabang Operasional</h3>
                            </div>
                            <div className="mt-4 space-y-2">
                                <Label htmlFor="branch_id">Pilih Cabang Bertugas</Label>
                                <Select
                                    value={branchId}
                                    onValueChange={setBranchId}
                                >
                                    <SelectTrigger id="branch_id" className="h-12 text-base font-semibold">
                                        <SelectValue placeholder="-- Pilih Cabang --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map((b) => (
                                            <SelectItem key={b.id} value={String(b.id)}>
                                                {b.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <span className="text-xs text-zinc-500 block">
                                    Pilih cabang yang akan Anda kelola transaksinya hari ini.
                                </span>
                            </div>
                        </div>

                        {/* Modal Uang Awal */}
                        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                                <Wallet className="h-6 w-6 text-zinc-500" />
                                <h3 className="text-lg font-semibold">Uang Modal Awal</h3>
                            </div>
                            <div className="mt-4 space-y-2">
                                <Label htmlFor="starting_cash">Nominal Modal Tunai (Rp)</Label>
                                <Input
                                    id="starting_cash"
                                    type="number"
                                    required
                                    min="0"
                                    value={startingCash}
                                    onChange={(e) => setStartingCash(e.target.value)}
                                    placeholder="Contoh: 100000"
                                    className="h-12 text-lg font-bold"
                                />
                                <span className="text-xs text-zinc-500">
                                    Uang kembalian yang ada di dalam laci kasir saat mulai buka.
                                </span>
                            </div>
                        </div>

                        {/* Modal Barang (Dimsum & Kemasan) */}
                        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                                <Package className="h-6 w-6 text-zinc-500" />
                                <h3 className="text-lg font-semibold">Stok Barang yang Bawa</h3>
                            </div>
                            <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
                                {products.map((p) => {
                                    // Custom input label based on product unit
                                    const isBottle = p.base_unit?.name?.toLowerCase() === 'botol';
                                    const isPcs = p.base_unit?.name?.toLowerCase() === 'pcs';
                                    let unitLabel = 'pack';
                                    if (isBottle) unitLabel = 'botol';
                                    else if (isPcs && p.name.toLowerCase().includes('box')) unitLabel = 'pack';

                                    return (
                                        <div key={p.id} className="flex items-center justify-between py-4">
                                            <div>
                                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{p.name}</span>
                                                <span className="ml-2 rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                                    Satuan Dasar: {p.base_unit?.name || 'pcs'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={packsInput[p.id] || '0'}
                                                    onChange={(e) => handlePackChange(p.id, e.target.value)}
                                                    className="w-24 text-center font-bold"
                                                />
                                                <span className="text-sm font-medium text-zinc-500 w-12">{unitLabel}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-12 w-full gap-2 rounded-xl bg-zinc-900 text-lg font-semibold text-white shadow-md hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                            <Play className="h-5 w-5 fill-current" />
                            {processing ? 'Membuka Sesi...' : 'Buka Kasir & Mulai Sesi'}
                        </Button>
                    </form>
                ) : (
                    /* ====== TUTUP KASIR FORM ====== */
                    <form onSubmit={handleCloseSession} className="space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">Tutup Kasir (Selesai Shift)</h1>
                            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                                Harap hitung uang fisik akhir di laci kasir dan sisa pack dimsum/barang bawaan untuk dicocokkan.
                            </p>
                        </div>

                        {/* Ringkasan Kas */}
                        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                                <Wallet className="h-6 w-6 text-zinc-500" />
                                <h3 className="text-lg font-semibold">Rekonsiliasi Uang Kas</h3>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/40">
                                <div>
                                    <span className="text-xs text-zinc-500">Modal Awal:</span>
                                    <p className="text-lg font-bold">{formatCurrency(session?.starting_cash || 0)}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-zinc-500">Ekspektasi Uang di Laci:</span>
                                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                        {formatCurrency(session?.expected_ending_cash || 0)}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 space-y-2">
                                <Label htmlFor="actual_ending_cash" className="text-base font-semibold">
                                    Total Uang Fisik Aktual di Laci (Rp)
                                </Label>
                                <Input
                                    id="actual_ending_cash"
                                    type="number"
                                    required
                                    min="0"
                                    value={actualEndingCash}
                                    onChange={(e) => setActualEndingCash(e.target.value)}
                                    placeholder="Masukkan uang fisik yang ada"
                                    className="h-12 text-lg font-bold border-rose-200 dark:border-rose-800 focus-visible:ring-rose-500"
                                />
                                <span className="text-xs text-zinc-500 block">
                                    Hitung manual semua uang cash kertas dan koin di laci Anda saat ini.
                                </span>
                            </div>
                        </div>

                        {/* Stok Barang Tersisa */}
                        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                                <Package className="h-6 w-6 text-zinc-500" />
                                <h3 className="text-lg font-semibold">Hitung Sisa Barang Fisik</h3>
                            </div>
                            <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
                                {session?.session_products.map((sp) => {
                                    // Hitung estimasi sisa pcs
                                    const expectedRemainingPcs = sp.starting_quantity - sp.sold_quantity;

                                    const conversionValue = sp.starting_packs > 0 
                                        ? Math.round(sp.starting_quantity / sp.starting_packs) 
                                        : 50; // default to 50 for dimsum

                                    const isBottle = sp.product.base_unit?.name?.toLowerCase() === 'botol';
                                    const isPcs = sp.product.base_unit?.name?.toLowerCase() === 'pcs';
                                    let unitLabel = 'pack';
                                    if (isBottle) unitLabel = 'botol';
                                    else if (isPcs && sp.product.name.toLowerCase().includes('box')) unitLabel = 'pack';

                                    const baseUnitName = sp.product.base_unit?.name || 'pcs';

                                    return (
                                        <div key={sp.id} className="py-4">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                        {sp.product.name}
                                                    </span>
                                                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                                                        <span>Bawa: {sp.starting_packs} {unitLabel} ({sp.starting_quantity} {baseUnitName})</span>
                                                        <span>Terjual: {sp.sold_quantity} {baseUnitName}</span>
                                                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                                            Ekspektasi Sisa: {formatPacksAndPcs(expectedRemainingPcs, conversionValue, baseUnitName)} ({expectedRemainingPcs} total {baseUnitName})
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {/* Packs Input */}
                                                    <div className="flex items-center gap-1">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={packsInput[sp.product_id] || '0'}
                                                            onChange={(e) => handlePackChange(sp.product_id, e.target.value)}
                                                            className="w-16 text-center font-bold"
                                                        />
                                                        <span className="text-xs font-medium text-zinc-500">{unitLabel}</span>
                                                    </div>

                                                    {/* Pcs Input */}
                                                    {conversionValue > 1 && (
                                                        <div className="flex items-center gap-1">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                value={pcsInput[sp.product_id] || '0'}
                                                                onChange={(e) => handlePcsChange(sp.product_id, e.target.value)}
                                                                className="w-16 text-center font-bold"
                                                            />
                                                            <span className="text-xs font-medium text-zinc-500">{baseUnitName}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 flex gap-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                            <p>
                                Pastikan sisa stok barang dan jumlah uang tunai yang diinput sudah benar. Sesi kasir akan dikunci dan Anda akan diarahkan ke Dashboard.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-12 w-full gap-2 rounded-xl bg-rose-600 text-lg font-semibold text-white shadow-md hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600"
                        >
                            <Power className="h-5 w-5" />
                            {processing ? 'Menutup Sesi...' : 'Tutup Kasir & Selesai Shift'}
                        </Button>
                    </form>
                )}
            </div>
        </AppLayout>
    );
}
