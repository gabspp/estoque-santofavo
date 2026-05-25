import { useNavigate } from "react-router-dom";
import { Plus, CheckSquare, ClipboardList, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ActionButtons() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Button
        className="h-auto py-5 flex flex-col gap-2.5 bg-bg-card border border-rule-soft hover:bg-bg-hover text-ink rounded-lg"
        variant="ghost"
        onClick={() => navigate("/entradas")}
      >
        <Plus className="h-6 w-6 text-ink-soft" />
        <span className="text-xs font-semibold uppercase tracking-wider text-ink">Registrar Entrada</span>
      </Button>

      <Button
        className="h-auto py-5 flex flex-col gap-2.5 bg-bg-card border border-rule-soft hover:bg-bg-hover text-ink rounded-lg"
        variant="ghost"
        onClick={() => navigate("/contagem")}
      >
        <ClipboardList className="h-6 w-6 text-ink-soft" />
        <span className="text-xs font-semibold uppercase tracking-wider text-ink">Nova Contagem</span>
      </Button>

      <Button
        className="h-auto py-5 flex flex-col gap-2.5 bg-bg-card border border-rule-soft hover:bg-bg-hover text-ink rounded-lg"
        variant="ghost"
        onClick={() => navigate("/aprovacao")}
      >
        <CheckSquare className="h-6 w-6 text-ink-soft" />
        <span className="text-xs font-semibold uppercase tracking-wider text-ink">Aprovar Contagens</span>
      </Button>

      <Button
        className="h-auto py-5 flex flex-col gap-2.5 bg-bg-card border border-rule-soft hover:bg-bg-hover text-ink rounded-lg"
        variant="ghost"
        onClick={() => navigate("/compras")}
      >
        <ShoppingCart className="h-6 w-6 text-ink-soft" />
        <span className="text-xs font-semibold uppercase tracking-wider text-ink">Lista de Compras</span>
      </Button>
    </div>
  );
}
