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
    { title: 'Kelola User', href: '/users' },
];

interface Branch {
    id: number;
    name: string;
}
interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    branch_id: number;
    branch?: Branch;
}
interface Props {
    users: User[];
    branches: Branch[];
}

export default function KelolaUser({ users, branches }: Props) {
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const { data, setData, post, put, processing, errors, reset } = useForm<{
        name: string;
        email: string;
        password: string;
        role: string;
        branch_id: string;
    }>({ name: '', email: '', password: '', role: 'kasir', branch_id: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            put(`/users/${editingId}`, {
                onSuccess: () => {
                    reset();
                    setEditingId(null);
                    setOpen(false);
                },
            });
        } else {
            post('/users', {
                onSuccess: () => {
                    reset();
                    setOpen(false);
                },
            });
        }
    };

    const handleEdit = (u: User) => {
        setEditingId(u.id);
        setData({
            name: u.name,
            email: u.email,
            password: '',
            role: u.role,
            branch_id: String(u.branch_id || ''),
        });
        setOpen(true);
    };
    const handleDelete = (id: number) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (deleteId) {
            router.delete(`/users/${deleteId}`, {
                onSuccess: () => setDeleteId(null),
            });
        }
    };

    const columns = [
        { header: 'Nama', accessor: 'name' as const },
        { header: 'Email', accessor: 'email' as const },
        {
            header: 'Role',
            accessor: 'role' as const,
            cell: (u: User) => (
                <span
                    className={`rounded px-2 py-1 text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'}`}
                >
                    {u.role.toUpperCase()}
                </span>
            ),
        },
        {
            header: 'Cabang',
            accessor: 'branch_id' as const,
            cell: (u: User) => u.branch?.name ?? '-',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola User" />
            <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                <div className="space-y-6 p-6">
                    <Button
                        onClick={() => {
                            reset();
                            setEditingId(null);
                            setOpen(true);
                        }}
                    >
                        + Tambah User
                    </Button>
                    <DataTable
                        columns={columns}
                        data={users}
                        renderAction={(u) => (
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleEdit(u)}>
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(u.id)}
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
                            {editingId ? 'Edit User' : 'Tambah User'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingId
                                ? 'Edit data user'
                                : 'Masukkan data user baru'}
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
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">
                                    {errors.email}
                                </p>
                            )}
                        </div>
                        {!editingId && (
                            <div>
                                <Label>Password</Label>
                                <Input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                />
                            </div>
                        )}
                        <div>
                            <Label>Role</Label>
                            <Select
                                value={data.role}
                                onValueChange={(v) => setData('role', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="kasir">Kasir</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>
                                Cabang{' '}
                                {data.role === 'admin' && (
                                    <span className="font-normal text-muted-foreground">
                                        (Opsional)
                                    </span>
                                )}
                            </Label>
                            <Select
                                value={data.branch_id || 'all'}
                                onValueChange={(v) =>
                                    setData('branch_id', v === 'all' ? '' : v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Cabang" />
                                </SelectTrigger>
                                <SelectContent>
                                    {data.role === 'admin' && (
                                        <SelectItem value="all">
                                            Semua Cabang / Pusat (Kosong)
                                        </SelectItem>
                                    )}
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
                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data user tersebut secara permanen.
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
