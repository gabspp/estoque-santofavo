import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { countingService } from "@/services/countingService";
import { productService } from "@/services/productService";
import { type StockCount, type Product } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

export default function ApprovalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [count, setCount] = useState<StockCount | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
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

  if (loading || !count)
    return <div className="p-8 text-center">Carregando detalhes...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/aprovacao">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-brand-brown">
              Revisão Contagem #{count.id.substring(0, 6)}
            </h1>
            <p className="text-gray-500">
              Realizada em{" "}
              {format(new Date(count.created_at), "dd 'de' MMMM 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            onClick={handleReject}
            disabled={processing}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rejeitar / Solicitar Correção
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleApprove}
            disabled={processing}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprovar e Atualizar Estoque
          </Button>
        </div>
      </div>

      {/* Comparison Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4 text-center">Estoque Sistema</th>
                <th className="px-6 py-4 text-center">Contagem Física</th>
                <th className="px-6 py-4 text-center">Diferença</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {count.items.map((item) => {
                const diff = item.quantity_counted - item.quantity_system;
                const hasDiff = diff !== 0;

                return (
                  <tr key={item.product_id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {getProductName(item.product_id)}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-500 bg-gray-50/50">
                      {item.quantity_system}
                    </td>
                    <td className="px-6 py-4 text-center font-bold">
                      {item.quantity_counted}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={cn(
                          "inline-block px-2 py-1 rounded text-xs font-medium min-w-[3rem]",
                          diff === 0
                            ? "bg-gray-100 text-gray-600"
                            : diff > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700",
                        )}
                      >
                        {diff > 0 ? "+" : ""}
                        {diff}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {hasDiff ? (
                        <span className="flex items-center justify-end gap-1 text-yellow-600 text-xs font-medium">
                          <AlertTriangle className="h-3 w-3" />
                          Divergência
                        </span>
                      ) : (
                        <span className="flex items-center justify-end gap-1 text-green-600 text-xs font-medium">
                          <CheckCircle className="h-3 w-3" />
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

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Atenção</p>
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
