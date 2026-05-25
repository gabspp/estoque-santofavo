import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Download, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { countingService } from "@/services/countingService";
import { productService } from "@/services/productService";
import { storeService } from "@/services/storeService";
import { type StockCount, type Product } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

export default function ApprovalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [count, setCount] = useState<StockCount | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [storeName, setStoreName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (countId: string) => {
    try {
      const [countData, productsData] = await Promise.all([
        countingService.getCountById(countId),
        productService.getProducts(),
      ]);

      if (!countData) {
        toast({ title: "Contagem não encontrada", variant: "destructive" });
        navigate("/aprovacao");
        return;
      }

      if (countData.store_id) {
        try {
          const store = await storeService.getById(countData.store_id);
          if (store) setStoreName(store.name);
        } catch (e) {
          console.error("Error fetching store:", e);
        }
      }

      setCount(countData);
      productsData.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(productsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (
      !id ||
      !confirm("Confirmar aprovação? Isso atualizará o estoque oficial.")
    )
      return;

    setProcessing(true);
    try {
      await countingService.approveCount(id);
      toast({
        title: "Contagem aprovada!",
        description: "O estoque foi atualizado com sucesso.",
        variant: "success",
      });
      navigate("/aprovacao");
    } catch (error) {
      console.error("Error approving:", error);
      toast({ title: "Erro ao aprovar contagem", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (
      !id ||
      !confirm("Rejeitar esta contagem? Ela voltará para status de Rascunho.")
    )
      return;

    setProcessing(true);
    try {
      await countingService.rejectCount(id);
      toast({
        title: "Contagem rejeitada",
        description: "Retornada para status de rascunho.",
        variant: "default",
      });
      navigate("/aprovacao");
    } catch (error) {
      console.error("Error rejecting:", error);
      toast({ title: "Erro ao rejeitar contagem", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const getProductName = (id: string) => {
    return products.find((p) => p.id === id)?.name || "Produto Desconhecido";
  };

  const handleExportCSV = () => {
    if (!count) return;
    try {
      const nameStore = storeName || "Geral";
      const csvContent = [
        ["Produto", "Quantidade Contada", "Quantidade Sistema", "Diferença", "Comprar"],
        ...count.items.map((item) => {
          const product = products.find((p) => p.id === item.product_id);
          const name = product ? product.name : "Produto Desconhecido";
          const diff = item.quantity_counted - item.quantity_system;
          const toBuy = item.to_buy ? "Sim" : "Não";
          return `"${name}",${item.quantity_counted},${item.quantity_system},${diff},${toBuy}`;
        }),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Revisao_${nameStore.replace(/\s+/g, "_")}_${count.id.substring(0, 6)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
      toast({ title: "Erro ao exportar CSV", variant: "destructive" });
    }
  };

  if (loading || !count)
    return <div className="p-8 text-center">Carregando detalhes...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to="/aprovacao">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="font-serif font-medium text-2xl tracking-tight text-ink">
              Revisão Contagem #{count.id.substring(0, 6)}
              {storeName && ` - ${storeName}`}
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              Realizada em{" "}
              {format(new Date(count.created_at), "dd 'de' MMMM 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 mt-4 sm:mt-0">
          <Button
            variant="outline"
            className="flex items-center text-xs font-semibold uppercase tracking-wider text-ink"
            onClick={handleExportCSV}
            title="Download CSV"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
          <Button
            variant="outline"
            className="text-brand-rosa hover:bg-brand-rosa/10 border-brand-rosa/20 text-xs font-semibold uppercase tracking-wider"
            onClick={handleReject}
            disabled={processing}
          >
            <XCircle className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Rejeitar</span>
          </Button>
          <Button
            className="bg-ink text-bg hover:bg-ink-soft hover:text-bg text-xs font-semibold uppercase tracking-wider"
            onClick={handleApprove}
            disabled={processing}
          >
            <CheckCircle className="h-4 w-4 sm:mr-2 text-brand-verde" />
            <span className="hidden sm:inline">Aprovar e Atualizar Estoque</span>
          </Button>
        </div>
      </div>

      {/* Comparison Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-bg-soft text-ink-muted border-b border-rule-soft">
              <tr>
                <th className="px-6 py-4 text-[0.74rem] font-semibold uppercase tracking-wider text-ink-muted">Produto</th>
                <th className="px-6 py-4 text-center text-[0.74rem] font-semibold uppercase tracking-wider text-ink-muted">Estoque Sistema</th>
                <th className="px-6 py-4 text-center text-[0.74rem] font-semibold uppercase tracking-wider text-ink-muted">Contagem Física</th>
                <th className="px-6 py-4 text-center text-[0.74rem] font-semibold uppercase tracking-wider text-ink-muted">Diferença</th>
                <th className="px-6 py-4 text-center text-[0.74rem] font-semibold uppercase tracking-wider text-ink-muted">Comprar</th>
                <th className="px-6 py-4 text-right text-[0.74rem] font-semibold uppercase tracking-wider text-ink-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule-soft">
              {count.items.map((item) => {
                const diff = item.quantity_counted - item.quantity_system;
                const hasDiff = diff !== 0;

                return (
                  <tr key={item.product_id} className="hover:bg-bg-hover">
                    <td className="px-6 py-4 font-medium text-ink">
                      {getProductName(item.product_id)}
                    </td>
                    <td className="px-6 py-4 text-center text-ink-soft bg-bg-soft/20">
                      {item.quantity_system}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-ink">
                      {item.quantity_counted}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={cn(
                          "inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold min-w-[3rem]",
                          diff === 0
                            ? "bg-bg text-ink-muted border border-rule-soft"
                            : diff > 0
                              ? "bg-brand-verde/20 text-brand-marrom-escuro border border-brand-verde/30"
                              : "bg-brand-rosa/20 text-brand-marrom-escuro border border-brand-rosa/30",
                        )}
                      >
                        {diff > 0 ? "+" : ""}
                        {diff}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.to_buy && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-rule-soft bg-bg-card text-xs font-medium text-ink-soft">
                          <ShoppingCart className="h-3 w-3 text-ink-muted" />
                          Comprar
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {hasDiff ? (
                        <span className="flex items-center justify-end gap-1 text-brand-rosa text-xs font-medium">
                          <AlertTriangle className="h-3 w-3 text-brand-rosa" />
                          Divergência
                        </span>
                      ) : (
                        <span className="flex items-center justify-end gap-1 text-brand-verde text-xs font-medium">
                          <CheckCircle className="h-3 w-3 text-brand-verde" />
                          Ok
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="bg-brand-rosa/10 border border-brand-rosa/20 rounded-lg p-4 flex gap-3 text-sm text-ink-soft">
        <AlertTriangle className="h-5 w-5 shrink-0 text-brand-rosa" />
        <div>
          <p className="font-semibold text-ink">Atenção</p>
          <p>
            Ao aprovar esta contagem, o estoque do sistema será{" "}
            <strong>substituído</strong> pelos valores da coluna "Contagem
            Física". Esta ação não pode ser desfeita.
          </p>
        </div>
      </div>
    </div>
  );
}
