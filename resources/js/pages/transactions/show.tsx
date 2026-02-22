import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Transaksi', href: '/transactions' },
    { title: 'Detail', href: '#' },
];

interface Detail {
    id: number;
    product_name: string;
    quantity: number;
}
interface TransItem {
    id: number;
    menu_name: string;
    price: number;
    quantity: number;
    subtotal: number;
    transaction_item_details: Detail[];
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
    branch: { name: string };
    transaction_items: TransItem[];
}
interface Props {
    transaction: Transaction;
}

export default function TransactionShow({ transaction: t }: Props) {
    const fmt = (val: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Transaksi ${t.invoice_number}`} />
            <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                <div className="space-y-6 p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <div className="text-sm text-muted-foreground">
                                Invoice
                            </div>
                            <div className="font-mono text-xl font-bold">
                                {t.invoice_number}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                                {new Date(t.created_at).toLocaleString('id-ID')}
                            </div>
                            <div className="text-sm">
                                Kasir: {t.user?.name} | Cabang: {t.branch?.name}
                            </div>
                        </div>
                    </div>

                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="p-3">Menu</th>
                                <th className="p-3">Harga</th>
                                <th className="p-3">Qty</th>
                                <th className="p-3 text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {t.transaction_items.map((item) => (
                                <tr key={item.id} className="border-b">
                                    <td className="p-3">
                                        <div className="font-medium">
                                            {item.menu_name}
                                        </div>
                                        {item.transaction_item_details?.length >
                                            0 && (
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                └{' '}
                                                {item.transaction_item_details
                                                    .map(
                                                        (d) =>
                                                            `${d.product_name}(${d.quantity})`,
                                                    )
                                                    .join(', ')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3">{fmt(item.price)}</td>
                                    <td className="p-3">{item.quantity}</td>
                                    <td className="p-3 text-right font-medium">
                                        {fmt(item.subtotal)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex flex-col items-end gap-1">
                        <div className="text-lg font-bold">
                            Total: {fmt(t.total)}
                        </div>
                        <div className="text-sm">
                            Bayar ({t.payment_method.toUpperCase()}):{' '}
                            {fmt(t.amount_paid)}
                        </div>
                        <div className="text-sm text-emerald-600">
                            Kembalian: {fmt(t.change)}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
