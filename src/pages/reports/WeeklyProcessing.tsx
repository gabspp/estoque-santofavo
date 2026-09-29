import { useState, useEffect } from "react";
import {
  DollarSign,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Percent,
  TrendingUp,
  Save,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { reportService } from "@/services/reportService";
import { type WeeklyReport } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export default function WeeklyProcessing() {
  const { toast } = useToast();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");

  // Revenue States
  const [revMarketup, setRevMarketup] = useState("0");
  const [revTakeat248, setRevTakeat248] = useState("0");
  const [revTakeat26, setRevTakeat26] = useState("0");
  const [revenueSaving, setRevenueSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await reportService.getCurrentWeekData();
      setReport(data);

      // Fetch faturamento for the period
      const { data: revData } = await supabase
        .from("weekly_revenue")
        .select("*")
        .eq("start_date", data.start_date)
        .eq("end_date", data.end_date)
        .maybeSingle();

      if (revData) {
        setRevMarketup(revData.revenue_marketup.toString());
        setRevTakeat248(revData.revenue_takeat_248.toString());
        setRevTakeat26(revData.revenue_takeat_26.toString());
      } else {
        setRevMarketup("0");
        setRevTakeat248("0");
        setRevTakeat26("0");
      }
    } catch (error) {
      console.error("Error loading report:", error);
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRevenue = async () => {
    if (!report) return;
    setRevenueSaving(true);
    try {
      const marketup = parseFloat(revMarketup) || 0;
      const takeat248 = parseFloat(revTakeat248) || 0;
      const takeat26 = parseFloat(revTakeat26) || 0;

      const { error } = await supabase
        .from("weekly_revenue")
        .upsert({
          start_date: report.start_date,
          end_date: report.end_date,
          revenue_marketup: marketup,
          revenue_takeat_248: takeat248,
          revenue_takeat_26: takeat26,
          updated_at: new Date().toISOString()
        }, { onConflict: "start_date,end_date" });

      if (error) throw error;
      toast({
        title: "Faturamento salvo! 💰",
        description: "Os valores foram registrados com sucesso.",
        variant: "success"
      });
    } catch (error) {
      console.error("Error saving revenue:", error);
      toast({ title: "Erro ao salvar faturamento", variant: "destructive" });
    } finally {
      setRevenueSaving(false);
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
      const faturamentoTotal = (parseFloat(revMarketup) || 0) + (parseFloat(revTakeat248) || 0) + (parseFloat(revTakeat26) || 0);
      await reportService.closeWeek({
        ...report,
        revenue_total: faturamentoTotal
      });
      toast({
        title: "Semana fechada com sucesso!",
        description: "O relatório foi salvo no histórico.",
        variant: "success",
      });
      loadData();
    } catch (error) {
      console.error("Error closing week:", error);
      toast({ title: "Erro ao fechar semana", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return <div className="p-8 text-center text-ink-muted font-medium">Calculando dados da semana...</div>;
  if (!report)
    return <div className="p-8 text-center text-ink-muted font-medium">Nenhum dado disponível.</div>;

  const faturamentoTotal = (parseFloat(revMarketup) || 0) + (parseFloat(revTakeat248) || 0) + (parseFloat(revTakeat26) || 0);
  const cmv = faturamentoTotal > 0 ? (report.total_consumption_value / faturamentoTotal) * 100 : 0;
  const incompleteItems = report.items.filter(item => item.incomplete);
  const completeItemsCount = report.items.filter(item => !item.incomplete).length;

  return (
    <div className="space-y-6 pb-12 relative font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-ink">
            Processamento Semanal
          </h1>
          <p className="text-xs text-ink-muted font-medium uppercase tracking-wider mt-0.5">
            Cálculo de consumo consolidado e fechamento de ciclo
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

      {/* Cards de Métricas Finanças - Newsreader Typography */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Consumo */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-bg-soft rounded-lg text-ink-soft">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Consumo Total</p>
              <h3 className="font-serif text-xl font-medium text-ink mt-0.5 leading-none">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(report.total_consumption_value)}
              </h3>
            </div>
          </div>
        </Card>

        {/* Faturamento */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-bg-soft rounded-lg text-ink-soft">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Faturamento Total</p>
              <h3 className="font-serif text-xl font-medium text-ink mt-0.5 leading-none">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(faturamentoTotal)}
              </h3>
            </div>
          </div>
        </Card>

        {/* CMV */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-bg-soft rounded-lg text-ink-soft">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">CMV Consolidado</p>
              <h3 className="font-serif text-xl font-medium text-ink mt-0.5 leading-none">
                {faturamentoTotal > 0 ? `${cmv.toFixed(1)}%` : "0.0%"}
              </h3>
            </div>
          </div>
        </Card>

        {/* Fechamento */}
        <Card className="p-5 flex flex-col justify-between border-rule bg-bg-soft/30">
          <div className="space-y-1">
            <div className="text-[9px] font-bold uppercase tracking-wider text-ink-muted flex justify-between items-center">
              <span>Período da Semana</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-brand-verde bg-brand-verde/15 px-1.5 py-0.5 rounded leading-none">Em aberto</span>
            </div>
            <div className="text-xs font-semibold text-ink">
              {format(new Date(report.start_date), "dd/MM", { locale: ptBR })} até{" "}
              {format(new Date(report.end_date), "dd/MM", { locale: ptBR })}
            </div>
          </div>
          <Button
            onClick={handleCloseWeek}
            disabled={processing}
            className="w-full text-[10px] py-1.5 h-auto mt-3"
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            Fechar Semana
          </Button>
        </Card>
      </div>

      {/* Bloco de Faturamento Semanal */}
      <Card className="p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-3 border-b border-rule-soft">
          <div>
            <h2 className="font-serif text-lg font-medium tracking-tight text-ink">Faturamento Semanal (Manual)</h2>
            <p className="text-xs text-ink-muted mt-0.5">Informe a receita das abas do Controle 2026 para calcular o CMV real.</p>
          </div>
          <Button
            onClick={handleSaveRevenue}
            disabled={revenueSaving}
            size="sm"
            className="h-9 text-xs"
          >
            <Save className="h-4 w-4 mr-2" />
            {revenueSaving ? "Salvando..." : "Salvar Faturamento"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="rev_marketup">MarketUP (Soma do Sistema)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted">R$</span>
              <Input
                id="rev_marketup"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-8 h-9 text-sm"
                value={revMarketup}
                onChange={e => setRevMarketup(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rev_takeat_248">Takeat Loja 248</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted">R$</span>
              <Input
                id="rev_takeat_248"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-8 h-9 text-sm"
                value={revTakeat248}
                onChange={e => setRevTakeat248(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rev_takeat_26">Takeat Loja 26</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted">R$</span>
              <Input
                id="rev_takeat_26"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-8 h-9 text-sm"
                value={revTakeat26}
                onChange={e => setRevTakeat26(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Indicador de Completude e Buracos de Contagem */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-bg-card border border-rule-soft rounded-lg p-4">
          <div>
            <h3 className="font-semibold text-ink text-sm">Completude da Contagem Física</h3>
            <p className="text-xs text-ink-muted mt-1">
              Contados {completeItemsCount} de {report.items.length} produtos ativos em 100% de suas lojas.
            </p>
          </div>
          <span className={cn(
            "text-[10px] px-2.5 py-0.5 rounded font-bold uppercase tracking-wider border",
            incompleteItems.length === 0
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-brand-rosa/15 text-brand-rosa border-brand-rosa/30"
          )}>
            {incompleteItems.length === 0 ? "Contagem Completa" : `${incompleteItems.length} Incompletos`}
          </span>
        </div>

        {incompleteItems.length > 0 && (
          <Card className="p-4 border-brand-rosa/20 bg-brand-rosa/5 space-y-2.5">
            <div className="flex items-center gap-2 text-brand-rosa font-semibold text-sm">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
              <span>Atenção: Contagens pendentes detectadas!</span>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              Os produtos abaixo estão ativos para venda em pelo menos uma loja, mas a contagem de estoque aprovada desta semana não foi localizada para todas as lojas. Para estes produtos, o sistema adotou o **estoque sistêmico atual** como fallback temporário. Isso pode gerar distorções no valor do consumo e no CMV consolidado.
            </p>
            <details className="text-xs text-ink bg-bg-card border border-rule-soft rounded p-2.5 cursor-pointer">
              <summary className="font-semibold text-ink-soft hover:text-ink cursor-pointer select-none">
                Expandir lista de produtos incompletos ({incompleteItems.length})
              </summary>
              <ul className="mt-2 divide-y divide-rule-soft max-h-48 overflow-y-auto pl-2">
                {incompleteItems.map(item => (
                  <li key={item.product_id} className="py-1 flex justify-between text-[11px]">
                    <span className="font-medium text-ink">{item.product_name}</span>
                    <span className="text-ink-muted font-bold">
                      Contado em {item.counted_stores || 0} de {item.active_stores || 0} loja(s)
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </Card>
        )}
      </div>

      {/* Table Detalhamento */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-rule-soft bg-bg-soft/20 flex justify-between items-center select-none">
          <h3 className="font-serif text-lg font-medium text-ink flex items-center gap-2">
            <BarChart3 className="h-4.5 w-4.5 text-ink-soft" />
            Detalhamento por Produto
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            Cálculo: (Inicial + Entradas) - Final = Consumo
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="border-b border-rule bg-bg-soft/40">
              <tr>
                <th className="px-5 py-3 font-sans font-semibold text-xs uppercase tracking-wider text-ink-muted">Produto</th>
                <th className="px-5 py-3 text-center font-sans font-semibold text-xs uppercase tracking-wider text-ink-muted">Estoque Inicial</th>
                <th className="px-5 py-3 text-center font-sans font-semibold text-xs uppercase tracking-wider text-ink-muted">Entradas (+)</th>
                <th className="px-5 py-3 text-center font-sans font-semibold text-xs uppercase tracking-wider text-ink-muted">Final (-)</th>
                <th className="px-5 py-3 text-center font-sans font-bold text-xs uppercase tracking-wider text-ink">Consumo</th>
                <th className="px-5 py-3 text-right font-sans font-semibold text-xs uppercase tracking-wider text-ink-muted">Valor Consumido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule-soft">
              {report.items.map((item) => (
                <tr key={item.product_id} className="hover:bg-bg-hover transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-ink flex items-center gap-1.5 flex-wrap">
                      {item.product_name}
                      {item.incomplete && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-brand-rosa/15 text-brand-rosa border border-brand-rosa/20 shrink-0" title={`Contado em apenas ${item.counted_stores || 0} de ${item.active_stores || 0} lojas`}>
                          Incompleto
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-muted">{item.category}</div>
                  </td>
                  <td className="px-5 py-3 text-center text-ink-soft">
                    {item.initial_stock}
                  </td>
                  <td className="px-5 py-3 text-center text-ink font-medium bg-bg-soft/20">
                    {item.entries_quantity}
                  </td>
                  <td className="px-5 py-3 text-center text-ink font-medium">
                    {item.final_stock}
                  </td>
                  <td className="px-5 py-3 text-center font-bold text-ink-soft bg-bg-soft/10">
                    {item.consumption_quantity} {item.unit}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-ink">
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
                    className="px-5 py-8 text-center text-ink-muted font-medium"
                  >
                    Nenhum dado para processar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="bg-bg-soft/50 border border-rule-soft rounded-lg p-4 flex gap-3 text-xs text-ink-soft leading-relaxed">
        <AlertTriangle className="h-5 w-5 shrink-0 text-ink-muted" />
        <div>
          <p className="font-bold text-ink mb-0.5">Como funciona o cálculo?</p>
          <p>
            O sistema pega o estoque do fechamento anterior (Inicial), soma
            todas as notas de entrada (Entradas) e subtrai a contagem física
            atual (Final). A diferença é o que foi consumido (vendas, perdas,
            uso interno), valorizado pelo último custo (`last_cost`) cadastrado.
          </p>
        </div>
      </div>
    </div>
  );
}
