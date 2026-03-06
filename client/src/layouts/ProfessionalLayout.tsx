'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Users, Settings, MessageSquare, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import FeedbackWidget from '@/features/feedback/components/FeedbackWidget';
import MobileNavbar from './components/MobileNavbar';
import BottomSheetTurno from '@/features/agenda/components/Mobile/BottomSheetTurno';

const navItems = [
    { href: '/dashboard', label: 'Agenda', icon: Calendar },
    { href: '/patients', label: 'Pacientes', icon: Users },
    { href: '/settings', label: 'Configuración', icon: Settings },
    { href: '/feedback', label: 'Feedback', icon: MessageSquare },
];

export default function ProfessionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobileNewTurnoOpen, setIsMobileNewTurnoOpen] = useState(false);
    const user = useAuthStore((s) => s.user);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'x-csrf-protection': '1' },
            });
        } catch { /* ignore */ }
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
            {/* Desktop Sidebar (Hidden on Mobile) */}
            <aside className={`
                hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
                flex-col h-full
            `}>
                <div className="flex flex-col h-full">
                    {/* Logo / Brand */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">PS</span>
                            </div>
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">PsicoSaaS</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                        ${isActive
                                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                                        }
                                    `}
                                >
                                    <Icon size={20} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Section */}
                    <div className="border-t border-gray-200 dark:border-gray-800 p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                                {user?.profile?.firstName?.[0] || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {user?.profile?.firstName} {user?.profile?.lastName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {user?.email || 'Profesional'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <LogOut size={16} />
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content (Shifted on Desktop, Full on Mobile) */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-64 relative pb-16 lg:pb-0">
                {/* Top Bar (mobile) */}
                <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-xs">PS</span>
                        </div>
                        <span className="text-base font-semibold text-gray-900 dark:text-white">PsicoSaaS</span>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>

                <MobileNavbar onNewTurno={() => setIsMobileNewTurnoOpen(true)} />
            </div>

            {/* Global Modals & Widgets */}
            <FeedbackWidget />
            <BottomSheetTurno
                open={isMobileNewTurnoOpen}
                onOpenChange={setIsMobileNewTurnoOpen}
                onConfirm={async (data) => {
                    console.log('Mobile Turno Data:', data);
                    // TODO: call actual create appointment hook
                }}
            />
        </div>
    );
}
