import { useState, useEffect } from "react";
import {
  Calendar,
  DollarSign,
  BarChart3,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { reportService } from "@/services/reportService";
import { type WeeklyReport } from "@/types";
import { useToast } from "@/components/ui/use-toast";

export default function WeeklyProcessing() {
  const { toast } = useToast();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await reportService.getCurrentWeekData();
      setReport(data);
    } catch (error) {
      console.error("Error loading report:", error);
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseWeek = async () => {
    if (
      !report ||
      !confirm(
        'Confirma o fechamento da semana? Isso vai gerar o relatório final e "zerar" as entradas para o próximo ciclo.',
      )
    )
      return;

    setProcessing(true);
    try {
      await reportService.closeWeek(report);
      toast({
        title: "Semana fechada com sucesso!",
        description: "O relatório foi salvo no histórico.",
        variant: "success",
      });
      // Reload to show fresh state (in real app, would reset)
      loadData();
    } catch (error) {
      console.error("Error closing week:", error);
      toast({ title: "Erro ao fechar semana", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return <div className="p-8 text-center">Calculando dados da semana...</div>;
  if (!report)
    return <div className="p-8 text-center">Nenhum dado disponível.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-brown">
            Processamento Semanal
          </h1>
          <p className="text-gray-500">
            Cálculo de consumo e fechamento de ciclo
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === "current" ? "primary" : "outline"}
            onClick={() => setActiveTab("current")}
          >
            Ciclo Atual
          </Button>
          <Button
            variant={activeTab === "history" ? "primary" : "outline"}
            onClick={() => setActiveTab("history")}
            disabled // pending implementation
          >
            Histórico
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white border-brand-yellow/20 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-yellow/10 rounded-full">
              <DollarSign className="h-6 w-6 text-brand-brown" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Consumo Total (Estimado)</p>
              <h3 className="text-2xl font-bold text-brand-brown">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(report.total_consumption_value)}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-blue-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Período</p>
              <h3 className="text-sm font-medium text-gray-900">
                {format(new Date(report.start_date), "dd/MM", { locale: ptBR })}{" "}
                até{" "}
                {format(new Date(report.end_date), "dd/MM", { locale: ptBR })}
              </h3>
              <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <CheckCircle className="h-3 w-3" /> Em andamento
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-purple-100 shadow-sm flex flex-col justify-center">
          <Button
            onClick={handleCloseWeek}
            disabled={processing}
            className="w-full bg-brand-brown hover:bg-brand-brown/90"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Fechar Semana e Gerar Relatório
          </Button>
          <p className="text-xs text-center text-gray-500 mt-2">
            Essa ação consolida os dados atuais.
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Detalhamento por Produto
          </h3>
          <span className="text-xs text-gray-500">
            Cálculo: (Inicial + Entradas) - Final = Consumo
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-3">Produto</th>
                <th className="px-6 py-3 text-center">Estoque Inicial</th>
                <th className="px-6 py-3 text-center">Entradas (+)</th>
                <th className="px-6 py-3 text-center">Final (-)</th>
                <th className="px-6 py-3 text-center font-bold text-gray-900">
                  Consumo
                </th>
                <th className="px-6 py-3 text-right">Valor Consumido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report.items.map((item) => (
                <tr key={item.product_id} className="hover:bg-gray-50/30">
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900">
                      {item.product_name}
                    </div>
                    <div className="text-xs text-gray-500">{item.category}</div>
                  </td>
                  <td className="px-6 py-3 text-center text-gray-500">
                    {item.initial_stock}
                  </td>
                  <td className="px-6 py-3 text-center text-blue-600 bg-blue-50/30">
                    {item.entries_quantity}
                  </td>
                  <td className="px-6 py-3 text-center text-gray-900 bg-gray-50/50 font-medium">
                    {item.final_stock}
                  </td>
                  <td className="px-6 py-3 text-center font-bold text-brand-brown bg-brand-yellow/5">
                    {item.consumption_quantity} {item.unit}
                  </td>
                  <td className="px-6 py-3 text-right font-medium">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(item.consumption_value)}
                  </td>
                </tr>
              ))}
              {report.items.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Nenhum dado para processar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 flex gap-3 text-sm text-yellow-800">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Como funciona o cálculo?</p>
          <p>
            O sistema pega o estoque do fechamento anterior (Inicial), soma
            todas as notas de entrada (Entradas) e subtrai a contagem física
            atual (Final). A diferença é o que foi consumido (vendas, perdas,
            uso interno).
          </p>
        </div>
      </div>
    </div>
  );
}
