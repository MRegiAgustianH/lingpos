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
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import {
    ShoppingCart,
    MapPin,
    User,
    Search,
    Utensils,
    X,
    Plus,
    Minus,
    Banknote,
    Landmark,
    CheckCircle2,
    ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

interface UnitType {
    id: number;
    name: string;
}
interface Product {
    id: number;
    name: string;
    base_unit?: UnitType;
}
interface MenuItem {
    id: number;
    product_id: number;
    quantity: number;
    product: Product;
}
interface Category {
    id: number;
    name: string;
}
interface Menu {
    id: number;
    name: string;
    price: number;
    category_id: number;
    is_flexible: boolean;
    default_quantity: number;
    category?: Category;
    image_path?: string;
    menu_items?: MenuItem[];
}
interface InventoryMap {
    [key: number]: { stock: number };
}
interface CartDetail {
    product_id: number;
    product_name: string;
    quantity: number;
}
interface CartItem {
    menu: Menu;
    quantity: number;
    details: CartDetail[];
}

interface Props {
    menus: Menu[];
    categories: Category[];
    inventories: InventoryMap;
    branchId: number;
}

export default function PosPage({
    menus,
    categories,
    inventories,
    branchId,
}: Props) {
    const { auth } = usePage().props;
    const [cart, setCart] = useState<CartItem[]>([]);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<number | null>(null);
    const [flexibleOpen, setFlexibleOpen] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
    const [flexItems, setFlexItems] = useState<CartDetail[]>([]);
    const [payOpen, setPayOpen] = useState(false);
    const [payMethod, setPayMethod] = useState<'cash' | 'transfer'>('cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [cartOpen, setCartOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [successTrx, setSuccessTrx] = useState<{
        invoice_number: string;
        total: number;
        change: number;
    } | null>(null);

    const fmt = (val: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);

    const filteredMenus = useMemo(
        () =>
            menus.filter((m) => {
                const matchSearch = m.name
                    .toLowerCase()
                    .includes(search.toLowerCase());
                const matchCat = activeCategory
                    ? m.category_id === activeCategory
                    : true;
                return matchSearch && matchCat;
            }),
        [menus, search, activeCategory],
    );

    const total = useMemo(
        () => cart.reduce((acc, c) => acc + c.menu.price * c.quantity, 0),
        [cart],
    );
    const change = Math.max(0, Number(amountPaid || 0) - total);

    const addToCart = (menu: Menu) => {
        if (menu.is_flexible) {
            setSelectedMenu(menu);
            const defaultItems: CartDetail[] =
                menu.menu_items?.map((mi) => ({
                    product_id: mi.product_id,
                    product_name: mi.product.name,
                    quantity: mi.quantity,
                })) ?? [];
            setFlexItems(defaultItems.length > 0 ? defaultItems : []);
            setFlexibleOpen(true);
        } else {
            const details: CartDetail[] =
                menu.menu_items?.map((mi) => ({
                    product_id: mi.product_id,
                    product_name: mi.product.name,
                    quantity: mi.quantity,
                })) ?? [];
            // Check stock before adding to cart
            for (const detail of details) {
                const availableStock = getStock(detail.product_id);
                // Also account for existing items in cart that use this product
                const inCartQty = cart.reduce((sum, c) => {
                    const cDetail = c.details.find(
                        (d) => d.product_id === detail.product_id,
                    );
                    return sum + (cDetail ? cDetail.quantity * c.quantity : 0);
                }, 0);

                if (availableStock < inCartQty + detail.quantity) {
                    toast.error(
                        `Stok ${detail.product_name} tidak mencukupi (Tersedia: ${availableStock - inCartQty} lagi)`,
                    );
                    return;
                }
            }
            addItemToCart(menu, details);
        }
    };

    const addItemToCart = (menu: Menu, details: CartDetail[]) => {
        setCart((prev) => {
            const existing = prev.findIndex(
                (c) =>
                    c.menu.id === menu.id &&
                    JSON.stringify(c.details) === JSON.stringify(details),
            );
            if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = {
                    ...updated[existing],
                    quantity: updated[existing].quantity + 1,
                };
                return updated;
            }
            return [...prev, { menu, quantity: 1, details }];
        });
    };

    const confirmFlexible = () => {
        if (!selectedMenu) return;
        const totalSelected = flexItems.reduce((s, i) => s + i.quantity, 0);
        if (totalSelected !== selectedMenu.default_quantity) return;

        const details = flexItems.filter((i) => i.quantity > 0);

        // Validation check for flexible items
        for (const detail of details) {
            const availableStock = getStock(detail.product_id);
            const inCartQty = cart.reduce((sum, c) => {
                const cDetail = c.details.find(
                    (d) => d.product_id === detail.product_id,
                );
                return sum + (cDetail ? cDetail.quantity * c.quantity : 0);
            }, 0);

            if (availableStock < inCartQty + detail.quantity) {
                toast.error(
                    `Stok ${detail.product_name} tidak mencukupi (Sisa: ${availableStock - inCartQty})`,
                );
                return;
            }
        }

        addItemToCart(selectedMenu, details);
        setFlexibleOpen(false);
    };

    const updateQty = (idx: number, delta: number) => {
        setCart((prev) => {
            const updated = [...prev];
            const item = updated[idx];

            // if we are increasing, check stock
            if (delta > 0) {
                for (const detail of item.details) {
                    const availableStock = getStock(detail.product_id);
                    const inCartQty = prev.reduce((sum, c) => {
                        const cDetail = c.details.find(
                            (d) => d.product_id === detail.product_id,
                        );
                        return (
                            sum + (cDetail ? cDetail.quantity * c.quantity : 0)
                        );
                    }, 0);

                    // Add quantity for ONE more menu item
                    if (availableStock < inCartQty + detail.quantity) {
                        toast.error(
                            `Stok ${detail.product_name} tercapai maksimum (Sisa: ${availableStock - inCartQty})`,
                        );
                        return prev; // Do not update
                    }
                }
            }

            updated[idx] = {
                ...item,
                quantity: Math.max(1, item.quantity + delta),
            };
            return updated;
        });
    };

    const removeFromCart = (idx: number) =>
        setCart((prev) => prev.filter((_, i) => i !== idx));

    const handleCheckout = () => {
        if (Number(amountPaid) < total) return;
        setProcessing(true);
        router.post(
            '/pos/checkout',
            {
                items: cart.map((c) => ({
                    menu_id: c.menu.id,
                    quantity: c.quantity,
                    details: c.details,
                })),
                payment_method: payMethod,
                amount_paid: Number(amountPaid),
            } as any,
            {
                onSuccess: () => {
                    setSuccessTrx({
                        invoice_number: 'Generated',
                        total,
                        change,
                    });
                    setCart([]);
                    setPayOpen(false);
                    setAmountPaid('');
                    setProcessing(false);
                },
                onError: () => setProcessing(false),
            },
        );
    };

    const getStock = (productId: number) =>
        (inventories as any)?.[productId]?.stock ?? 0;

    // Available products for flexible selection
    const allProducts = useMemo(() => {
        const products: { id: number; name: string }[] = [];
        menus.forEach((m) =>
            m.menu_items?.forEach((mi) => {
                if (!products.find((p) => p.id === mi.product_id))
                    products.push({ id: mi.product_id, name: mi.product.name });
            }),
        );
        return products;
    }, [menus]);

    const flexTotal = flexItems.reduce((s, i) => s + i.quantity, 0);

    return (
        <>
            <Head title="POS Kasir" />
            <div className="flex h-screen flex-col bg-zinc-50 font-sans text-zinc-900 selection:bg-zinc-200 dark:bg-zinc-950 dark:text-zinc-100 dark:selection:bg-zinc-800">
                {/* Header */}
                <div className="z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.get('/dashboard')}
                            className="flex items-center gap-2 text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
                                <ShoppingCart className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                            </div>
                            <span className="text-xl font-semibold tracking-tight">
                                Kasir
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800/50">
                            <MapPin className="h-4 w-4 text-zinc-500" />
                            <span>{auth.user?.branch?.name ?? 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800/50">
                            <User className="h-4 w-4 text-zinc-500" />
                            <span>{auth.user?.name}</span>
                        </div>
                    </div>
                </div>

                <div className="relative flex flex-1 overflow-hidden">
                    {/* Menu Grid */}
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <div className="space-y-4 border-b border-zinc-200/50 bg-white p-6 dark:border-zinc-800/50 dark:bg-zinc-900">
                            <div className="relative max-w-xl">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Search className="h-4 w-4 text-zinc-400" />
                                </div>
                                <Input
                                    placeholder="Cari menu berdasarkan nama..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-11 border-zinc-200 bg-zinc-50 pl-10 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/50"
                                />
                            </div>
                            <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
                                <button
                                    onClick={() => setActiveCategory(null)}
                                    className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${!activeCategory ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
                                >
                                    Semua Kategori
                                </button>
                                {categories.map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => setActiveCategory(c.id)}
                                        className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === c.id ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-zinc-50 p-6 dark:bg-zinc-950">
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                {filteredMenus.map((menu) => {
                                    // Check if out of stock
                                    let isOutOfStock = false;
                                    if (!menu.is_flexible && menu.menu_items) {
                                        for (const mi of menu.menu_items) {
                                            const avail = getStock(
                                                mi.product_id,
                                            );
                                            const inCartQty = cart.reduce(
                                                (sum, c) => {
                                                    const cDetail =
                                                        c.details.find(
                                                            (d) =>
                                                                d.product_id ===
                                                                mi.product_id,
                                                        );
                                                    return (
                                                        sum +
                                                        (cDetail
                                                            ? cDetail.quantity *
                                                            c.quantity
                                                            : 0)
                                                    );
                                                },
                                                0,
                                            );
                                            if (
                                                avail <
                                                inCartQty + mi.quantity
                                            ) {
                                                isOutOfStock = true;
                                                break;
                                            }
                                        }
                                    }

                                    return (
                                        <button
                                            key={menu.id}
                                            disabled={
                                                isOutOfStock &&
                                                !menu.is_flexible
                                            }
                                            onClick={() => addToCart(menu)}
                                            className={`group relative flex h-full flex-col rounded-2xl border p-4 text-left transition-all duration-200 ${isOutOfStock &&
                                                    !menu.is_flexible
                                                    ? 'cursor-not-allowed border-zinc-200 bg-zinc-100/50 opacity-60 dark:border-zinc-800 dark:bg-zinc-900/50'
                                                    : 'border-zinc-200/80 bg-white hover:border-zinc-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600'
                                                }`}
                                        >
                                            {isOutOfStock &&
                                                !menu.is_flexible && (
                                                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded bg-zinc-900 px-2 py-1 text-[10px] font-bold tracking-wider text-white uppercase shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
                                                        Habis
                                                    </div>
                                                )}
                                            {menu.image_path ? (
                                                <div className="mb-4 aspect-square overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                                                    <img
                                                        src={`/storage/${menu.image_path}`}
                                                        alt={menu.name}
                                                        className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${isOutOfStock && !menu.is_flexible ? 'opacity-70 grayscale' : ''}`}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="mb-4 flex aspect-square items-center justify-center rounded-xl bg-zinc-100 transition-colors group-hover:bg-zinc-200 dark:bg-zinc-800/50 dark:group-hover:bg-zinc-800">
                                                    <Utensils className="h-8 w-8 text-zinc-400" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="line-clamp-2 text-sm leading-tight font-semibold text-zinc-900 dark:text-zinc-100">
                                                    {menu.name}
                                                </div>
                                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
                                                        {menu.default_quantity}{' '}
                                                        pcs
                                                    </span>
                                                    {menu.is_flexible && (
                                                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
                                                            Mix
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-4 text-[15px] font-bold text-zinc-900 dark:text-zinc-100">
                                                {fmt(menu.price)}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Cart Sidebar (desktop) */}
                    <div className="z-20 hidden w-[400px] flex-col border-l border-zinc-200 bg-white shadow-xl lg:flex dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between border-b border-zinc-200 p-5 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
                                    <ShoppingCart className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                                </div>
                                <h3 className="text-lg font-semibold">
                                    Pesanan Saat Ini
                                </h3>
                            </div>
                            <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                                {cart.length}
                            </span>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto bg-zinc-50/50 p-5 dark:bg-zinc-950/50">
                            {cart.length === 0 && (
                                <div className="flex h-full flex-col items-center justify-center space-y-4 text-zinc-400">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                                        <ShoppingCart className="h-8 w-8 opacity-50" />
                                    </div>
                                    <p className="font-medium">
                                        Belum ada pesanan
                                    </p>
                                </div>
                            )}
                            {cart.map((c, idx) => (
                                <div
                                    key={idx}
                                    className="group relative rounded-2xl border border-zinc-200 bg-white p-4 pr-10 shadow-sm transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                                >
                                    <div className="mb-3 flex items-start justify-between">
                                        <div className="pr-4">
                                            <div className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                                                {c.menu.name}
                                            </div>
                                            <div className="mt-1 space-y-0.5 text-xs text-zinc-500">
                                                {c.details.map((d, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center gap-1.5"
                                                    >
                                                        <div className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                                        <span>
                                                            {d.product_name}{' '}
                                                            <span className="text-zinc-400">
                                                                ×{d.quantity}
                                                            </span>
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(idx)}
                                        className="absolute top-3 right-3 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                                        title="Hapus"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                    <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800/80">
                                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                            {fmt(c.menu.price * c.quantity)}
                                        </div>
                                        <div className="flex items-center rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800">
                                            <button
                                                onClick={() =>
                                                    updateQty(idx, -1)
                                                }
                                                className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 transition-all hover:bg-white hover:text-zinc-900 hover:shadow-sm dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-white"
                                            >
                                                <Minus className="h-3.5 w-3.5" />
                                            </button>
                                            <span className="w-8 text-center text-sm font-semibold tabular-nums">
                                                {c.quantity}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    updateQty(idx, 1)
                                                }
                                                className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 transition-all hover:bg-white hover:text-zinc-900 hover:shadow-sm dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-white"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {cart.length > 0 && (
                            <div className="border-t border-zinc-200 bg-white p-5 pb-8 lg:pb-5 dark:border-zinc-800 dark:bg-zinc-900">
                                <div className="mb-6 flex items-end justify-between">
                                    <span className="font-medium text-zinc-500">
                                        Total Tagihan
                                    </span>
                                    <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                        {fmt(total)}
                                    </span>
                                </div>
                                <Button
                                    className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 text-lg font-semibold text-white shadow-lg shadow-zinc-900/10 transition-all hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                    onClick={() => {
                                        setAmountPaid('');
                                        setPayOpen(true);
                                    }}
                                >
                                    <Banknote className="h-5 w-5" />
                                    Lanjut Pembayaran
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Cart Bar */}
                {cart.length > 0 && (
                    <div className="fixed right-4 bottom-6 left-4 z-50 flex items-center justify-between rounded-2xl bg-zinc-900 p-4 text-white shadow-2xl ring-1 ring-zinc-800/5 lg:hidden dark:bg-zinc-800 dark:ring-white/10">
                        <button
                            onClick={() => setCartOpen(true)}
                            className="flex items-center gap-3 transition-transform active:scale-95"
                        >
                            <div className="relative">
                                <ShoppingCart className="h-6 w-6" />
                                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-zinc-900 shadow-sm">
                                    {cart.reduce((s, c) => s + c.quantity, 0)}
                                </span>
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-xs font-medium text-zinc-400">
                                    Total Belanja
                                </span>
                                <span className="font-bold whitespace-nowrap">
                                    {fmt(total)}
                                </span>
                            </div>
                        </button>
                        <Button
                            className="h-11 rounded-xl bg-white px-6 font-semibold text-zinc-900 shadow-sm transition-transform hover:bg-zinc-100 active:scale-95"
                            onClick={() => {
                                setAmountPaid('');
                                setPayOpen(true);
                            }}
                        >
                            Bayar
                        </Button>
                    </div>
                )}

                {/* Mobile Cart Dialog */}
                <Dialog open={cartOpen} onOpenChange={setCartOpen}>
                    <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden border-zinc-200 p-0 sm:rounded-2xl dark:border-zinc-800">
                        <DialogHeader className="border-b border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                            <DialogTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Pesanan Saat Ini ({cart.length})
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 space-y-4 overflow-y-auto bg-white p-5 dark:bg-zinc-950">
                            {cart.map((c, idx) => (
                                <div
                                    key={idx}
                                    className="relative rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30"
                                >
                                    <div className="mb-3 pr-10">
                                        <div className="font-semibold">
                                            {c.menu.name}
                                        </div>
                                        <div className="mt-1 text-xs text-zinc-500">
                                            {c.details.map((d, i) => (
                                                <span
                                                    key={i}
                                                    className="mr-2 inline-block"
                                                >
                                                    • {d.product_name} (×
                                                    {d.quantity})
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(idx)}
                                        className="absolute top-4 right-4 rounded-full bg-zinc-100 p-1 text-zinc-400 dark:bg-zinc-800"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="font-bold">
                                            {fmt(c.menu.price * c.quantity)}
                                        </div>
                                        <div className="flex items-center rounded-lg bg-zinc-200/50 p-1 dark:bg-zinc-800">
                                            <button
                                                onClick={() =>
                                                    updateQty(idx, -1)
                                                }
                                                className="flex h-8 w-8 items-center justify-center rounded-md bg-white shadow-sm dark:bg-zinc-700"
                                            >
                                                <Minus className="h-4 w-4" />
                                            </button>
                                            <span className="w-8 text-center font-medium">
                                                {c.quantity}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    updateQty(idx, 1)
                                                }
                                                className="flex h-8 w-8 items-center justify-center rounded-md bg-white shadow-sm dark:bg-zinc-700"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                            <div className="mb-4 flex items-center justify-between">
                                <span className="font-medium text-zinc-600 dark:text-zinc-400">
                                    Total
                                </span>
                                <span className="text-xl font-bold">
                                    {fmt(total)}
                                </span>
                            </div>
                            <Button
                                className="text-md h-12 w-full rounded-xl bg-zinc-900 font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                onClick={() => {
                                    setCartOpen(false);
                                    setAmountPaid('');
                                    setPayOpen(true);
                                }}
                            >
                                Lanjut Pembayaran
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Flexible Ingredient Picker */}
                <Dialog open={flexibleOpen} onOpenChange={setFlexibleOpen}>
                    <DialogContent className="gap-0 overflow-hidden rounded-2xl border-zinc-200 p-0 sm:max-w-md dark:border-zinc-800">
                        <DialogHeader className="border-b border-zinc-200 bg-zinc-50 p-6 pb-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                            <DialogTitle className="text-xl">
                                {selectedMenu?.name}
                            </DialogTitle>
                            <DialogDescription className="mt-1.5 flex items-center gap-2 text-sm">
                                <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200">
                                    Mix
                                </span>
                                Pilih {selectedMenu?.default_quantity}{' '}
                                varian/bahan
                            </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[60vh] flex-1 space-y-4 overflow-y-auto p-6">
                            {allProducts.map((p) => {
                                const existing = flexItems.find(
                                    (f) => f.product_id === p.id,
                                );
                                const qty = existing?.quantity ?? 0;
                                const stock = getStock(p.id);
                                const inCart = cart.reduce((sum, c) => {
                                    const cDetail = c.details.find(
                                        (d) => d.product_id === p.id,
                                    );
                                    return (
                                        sum +
                                        (cDetail
                                            ? cDetail.quantity * c.quantity
                                            : 0)
                                    );
                                }, 0);
                                const isDepleted =
                                    stock - inCart <= 0 && qty === 0;

                                return (
                                    <div
                                        key={p.id}
                                        className={`flex items-center justify-between rounded-xl border p-3 ${qty > 0 ? 'border-zinc-400 bg-zinc-50 dark:border-zinc-500 dark:bg-zinc-800/50' : 'border-zinc-200 dark:border-zinc-800'} transition-colors ${isDepleted ? 'opacity-50 grayscale' : ''}`}
                                    >
                                        <div>
                                            <div className="font-medium">
                                                {p.name}
                                            </div>
                                            <div className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
                                                <span>Stok:</span>
                                                <span
                                                    className={
                                                        stock - inCart <= 5
                                                            ? 'font-bold text-orange-500'
                                                            : ''
                                                    }
                                                >
                                                    {stock - inCart}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center rounded-lg border border-zinc-200/50 bg-zinc-100 p-0.5 dark:border-zinc-700/50 dark:bg-zinc-800">
                                            <button
                                                disabled={qty <= 0}
                                                onClick={() => {
                                                    if (qty <= 0) return;
                                                    setFlexItems((prev) =>
                                                        prev
                                                            .map((f) =>
                                                                f.product_id ===
                                                                    p.id
                                                                    ? {
                                                                        ...f,
                                                                        quantity:
                                                                            f.quantity -
                                                                            1,
                                                                    }
                                                                    : f,
                                                            )
                                                            .filter(
                                                                (f) =>
                                                                    f.quantity >
                                                                    0,
                                                            ),
                                                    );
                                                }}
                                                className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 shadow-sm transition-all hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent dark:text-zinc-400 dark:hover:bg-zinc-700"
                                            >
                                                <Minus className="h-3.5 w-3.5" />
                                            </button>
                                            <span className="w-8 text-center text-sm font-semibold tabular-nums">
                                                {qty}
                                            </span>
                                            <button
                                                disabled={
                                                    isDepleted ||
                                                    flexTotal >=
                                                    (selectedMenu?.default_quantity ??
                                                        0)
                                                }
                                                onClick={() => {
                                                    if (
                                                        flexTotal >=
                                                        (selectedMenu?.default_quantity ??
                                                            0)
                                                    )
                                                        return;
                                                    if (
                                                        stock <
                                                        inCart + qty + 1
                                                    ) {
                                                        toast.error(
                                                            `Stok ${p.name} tidak mencukupi`,
                                                        );
                                                        return;
                                                    }

                                                    setFlexItems((prev) => {
                                                        const ex = prev.find(
                                                            (f) =>
                                                                f.product_id ===
                                                                p.id,
                                                        );
                                                        if (ex)
                                                            return prev.map(
                                                                (f) =>
                                                                    f.product_id ===
                                                                        p.id
                                                                        ? {
                                                                            ...f,
                                                                            quantity:
                                                                                f.quantity +
                                                                                1,
                                                                        }
                                                                        : f,
                                                            );
                                                        return [
                                                            ...prev,
                                                            {
                                                                product_id:
                                                                    p.id,
                                                                product_name:
                                                                    p.name,
                                                                quantity: 1,
                                                            },
                                                        ];
                                                    });
                                                }}
                                                className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 shadow-sm transition-all hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent dark:text-zinc-400 dark:hover:bg-zinc-700"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex flex-col items-center justify-between gap-4 border-t border-zinc-200 bg-zinc-50 p-6 sm:flex-row dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-200/50 p-2 text-sm font-medium sm:w-auto dark:bg-zinc-800">
                                Terpilih:{' '}
                                <span className="ml-1 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                    {flexTotal}
                                </span>{' '}
                                / {selectedMenu?.default_quantity ?? 0}
                            </div>
                            <div className="flex w-full gap-3 sm:w-auto">
                                <DialogClose asChild>
                                    <Button
                                        variant="outline"
                                        className="h-11 flex-1 border-zinc-300 sm:flex-none dark:border-zinc-700"
                                    >
                                        Batal
                                    </Button>
                                </DialogClose>
                                <Button
                                    onClick={confirmFlexible}
                                    disabled={
                                        flexTotal !==
                                        (selectedMenu?.default_quantity ?? 0)
                                    }
                                    className="h-11 flex-1 bg-zinc-900 font-semibold text-white hover:bg-zinc-800 sm:flex-none dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                >
                                    Tambah
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Payment Dialog */}
                <Dialog open={payOpen} onOpenChange={setPayOpen}>
                    <DialogContent className="overflow-hidden rounded-2xl border-zinc-200 p-0 sm:max-w-md dark:border-zinc-800">
                        <DialogHeader className="border-b border-zinc-200 bg-zinc-50 p-6 pb-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <Banknote className="h-5 w-5 text-zinc-500" />
                                Pembayaran
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 p-6">
                            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-100 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                                <span className="text-sm font-medium text-zinc-500">
                                    Total Tagihan
                                </span>
                                <span className="text-2xl font-bold tracking-tight">
                                    {fmt(total)}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <Label className="font-medium text-zinc-500">
                                    Metode Pembayaran
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setPayMethod('cash')}
                                        className={`flex flex-col items-center justify-center rounded-xl border-2 py-4 transition-all ${payMethod === 'cash' ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800' : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'}`}
                                    >
                                        <Banknote
                                            className={`mb-2 h-6 w-6 ${payMethod === 'cash' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}`}
                                        />
                                        <span
                                            className={`font-semibold ${payMethod === 'cash' ? 'text-zinc-900 dark:text-zinc-100' : ''}`}
                                        >
                                            Tunai / Cash
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setPayMethod('transfer')}
                                        className={`flex flex-col items-center justify-center rounded-xl border-2 py-4 transition-all ${payMethod === 'transfer' ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800' : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'}`}
                                    >
                                        <Landmark
                                            className={`mb-2 h-6 w-6 ${payMethod === 'transfer' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}`}
                                        />
                                        <span
                                            className={`font-semibold ${payMethod === 'transfer' ? 'text-zinc-900 dark:text-zinc-100' : ''}`}
                                        >
                                            Transfer / QRIS
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="font-medium text-zinc-500">
                                    Jumlah Uang Diterima
                                </Label>
                                <Input
                                    type="number"
                                    value={amountPaid}
                                    onChange={(e) =>
                                        setAmountPaid(e.target.value)
                                    }
                                    className="h-14 border-zinc-200 bg-zinc-50 text-2xl font-bold placeholder:text-zinc-300 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
                                    placeholder="0"
                                    autoFocus
                                />
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() =>
                                            setAmountPaid(String(total))
                                        }
                                        className="flex-1 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
                                    >
                                        Uang Pas
                                    </button>
                                    {[50000, 100000, 150000, 200000].map(
                                        (v) => (
                                            <button
                                                key={v}
                                                onClick={() =>
                                                    setAmountPaid(String(v))
                                                }
                                                className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                                            >
                                                {fmt(v)}
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>

                            {Number(amountPaid) >= total &&
                                Number(amountPaid) > 0 && (
                                    <div className="flex animate-in items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-4 fade-in slide-in-from-bottom-2 dark:border-zinc-700 dark:bg-zinc-800/50">
                                        <span className="text-sm font-medium text-zinc-500">
                                            Kembalian
                                        </span>
                                        <span className="text-xl font-bold">
                                            {fmt(change)}
                                        </span>
                                    </div>
                                )}
                        </div>
                        <div className="flex gap-3 p-6 pt-0">
                            <DialogClose asChild>
                                <Button
                                    variant="outline"
                                    className="h-12 flex-1 border-zinc-300 font-semibold dark:border-zinc-700"
                                >
                                    Tutup
                                </Button>
                            </DialogClose>
                            <Button
                                onClick={handleCheckout}
                                disabled={
                                    processing || Number(amountPaid) < total
                                }
                                className="h-12 flex-[2] bg-zinc-900 text-base font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                            >
                                {processing
                                    ? 'Memproses...'
                                    : 'Selesaikan Transaksi'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Success Dialog */}
                <Dialog
                    open={!!successTrx}
                    onOpenChange={() => setSuccessTrx(null)}
                >
                    <DialogContent className="flex flex-col items-center rounded-2xl p-8 text-center sm:max-w-sm">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <CheckCircle2 className="h-10 w-10 text-zinc-900 dark:text-zinc-100" />
                        </div>
                        <h2 className="mb-2 text-2xl font-bold tracking-tight">
                            Transaksi Berhasil
                        </h2>
                        <div className="mb-8 space-y-1">
                            <p className="text-sm text-zinc-500">
                                Invoice: {successTrx?.invoice_number}
                            </p>
                            {successTrx && successTrx.change > 0 && (
                                <p className="mt-2 font-medium text-zinc-900 dark:text-zinc-100">
                                    Kembalian:{' '}
                                    <span className="font-bold">
                                        {fmt(successTrx.change)}
                                    </span>
                                </p>
                            )}
                        </div>
                        <Button
                            onClick={() => setSuccessTrx(null)}
                            className="h-12 w-full rounded-xl bg-zinc-900 font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                            Transkasi Baru
                        </Button>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
