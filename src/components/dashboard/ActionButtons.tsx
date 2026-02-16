import { useNavigate } from "react-router-dom";
import { Plus, CheckSquare, ClipboardList, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ActionButtons() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Button
        className="h-auto py-4 flex flex-col gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-brand-brown shadow-sm"
        variant="ghost"
        onClick={() => navigate("/entradas")}
      >
        <div className="p-2 bg-blue-50 rounded-full text-blue-600">
          <Plus className="h-6 w-6" />
        </div>
        <span className="font-semibold">Registrar Entrada</span>
      </Button>

      <Button
        className="h-auto py-4 flex flex-col gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-brand-brown shadow-sm"
        variant="ghost"
        onClick={() => navigate("/contagem")}
      >
        <div className="p-2 bg-green-50 rounded-full text-green-600">
          <ClipboardList className="h-6 w-6" />
        </div>
        <span className="font-semibold">Nova Contagem</span>
      </Button>

      <Button
        className="h-auto py-4 flex flex-col gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-brand-brown shadow-sm"
        variant="ghost"
        onClick={() => navigate("/aprovacao")}
      >
        <div className="p-2 bg-yellow-50 rounded-full text-yellow-600">
          <CheckSquare className="h-6 w-6" />
        </div>
        <span className="font-semibold">Aprovar Contagens</span>
      </Button>

      <Button
        className="h-auto py-4 flex flex-col gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-brand-brown shadow-sm"
        variant="ghost"
        onClick={() => navigate("/compras")}
      >
        <div className="p-2 bg-purple-50 rounded-full text-purple-600">
          <ShoppingCart className="h-6 w-6" />
        </div>
        <span className="font-semibold">Lista de Compras</span>
      </Button>
    </div>
  );
}
