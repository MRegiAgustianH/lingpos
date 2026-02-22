import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BoxIcon } from '@/components/ui/box-icon';
import { FormEventHandler } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Input Stok Harian', href: '/daily-restock' },
];

interface Product {
    id: number;
    name: string;
    description?: string;
    base_unit_id: number;
    base_unit: { id: number; name: string; symbol: string };
}

interface Inventory {
    id: number;
    branch_id: number;
    product_id: number;
    stock: number;
}

interface RestockItemData {
    product_id: number;
    stock: number;
}

interface Props {
    products: Product[];
    inventories: Record<string, Inventory>;
}

export default function DailyRestock({ products, inventories }: Props) {
    // Initialize form with existing stock (if any) or 0
    const initialItems: RestockItemData[] = products.map((product) => ({
        product_id: product.id,
        stock: inventories[product.id]?.stock || 0,
    }));

    const { data, setData, post, processing } = useForm({
        items: initialItems,
    });

    const handleStockChange = (productId: number, value: string) => {
        const numValue = value === '' ? 0 : parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0) return;

        setData(
            'items',
            data.items.map((item) =>
                item.product_id === productId
                    ? { ...item, stock: numValue }
                    : item,
            ),
        );
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/daily-restock', {
            onSuccess: () => toast.success('Stok hari ini berhasil disimpan!'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Input Stok Harian" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="mx-auto w-full max-w-2xl">
                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                        <div className="mb-6">
                            <h2 className="flex items-center gap-2 text-xl font-semibold">
                                <BoxIcon
                                    name="bx-box"
                                    className="text-emerald-600"
                                />
                                Stok Bawaan Hari Ini
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Masukkan jumlah stok fisik yang Anda bawa dari
                                gudang hari ini. Stok sebelumnya di sistem akan{' '}
                                <strong>diganti (overwrite)</strong> dengan
                                jumlah yang Anda ketik di bawah.
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            <div className="space-y-4">
                                {products.map((product) => {
                                    const itemData = data.items.find(
                                        (i) => i.product_id === product.id,
                                    ) || { stock: 0 };

                                    return (
                                        <div
                                            key={product.id}
                                            className="flex items-center justify-between rounded-lg border border-border bg-background p-3 transition-colors hover:border-emerald-500/50"
                                        >
                                            <div>
                                                <Label className="text-base">
                                                    {product.name}
                                                </Label>
                                                {product.description && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {product.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex w-32 items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={
                                                        itemData.stock === 0
                                                            ? ''
                                                            : itemData.stock
                                                    } // show placeholder if 0
                                                    placeholder="0"
                                                    onChange={(e) =>
                                                        handleStockChange(
                                                            product.id,
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="text-right font-mono text-lg focus-visible:ring-emerald-500"
                                                />
                                                <span className="w-8 text-sm font-medium text-muted-foreground">
                                                    {product.base_unit
                                                        ?.symbol || 'pcs'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-end border-t pt-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="min-w-32 bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                    {processing
                                        ? 'Menyimpan...'
                                        : 'Simpan Semua'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
