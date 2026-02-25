import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Clock, CheckCircle, AlertCircle, Calendar, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { countingService } from "@/services/countingService";
import { storeService } from "@/services/storeService";
import { productService } from "@/services/productService";
import { type StockCount } from "@/types";
import { cn } from "@/lib/utils";

export default function CountingDashboard() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<StockCount[]>([]);
  const [stores, setStores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      const [data, storesData] = await Promise.all([
        countingService.getCounts(),
        storeService.getAll(),
      ]);
      const storesMap: Record<string, string> = {};
      storesData.forEach((s) => {
        storesMap[s.id] = s.name;
      });
      setStores(storesMap);
      setCounts(data);
    } catch (error) {
      console.error("Error loading counts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta contagem?")) return;

    try {
      await countingService.deleteCount(id);
      setCounts((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error deleting count:", error);
      alert("Erro ao excluir contagem");
    }
  };

  const handleNewCount = () => {
    navigate("/contagem/nova");
  };

  const handleExportCSV = async (count: StockCount) => {
    try {
      const storeName = count.store_id ? (stores[count.store_id] || "Loja") : "Geral";
      const products = await productService.getProducts();

      const csvContent = [
        ["Produto", "Quantidade Contada", "Quantidade Sistema", "Diferença"],
        ...count.items.map((item) => {
          const product = products.find((p) => p.id === item.product_id);
          const name = product ? product.name : "Produto Desconhecido";
          const diff = item.quantity_counted - item.quantity_system;
          return `"${name}",${item.quantity_counted},${item.quantity_system},${diff}`;
        }),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Contagem_${storeName.replace(/\s+/g, "_")}_${count.id.substring(0, 6)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
      alert("Erro ao exportar CSV");
    }
  };

  // Function moved up to resolve lint error

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "pending_review":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Rascunho";
      case "pending_review":
        return "Em Análise";
      case "approved":
        return "Aprovado";
      case "rejected":
        return "Rejeitado";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-brown">
            Contagem de Estoque
          </h1>
          <p className="text-gray-500">
            Realize contagens periódicas para manter o estoque atualizado
          </p>
        </div>
        <Button onClick={handleNewCount}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Contagem
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Drafts Section */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand-brown" />
            Contagens Recentes
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : counts.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <p>Nenhuma contagem registrada.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleNewCount}
              >
                Iniciar primeira contagem
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {counts.map((count) => (
                <Card
                  key={count.id}
                  className="p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-start gap-3">
                      <div className="bg-brand-yellow/10 p-2 rounded-full mt-1">
                        <Calendar className="h-4 w-4 text-brand-brown" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          Contagem - Semana {format(new Date(count.created_at), "w")}
                          {count.store_id && stores[count.store_id] && (
                            <span className="text-sm font-normal text-gray-500">
                              - {stores[count.store_id]}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Iniciada em{" "}
                          {format(
                            new Date(count.created_at),
                            "dd 'de' MMMM 'às' HH:mm",
                            { locale: ptBR },
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                          <span>{count.items.length} itens</span>
                          {count.completed_categories && count.completed_categories.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                                {count.completed_categories.length} categoria(s) concluída(s)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-medium",
                          getStatusColor(count.status),
                        )}
                      >
                        {getStatusLabel(count.status)}
                      </span>

                      {count.status === "draft" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(count.id)}
                          >
                            Excluir
                          </Button>
                          <Link to={`/contagem/${count.id}`}>
                            <Button size="sm" variant="outline" className="h-8">
                              Continuar
                            </Button>
                          </Link>
                        </div>
                      )}
                      {count.status === "pending_review" && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Aguardando gerente
                        </span>
                      )}
                      {(count.status === "approved" || count.status === "rejected") && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => handleExportCSV(count)}
                            title="Baixar CSV"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(count.id)}
                          >
                            Excluir
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Info/Stats Section */}
        <div className="space-y-6">
          <Card className="p-6 bg-blue-50 border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Importante
            </h3>
            <p className="text-sm text-blue-700 leading-relaxed">
              Realizar as contagens aos sábados e preferencialmente perto do fim do expediente.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              Dicas de Contagem
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <span>Organize as prateleiras antes de começar.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <span>Conte por seções (ex: refletindo as subcategorias atuais do sistema).</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <span>Use a mesma unidade de medida do sistema (UN, KG).</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
