import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, History, ShieldAlert, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

const Layout = ({ children }) => {
    const location = useLocation();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: History, label: 'History', path: '/history' },
        { icon: ShieldAlert, label: 'Blacklist', path: '/blacklist' },
    ];

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-card hidden md:flex flex-col">
                <div className="p-6 flex items-center gap-2 border-b">
                    <Camera className="h-6 w-6 text-primary" />
                    <h1 className="font-bold text-xl">ANPR System</h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t text-xs text-muted-foreground text-center">
                    v1.0.0 • ANPR Dashboard
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 border-b bg-card flex items-center px-6 md:hidden">
                    <Camera className="h-6 w-6 text-primary mr-2" />
                    <h1 className="font-bold text-lg">ANPR System</h1>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
