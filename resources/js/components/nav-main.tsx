import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';
import { ChevronRight } from 'lucide-react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => {
        try {
            const saved = localStorage.getItem('sidebar-menu-state');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            // ignore
        }
        return {};
    });

    const [hoveredNav, setHoveredNav] = useState<string | null>(null);

    useEffect(() => {
        localStorage.setItem('sidebar-menu-state', JSON.stringify(openItems));
    }, [openItems]);

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu onMouseLeave={() => setHoveredNav(null)}>
                {items.map((item) => {
                    const hasItems = item.items && item.items.length > 0;
                    const isActive = hasItems
                        ? item.items!.some(subItem => isCurrentUrl(subItem.href))
                        : isCurrentUrl(item.href);
                    const isOpen = openItems[item.title] !== undefined ? openItems[item.title] : isActive;

                    const internalContent = (
                        <>
                            {/* Animated Background */}
                            {hoveredNav === item.title && (
                                <motion.div
                                    layoutId="nav-hover-bg"
                                    className="absolute inset-0 rounded-md bg-sidebar-accent z-0"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <div className="relative z-10 flex w-full items-center gap-2">
                                {item.icon && <item.icon />}
                                <span className="truncate">{item.title}</span>
                                {hasItems && (
                                    <ChevronRight
                                        className={`ml-auto transition-transform duration-300 group-data-[collapsible=icon]:hidden ${isOpen ? 'rotate-90' : ''}`}
                                    />
                                )}
                            </div>
                        </>
                    );

                    if (hasItems) {
                        return (
                            <Collapsible
                                key={item.title}
                                asChild
                                open={isOpen}
                                onOpenChange={(open) => setOpenItems(prev => ({ ...prev, [item.title]: open }))}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            tooltip={item.title}
                                            isActive={isActive}
                                            className="relative bg-transparent transition-colors hover:bg-transparent"
                                            onMouseEnter={() => setHoveredNav(item.title)}
                                        >
                                            {internalContent}
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>

                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <CollapsibleContent asChild forceMount>
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                                    className="overflow-hidden"
                                                >
                                                    <SidebarMenuSub>
                                                        {item.items!.map((subItem) => (
                                                            <SidebarMenuSubItem key={subItem.title}>
                                                                <SidebarMenuSubButton
                                                                    asChild
                                                                    isActive={isCurrentUrl(subItem.href)}
                                                                    className="transition-colors duration-200"
                                                                >
                                                                    <Link href={subItem.href}>
                                                                        <span className="truncate">{subItem.title}</span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        ))}
                                                    </SidebarMenuSub>
                                                </motion.div>
                                            </CollapsibleContent>
                                        )}
                                    </AnimatePresence>
                                </SidebarMenuItem>
                            </Collapsible>
                        );
                    }

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                tooltip={item.title}
                                isActive={isActive}
                                className="relative bg-transparent transition-colors hover:bg-transparent"
                                onMouseEnter={() => setHoveredNav(item.title)}
                            >
                                <Link href={item.href} prefetch className="w-full">
                                    {internalContent}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
