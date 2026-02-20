import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ClipboardCheck,
  FileCheck,
  Settings,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user, role } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ['admin', 'employee'] },
    { name: "Produtos", href: "/produtos", icon: Package, roles: ['admin', 'employee'] },
    { name: "Entradas", href: "/entradas", icon: ArrowDownToLine, roles: ['admin', 'employee'] },
    { name: "Contagem", href: "/contagem", icon: ClipboardCheck, roles: ['admin', 'employee'] },
    { name: "Aprovação", href: "/aprovacao", icon: FileCheck, roles: ['admin'] },
    { name: "Processamento", href: "/processamento", icon: Settings, roles: ['admin'] },
    { name: "Lista de Compras", href: "/relatorios/compras", icon: ShoppingCart, roles: ['admin'] },
    { name: "Usuários", href: "/usuarios", icon: Users, roles: ['admin'] }, // Using Users icon which matches imports? Need to check imports
  ];

  const filteredNavigation = navigation.filter(item =>
    role && item.roles.includes(role)
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-200 md:sticky md:top-0 md:h-screen md:overflow-y-auto",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
          <span className="text-xl font-bold text-brand-brown">Santo Favo</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col gap-1 p-4">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => onClose()} // Close sidebar on mobile nav
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-brand-yellow/10 text-brand-brown"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-brand-brown" : "text-gray-400",
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-brand-brown flex items-center justify-center text-white text-xs">
              {user?.email?.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email}
              </p>
              <p className="text-xs text-gray-500">Usuário</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
