import { Link, usePage } from '@inertiajs/react';
import { BoxIcon } from '@/components/ui/box-icon';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { Label } from './ui/label';
import { Activity } from 'react';

export function AppSidebar() {
    const { auth } = usePage().props;
    const isAdmin = auth.user?.role === 'admin';

    const adminNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: (props) => <BoxIcon name="bx-grid-alt" {...props} />,
        },
        {
            title: 'Master Data',
            href: '#',
            icon: (props) => <BoxIcon name="bx-data" {...props} />,
            items: [
                { title: 'Toko & Cabang', href: '/branches' },
                { title: 'Karyawan', href: '/users' },
                { title: 'Bahan Baku', href: '/products' },
                { title: 'Kategori Produk', href: '/categories' },
                { title: 'Satuan Unit', href: '/units' },
            ],
        },
        {
            title: 'Inventory & Menu',
            href: '#',
            icon: (props) => <BoxIcon name="bx-food-menu" {...props} />,
            items: [
                { title: 'Daftar Menu', href: '/menus' },
                { title: 'Stok Bahan', href: '/inventory' },
            ],
        },
        {
            title: 'Kasir & Keuangan',
            href: '#',
            icon: (props) => <BoxIcon name="bx-receipt" {...props} />,
            items: [
                { title: 'Riwayat Transaksi', href: '/transactions' },
                { title: 'Arus Kas', href: '/cash-flows' },
            ],
        },
    ];

    const kasirNavItems: NavItem[] = [
        {
            title: 'Aktivitas Kasir',
            href: '#',
            icon: (props) => <BoxIcon name="bx-cart" {...props} />,
            items: [
                { title: 'Input Stok Harian', href: '/daily-restock' },
                { title: 'POS Kasir', href: '/pos' },
            ],
        },
    ];

    const mainNavItems = isAdmin ? adminNavItems : kasirNavItems;

    const footerNavItems: NavItem[] = [
        // {
        //     title: 'Repository',
        //     href: 'https://github.com/laravel/react-starter-kit',
        //     icon: (props) => <BoxIcon name="bx-folder" {...props} />,
        // },
        // {
        //     title: 'Documentation',
        //     href: 'https://laravel.com/docs/starter-kits#react',
        //     icon: (props) => <BoxIcon name="bx-book-open" {...props} />,
        // },
    ];

    

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
