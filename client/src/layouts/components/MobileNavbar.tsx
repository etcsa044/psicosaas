'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Users, Settings, Plus } from 'lucide-react';

const mobileNavItems = [
    { href: '/dashboard', label: 'Agenda', icon: Calendar },
    { href: '/patients', label: 'Pacientes', icon: Users },
    // Center button serves as a spacer for the '+' FAB
    { href: '/settings', label: 'Ajustes', icon: Settings },
];

interface MobileNavbarProps {
    onNewTurno?: () => void;
}

export default function MobileNavbar({ onNewTurno }: MobileNavbarProps) {
    const pathname = usePathname();

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe">
            <nav className="flex items-center justify-around px-2 h-16">

                <Link
                    href="/dashboard"
                    className={`flex flex-col items-center justify-center flex-1 h-full gap-1 ${pathname.startsWith('/dashboard')
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                >
                    <Calendar size={22} className={pathname.startsWith('/dashboard') ? 'fill-indigo-100 dark:fill-indigo-900/30' : ''} />
                    <span className="text-[10px] font-medium">Agenda</span>
                </Link>

                <Link
                    href="/patients"
                    className={`flex flex-col items-center justify-center flex-1 h-full gap-1 ${pathname.startsWith('/patients')
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                >
                    <Users size={22} className={pathname.startsWith('/patients') ? 'fill-indigo-100 dark:fill-indigo-900/30' : ''} />
                    <span className="text-[10px] font-medium">Pacientes</span>
                </Link>

                {/* FAB Container (Center) */}
                <div className="flex-1 flex justify-center -mt-6">
                    <button
                        onClick={onNewTurno}
                        className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center transition-transform active:scale-95 border-4 border-white dark:border-gray-900"
                        aria-label="Nuevo Turno"
                    >
                        <Plus size={28} strokeWidth={2.5} />
                    </button>
                </div>

                <Link
                    href="/settings"
                    className={`flex flex-col items-center justify-center flex-1 h-full gap-1 ${pathname.startsWith('/settings')
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                >
                    <Settings size={22} className={pathname.startsWith('/settings') ? 'fill-indigo-100 dark:fill-indigo-900/30' : ''} />
                    <span className="text-[10px] font-medium">Ajustes</span>
                </Link>
            </nav>
        </div>
    );
}
