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
import { Switch } from '@/components/ui/switch';
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
import { CircleCheck, CircleX, Utensils } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Kelola Menu', href: '/menus' },
];

interface UnitType {
    id: number;
    name: string;
}
interface Category {
    id: number;
    name: string;
}
interface Product {
    id: number;
    name: string;
    base_unit?: UnitType;
}
interface MenuItemData {
    product_id: number;
    quantity: number;
}
interface MenuItem {
    id: number;
    product_id: number;
    quantity: number;
    product: Product;
}
interface Menu {
    id: number;
    name: string;
    price: number;
    category_id: number;
    is_flexible: boolean;
    default_quantity: number;
    image_path?: string;
    category?: Category;
    menu_items?: MenuItem[];
}
interface Props {
    menus: Menu[];
    categories: Category[];
    products: Product[];
}

export default function KelolaMenu({ menus, categories, products }: Props) {
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const { data, setData, post, put, processing, errors, reset } = useForm<{
        name: string;
        price: string;
        category_id: string;
        is_flexible: boolean;
        default_quantity: string;
        items: MenuItemData[];
        image: File | null;
        _method?: string;
    }>({
        name: '',
        price: '',
        category_id: '',
        is_flexible: false,
        default_quantity: '1',
        items: [],
        image: null,
    });

    const fmt = (val: number) => new Intl.NumberFormat('id-ID').format(val);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            post(`/menus/${editingId}`, {
                onSuccess: () => {
                    reset();
                    setEditingId(null);
                    setOpen(false);
                },
            });
        } else {
            post('/menus', {
                onSuccess: () => {
                    reset();
                    setOpen(false);
                },
            });
        }
    };

    const handleEdit = (m: Menu) => {
        setEditingId(m.id);
        setData({
            name: m.name,
            price: String(m.price),
            category_id: String(m.category_id || ''),
            is_flexible: m.is_flexible,
            default_quantity: String(m.default_quantity),
            items:
                m.menu_items?.map((mi) => ({
                    product_id: mi.product_id,
                    quantity: mi.quantity,
                })) || [],
            image: null,
            _method: 'put',
        });
        setOpen(true);
    };

    const handleAdd = () => {
        reset();
        setData('_method', undefined);
        setEditingId(null);
        setOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (deleteId) {
            router.delete(`/menus/${deleteId}`, {
                onSuccess: () => setDeleteId(null),
            });
        }
    };

    const addItem = () =>
        setData('items', [...data.items, { product_id: 0, quantity: 1 }]);
    const removeItem = (idx: number) =>
        setData(
            'items',
            data.items.filter((_, i) => i !== idx),
        );
    const updateItem = (
        idx: number,
        field: keyof MenuItemData,
        value: number,
    ) => {
        const updated = [...data.items];
        updated[idx] = { ...updated[idx], [field]: value };
        setData('items', updated);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Menu" />
            <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                <div className="space-y-6 p-6">
                    <Button onClick={handleAdd}>+ Tambah Menu</Button>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="w-16 p-3">Foto</th>
                                    <th className="p-3">Menu</th>
                                    <th className="p-3">Harga</th>
                                    <th className="p-3">Isi</th>
                                    <th className="p-3">Flexible</th>
                                    <th className="p-3">Komposisi</th>
                                    <th className="p-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {menus.map((m) => (
                                    <tr
                                        key={m.id}
                                        className="border-b hover:bg-muted/50"
                                    >
                                        <td className="p-3">
                                            {m.image_path ? (
                                                <img
                                                    src={`/storage/${m.image_path}`}
                                                    alt={m.name}
                                                    className="h-12 w-12 rounded-md object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                                    <Utensils className="h-6 w-6" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 font-medium">
                                            {m.name}
                                        </td>
                                        <td className="p-3">
                                            Rp {fmt(m.price)}
                                        </td>
                                        <td className="p-3">
                                            {m.default_quantity} pcs
                                        </td>
                                        <td className="p-3">
                                            {m.is_flexible ? (
                                                <span className="flex items-center gap-1 text-emerald-600">
                                                    <CircleCheck className="h-4 w-4" /> Ya
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <CircleX className="h-4 w-4" /> Tidak
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 text-xs text-muted-foreground">
                                            {m.menu_items
                                                ?.map(
                                                    (mi) =>
                                                        `${mi.product?.name}(${mi.quantity})`,
                                                )
                                                .join(' + ') || '-'}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        handleEdit(m)
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        handleDelete(m.id)
                                                    }
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? 'Edit Menu' : 'Tambah Menu'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingId
                                ? 'Edit data menu'
                                : 'Masukkan data menu baru'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Foto Menu</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    setData(
                                        'image',
                                        e.target.files?.[0] || null,
                                    )
                                }
                            />
                            {editingId && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                    Biarkan kosong jika tidak ingin mengubah
                                    foto.
                                </div>
                            )}
                            {errors.image && (
                                <p className="text-sm text-red-500">
                                    {errors.image}
                                </p>
                            )}
                        </div>
                        <div>
                            <Label>Nama Menu</Label>
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
                            <Label>Harga Jual</Label>
                            <Input
                                type="number"
                                value={data.price}
                                onChange={(e) =>
                                    setData('price', e.target.value)
                                }
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
                            <Label>Total Isi (pcs)</Label>
                            <Input
                                type="number"
                                value={data.default_quantity}
                                onChange={(e) =>
                                    setData('default_quantity', e.target.value)
                                }
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={data.is_flexible}
                                onCheckedChange={(v) =>
                                    setData('is_flexible', v)
                                }
                            />
                            <Label>Flexible (kasir bisa pilih komposisi)</Label>
                        </div>

                        {/* Komposisi default */}
                        <div>
                            <Label className="mb-2 block">
                                Komposisi Default (Resep)
                            </Label>
                            {data.items.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="mb-2 flex items-center gap-2"
                                >
                                    <Select
                                        value={String(item.product_id || '')}
                                        onValueChange={(v) =>
                                            updateItem(
                                                idx,
                                                'product_id',
                                                Number(v),
                                            )
                                        }
                                    >
                                        <SelectTrigger className="flex-1">
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
                                    <Input
                                        type="number"
                                        className="w-20"
                                        value={item.quantity}
                                        onChange={(e) =>
                                            updateItem(
                                                idx,
                                                'quantity',
                                                Number(e.target.value),
                                            )
                                        }
                                        min={1}
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removeItem(idx)}
                                    >
                                        ✕
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addItem}
                            >
                                + Tambah Bahan
                            </Button>
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
                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data menu tersebut secara permanen.
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
