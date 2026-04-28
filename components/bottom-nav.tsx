'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '@/lib/store';

const tabs = [
  { href: '/feed', icon: Home, label: 'Feed' },
  { href: '/search', icon: Search, label: 'Ara' },
  { href: '/cart', icon: ShoppingCart, label: 'Sepet' },
  { href: '/profile', icon: User, label: 'Profil' }
];

export function BottomNav(): JSX.Element {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md border-t border-zinc-200 bg-white">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative flex flex-1 flex-col items-center py-3 text-xs ${active ? 'text-brand' : 'text-zinc-500'}`}
          >
            <Icon className="h-5 w-5" />
            <span className="mt-1">{tab.label}</span>
            {tab.href === '/cart' && itemCount > 0 ? (
              <span className="absolute right-6 top-2 rounded-full bg-accent px-1.5 text-[10px] text-white">{itemCount}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
