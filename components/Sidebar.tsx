'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
    Link2,
    QrCode,
    BarChart3,
    Lightbulb,
    History,
    HelpCircle,
    LogOut,
    Settings,
    Zap,
    Sparkles,
    Shield
} from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    const menuItems = [
        { icon: Link2, label: 'Link', href: '/dashboard', color: 'text-blue-400' },
        { icon: QrCode, label: 'QR Code', href: '/qr-code', color: 'text-purple-400' },
        { icon: BarChart3, label: 'Analytics', href: '/analytics', color: 'text-green-400' },
        { icon: Lightbulb, label: 'Advance Tools', href: '/advance-tools', color: 'text-yellow-400' },
        { icon: History, label: 'History', href: '/history', color: 'text-orange-400' },
        { icon: HelpCircle, label: 'Help & FAQ', href: '/help', color: 'text-pink-400' },
    ];

    if ((session?.user as any)?.role === 'admin') {
        menuItems.push({ icon: Shield, label: 'Admin', href: '/admin', color: 'text-red-400' });
    }

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/' || pathname === '/dashboard';
        }
        return pathname?.startsWith(href);
    };

    return (
        <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen sticky top-0">
            {/* Logo */}
            <div className="p-6 border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                        <Link2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white">LinkHive</span>
                </div>
            </div>

            {/* User Profile */}
            <div className="p-4 border-b border-gray-800">
                <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                            {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {session?.user?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                            {session?.user?.email}
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Profile settings"
                        className="text-gray-400 hover:text-white"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main Menu */}
            <div className="flex-1 overflow-y-auto py-4">
                <div className="px-3 mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
                        Main Menu
                    </p>
                </div>
                <nav className="space-y-1 px-3">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                  ${active
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }
                `}
                            >
                                <Icon className={`w-5 h-5 ${active ? 'text-white' : item.color}`} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Quick/Advance Toggle */}
            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors">
                        <Zap className="w-4 h-4" />
                        <span className="text-sm font-medium">Quick</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-medium">Advance</span>
                    </button>
                    <button
                        type="button"
                        aria-label="Open help"
                        className="p-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700"
                    >
                        <HelpCircle className="w-4 h-4" />
                    </button>
                </div>

                {/* Logout */}
                <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">LogOut</span>
                </button>
            </div>
        </aside>
    );
}
