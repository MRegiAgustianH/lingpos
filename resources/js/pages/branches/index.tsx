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
    { title: 'Kelola Cabang', href: '/branches' },
];

interface Branch {
    id: number;
    name: string;
    address: string;
    phone: string;
}
interface Props {
    branches: Branch[];
}

export default function KelolaCabang({ branches }: Props) {
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        address: '',
        phone: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            put(`/branches/${editingId}`, {
                onSuccess: () => {
                    reset();
                    setEditingId(null);
                    setOpen(false);
                },
            });
        } else {
            post('/branches', {
                onSuccess: () => {
                    reset();
                    setOpen(false);
                },
            });
        }
    };

    const handleEdit = (b: Branch) => {
        setEditingId(b.id);
        setData({
            name: b.name,
            address: b.address || '',
            phone: b.phone || '',
        });
        setOpen(true);
    };
    const handleDelete = (id: number) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (deleteId) {
            router.delete(`/branches/${deleteId}`, {
                onSuccess: () => setDeleteId(null),
            });
        }
    };

    const columns = [
        { header: 'Nama', accessor: 'name' as const },
        { header: 'Alamat', accessor: 'address' as const },
        { header: 'Telepon', accessor: 'phone' as const },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Cabang" />
            <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                <div className="space-y-6 p-6">
                    <Button
                        onClick={() => {
                            reset();
                            setEditingId(null);
                            setOpen(true);
                        }}
                    >
                        + Tambah Cabang
                    </Button>
                    <DataTable
                        columns={columns}
                        data={branches}
                        renderAction={(b) => (
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleEdit(b)}>
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(b.id)}
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
                            {editingId ? 'Edit Cabang' : 'Tambah Cabang'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingId
                                ? 'Edit data cabang'
                                : 'Masukkan data cabang baru'}
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
                            <Label>Alamat</Label>
                            <Input
                                value={data.address}
                                onChange={(e) =>
                                    setData('address', e.target.value)
                                }
                            />
                        </div>
                        <div>
                            <Label>Telepon</Label>
                            <Input
                                value={data.phone}
                                onChange={(e) =>
                                    setData('phone', e.target.value)
                                }
                            />
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
                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data cabang tersebut secara permanen.
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
