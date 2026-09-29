import { useState, useEffect } from "react";
import { Menu, LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "react-router-dom";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { signOut } = useAuth();
  const location = useLocation();

  // Theme Toggler state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Simple page breadcrumb
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === "/") return "Dashboard";
    if (path.startsWith("/produtos")) return "Produtos";
    if (path.startsWith("/entradas")) return "Entradas";
    if (path.startsWith("/contagem")) return "Contagem";
    if (path.startsWith("/aprovacao")) return "Aprovação";
    if (path.startsWith("/processamento")) return "Processamento";
    if (path.startsWith("/relatorios/compras")) return "Lista de Compras";
    if (path.startsWith("/usuarios")) return "Configurações de Usuários";
    return "Estoque";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-rule-soft bg-bg/90 backdrop-blur-md px-5 select-none">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="md:hidden p-0 h-9 w-9 text-ink hover:bg-bg-hover"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Breadcrumb Title */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted hidden md:inline"> Santo Favo </span>
          <span className="text-xs text-ink-muted opacity-50 hidden md:inline">·</span>
          <h2 className="font-serif text-base text-ink font-semibold md:font-medium leading-none tracking-tight">
            {getBreadcrumb()}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg inline-flex items-center justify-center text-ink-soft hover:text-ink hover:bg-bg-hover transition-colors"
          title="Alternar Tema Escuro/Claro"
        >
          {theme === "light" ? (
            <Moon className="h-4.5 w-4.5" />
          ) : (
            <Sun className="h-4.5 w-4.5" />
          )}
        </button>

        {/* Sign Out Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="text-ink-soft hover:text-brand-rosa hover:bg-bg-hover font-semibold h-9 px-3"
          title="Sair"
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span className="hidden md:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
}
