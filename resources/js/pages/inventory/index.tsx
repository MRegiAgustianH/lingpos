import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inventory', href: '/inventory' },
];

interface UnitType {
    id: number;
    name: string;
}
interface ProductUnitConv {
    id: number;
    unit_id: number;
    conversion_value: number;
    unit: UnitType;
}
interface Product {
    id: number;
    name: string;
    base_unit?: UnitType;
    product_units?: ProductUnitConv[];
}
interface Branch {
    id: number;
    name: string;
}
interface InventoryItem {
    id: number;
    branch_id: number;
    product_id: number;
    stock: number;
    product: Product;
    branch: Branch;
}
interface Props {
    inventories: InventoryItem[];
    branches: Branch[];
    products: Product[];
    currentBranchId: number;
}

export default function InventoryPage({
    inventories,
    branches,
    products,
    currentBranchId,
}: Props) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset } = useForm<{
        branch_id: string;
        product_id: string;
        quantity: string;
        unit_id: string;
        type: string;
    }>({
        branch_id: String(currentBranchId),
        product_id: '',
        quantity: '',
        unit_id: '',
        type: 'in',
    });

    const fmt = (val: number) => new Intl.NumberFormat('id-ID').format(val);

    const getConversion = (item: InventoryItem) => {
        if (
            !item.product?.product_units ||
            item.product.product_units.length === 0
        )
            return '';
        return item.product.product_units
            .map(
                (pu) =>
                    `${(item.stock / pu.conversion_value).toFixed(1)} ${pu.unit.name}`,
            )
            .join(', ');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inventory/adjust', {
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    };

    const selectedProduct = products.find(
        (p) => p.id === Number(data.product_id),
    );
    const selectedUnit = selectedProduct?.product_units?.find(
        (pu) => pu.unit_id === Number(data.unit_id),
    );
    const convertedQty = selectedUnit
        ? Number(data.quantity || 0) * selectedUnit.conversion_value
        : Number(data.quantity || 0);

    // Watch for product_id changes to reset unit_id reliably
    const handleProductChange = (v: string) => {
        setData((prev) => ({ ...prev, product_id: v, unit_id: '' }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory" />
            <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                <div className="space-y-4 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Label>Cabang:</Label>
                            <Select
                                value={String(currentBranchId)}
                                onValueChange={(v) =>
                                    router.get('/inventory', { branch_id: v })
                                }
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
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
                        <Button
                            onClick={() => {
                                setData('branch_id', String(currentBranchId));
                                setOpen(true);
                            }}
                        >
                            + Stok Masuk
                        </Button>
                    </div>

                    {/* Inventory Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="p-3">Bahan</th>
                                    <th className="p-3">Satuan</th>
                                    <th className="p-3">Stok</th>
                                    <th className="p-3">Konversi</th>
                                    <th className="p-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventories.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-b hover:bg-muted/50"
                                    >
                                        <td className="p-3 font-medium">
                                            {item.product?.name}
                                        </td>
                                        <td className="p-3">
                                            {item.product?.base_unit?.name ??
                                                'pcs'}
                                        </td>
                                        <td
                                            className={`p-3 font-bold ${item.stock < 10 ? 'text-amber-600' : 'text-emerald-600'}`}
                                        >
                                            {item.stock < 10 && '⚠️ '}
                                            {fmt(item.stock)}
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            {getConversion(item)}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setData({
                                                            branch_id: String(
                                                                item.branch_id,
                                                            ),
                                                            product_id: String(
                                                                item.product_id,
                                                            ),
                                                            quantity: '',
                                                            unit_id: '',
                                                            type: 'in',
                                                        });
                                                        setOpen(true);
                                                    }}
                                                >
                                                    +
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setData({
                                                            branch_id: String(
                                                                item.branch_id,
                                                            ),
                                                            product_id: String(
                                                                item.product_id,
                                                            ),
                                                            quantity: '',
                                                            unit_id: '',
                                                            type: 'out',
                                                        });
                                                        setOpen(true);
                                                    }}
                                                >
                                                    -
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {inventories.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="p-6 text-center text-muted-foreground"
                                        >
                                            Belum ada data inventory
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {data.type === 'in'
                                ? '📥 Stok Masuk'
                                : '📤 Stok Keluar'}
                        </DialogTitle>
                        <DialogDescription>
                            Adjustment stok bahan
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Bahan</Label>
                            <Select
                                value={data.product_id}
                                onValueChange={handleProductChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Bahan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((p) => (
                                        <SelectItem
                                            key={p.id}
                                            value={String(p.id)}
                                        >
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Jumlah & Satuan</Label>
                            <div className="mt-1 flex gap-2">
                                <Input
                                    type="number"
                                    className="flex-1"
                                    value={data.quantity}
                                    onChange={(e) =>
                                        setData('quantity', e.target.value)
                                    }
                                    placeholder="0"
                                />
                                {selectedProduct && (
                                    <Select
                                        value={data.unit_id}
                                        onValueChange={(v) =>
                                            setData('unit_id', v)
                                        }
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="Satuan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                {selectedProduct.base_unit
                                                    ?.name ?? 'Dasar'}
                                            </SelectItem>
                                            {selectedProduct.product_units?.map(
                                                (pu) => (
                                                    <SelectItem
                                                        key={pu.id}
                                                        value={String(
                                                            pu.unit_id,
                                                        )}
                                                    >
                                                        {pu.unit.name}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>
                        {selectedUnit && (
                            <p className="text-sm font-semibold text-emerald-600">
                                = Setara dengan {fmt(convertedQty)}{' '}
                                {selectedProduct?.base_unit?.name ?? 'pcs'}
                            </p>
                        )}
                    </form>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Batal</Button>
                        </DialogClose>
                        <Button onClick={handleSubmit} disabled={processing}>
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
