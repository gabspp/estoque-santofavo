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
    { name: "Usuários", href: "/usuarios", icon: Users, roles: ['admin'] },
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
          "fixed inset-y-0 left-0 z-50 w-64 bg-bg border-r border-rule-soft transition-transform duration-200 md:sticky md:top-0 md:h-screen md:overflow-y-auto flex flex-col justify-between shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div>
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-rule-soft">
            <span className="font-serif text-xl font-semibold tracking-tight text-ink">Santo Favo</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="md:hidden text-ink-soft hover:bg-bg-hover"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-1 p-4">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => onClose()}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors select-none",
                    isActive
                      ? "bg-bg-soft text-ink font-bold border border-rule-soft"
                      : "text-ink-soft hover:bg-bg-hover hover:text-ink border border-transparent",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4.5 w-4.5 shrink-0",
                      isActive ? "text-ink" : "text-ink-muted",
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Profile Info Footer */}
        <div className="p-4 border-t border-rule-soft bg-bg-soft/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8.5 w-8.5 rounded-lg bg-ink flex items-center justify-center text-bg text-[10px] font-bold shrink-0">
              {user?.email?.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-ink truncate leading-tight">
                {user?.email}
              </p>
              <p className="text-[10px] text-ink-muted uppercase font-bold tracking-wider mt-0.5">
                {role === "admin" ? "Administrador" : "Funcionário"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
