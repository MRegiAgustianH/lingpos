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
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Produk (Bahan)', href: '/products' },
];

interface UnitType {
    id: number;
    name: string;
}
interface Category {
    id: number;
    name: string;
}
interface Branch {
    id: number;
    name: string;
}
interface ProductUnit {
    id?: number;
    unit_id: number;
    conversion_value: number;
    unit?: UnitType;
}
interface Product {
    id: number;
    name: string;
    price: number;
    sku: string;
    category_id: number;
    branch_id: number;
    base_unit_id: number;
    category?: Category;
    branch?: Branch;
    base_unit?: UnitType;
    product_units?: ProductUnit[];
}
interface Props {
    products: Product[];
    categories: Category[];
    branches: Branch[];
    units: UnitType[];
}

export default function KelolaProduk({
    products,
    categories,
    branches,
    units,
}: Props) {
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const { data, setData, post, put, processing, errors, reset } = useForm<{
        name: string;
        price: string;
        sku: string;
        category_id: string;
        branch_id: string;
        base_unit_id: string;
        product_units: { unit_id: string; conversion_value: string }[];
    }>({
        name: '',
        price: '',
        sku: '',
        category_id: '',
        branch_id: '',
        base_unit_id: '',
        product_units: [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            put(`/products/${editingId}`, {
                onSuccess: () => {
                    reset();
                    setEditingId(null);
                    setOpen(false);
                },
            });
        } else {
            post('/products', {
                onSuccess: () => {
                    reset();
                    setOpen(false);
                },
            });
        }
    };

    const handleEdit = (p: Product) => {
        setEditingId(p.id);
        setData({
            name: p.name,
            price: String(p.price),
            sku: p.sku || '',
            category_id: String(p.category_id || ''),
            branch_id: String(p.branch_id || ''),
            base_unit_id: String(p.base_unit_id || ''),
            product_units:
                p.product_units?.map((u) => ({
                    unit_id: String(u.unit_id),
                    conversion_value: String(u.conversion_value),
                })) || [],
        });
        setOpen(true);
    };
    const handleDelete = (id: number) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (deleteId) {
            router.delete(`/products/${deleteId}`, {
                onSuccess: () => setDeleteId(null),
            });
        }
    };

    const fmt = (val: number) => new Intl.NumberFormat('id-ID').format(val);

    const columns = [
        { header: 'Nama', accessor: 'name' as const },
        { header: 'SKU', accessor: 'sku' as const },
        {
            header: 'Harga',
            accessor: 'price' as const,
            cell: (p: Product) => `Rp ${fmt(p.price)}`,
        },
        {
            header: 'Kategori',
            accessor: 'category_id' as const,
            cell: (p: Product) => p.category?.name ?? '-',
        },
        {
            header: 'Satuan & Konversi',
            accessor: 'base_unit_id' as const,
            cell: (p: Product) => (
                <div className="flex flex-col gap-0.5 text-xs">
                    <div>
                        <span className="font-semibold">Dasar:</span>{' '}
                        {p.base_unit?.name ?? '-'}
                    </div>
                    {p.product_units && p.product_units.length > 0 && (
                        <div className="mt-0.5 text-muted-foreground">
                            {' '}
                            {p.product_units
                                .map(
                                    (u) =>
                                        `${u.unit?.name ?? ''} (${u.conversion_value})`,
                                )
                                .join(', ')}{' '}
                        </div>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Produk (Bahan)" />
            <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                <div className="space-y-6 p-6">
                    <Button
                        onClick={() => {
                            reset();
                            setEditingId(null);
                            setOpen(true);
                        }}
                    >
                        + Tambah Bahan
                    </Button>
                    <DataTable
                        columns={columns}
                        data={products}
                        renderAction={(p) => (
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleEdit(p)}>
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(p.id)}
                                >
                                    Hapus
                                </Button>
                            </div>
                        )}
                    />
                </div>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? 'Edit Bahan' : 'Tambah Bahan'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingId
                                ? 'Edit data bahan dasar'
                                : 'Masukkan data bahan baru'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Nama</Label>
                            <Input
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                        <div>
                            <Label>Harga Satuan</Label>
                            <Input
                                type="number"
                                value={data.price}
                                onChange={(e) =>
                                    setData('price', e.target.value)
                                }
                            />
                        </div>
                        <div>
                            <Label>SKU</Label>
                            <Input
                                value={data.sku}
                                onChange={(e) => setData('sku', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Kategori</Label>
                            <Select
                                value={data.category_id}
                                onValueChange={(v) => setData('category_id', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((c) => (
                                        <SelectItem
                                            key={c.id}
                                            value={String(c.id)}
                                        >
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Satuan Dasar</Label>
                            <Select
                                value={data.base_unit_id}
                                onValueChange={(v) =>
                                    setData('base_unit_id', v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Satuan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {units.map((u) => (
                                        <SelectItem
                                            key={u.id}
                                            value={String(u.id)}
                                        >
                                            {u.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="mt-4 space-y-3 border-t pt-4">
                            <div className="mb-2 flex items-center justify-between">
                                <Label>Satuan Turunan & Konversi</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setData('product_units', [
                                            ...data.product_units,
                                            {
                                                unit_id: '',
                                                conversion_value: '',
                                            },
                                        ])
                                    }
                                >
                                    + Tambah Konversi
                                </Button>
                            </div>
                            {data.product_units.map((u, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2"
                                >
                                    <div className="flex-1">
                                        <Select
                                            value={u.unit_id}
                                            onValueChange={(v) => {
                                                const newU = [
                                                    ...data.product_units,
                                                ];
                                                newU[i].unit_id = v;
                                                setData('product_units', newU);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Satuan Baru" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {units
                                                    .filter(
                                                        (unt) =>
                                                            String(unt.id) !==
                                                            data.base_unit_id,
                                                    )
                                                    .map((unt) => (
                                                        <SelectItem
                                                            key={unt.id}
                                                            value={String(
                                                                unt.id,
                                                            )}
                                                        >
                                                            {unt.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <span className="text-sm font-bold text-muted-foreground">
                                        =
                                    </span>
                                    <div className="flex flex-1 items-center gap-2">
                                        <Input
                                            type="number"
                                            placeholder="Jml Base"
                                            value={u.conversion_value}
                                            onChange={(e) => {
                                                const newU = [
                                                    ...data.product_units,
                                                ];
                                                newU[i].conversion_value =
                                                    e.target.value;
                                                setData('product_units', newU);
                                            }}
                                        />
                                        <span className="w-12 truncate text-xs text-muted-foreground">
                                            {units.find(
                                                (unt) =>
                                                    String(unt.id) ===
                                                    data.base_unit_id,
                                            )?.name || 'Dasar'}
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                            const newU = [
                                                ...data.product_units,
                                            ];
                                            newU.splice(i, 1);
                                            setData('product_units', newU);
                                        }}
                                    >
                                        ✕
                                    </Button>
                                </div>
                            ))}
                        </div>
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
            <AlertDialog open={!!deleteId} onOpenChange={(isOpen) => !isOpen && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data produk bahan tersebut secara permanen.
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
