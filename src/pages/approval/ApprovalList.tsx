import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Clock, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { countingService } from "@/services/countingService";
import { storeService } from "@/services/storeService";
import { type StockCount } from "@/types";

export default function ApprovalList() {
  const [counts, setCounts] = useState<StockCount[]>([]);
  const [stores, setStores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allCounts, storesData] = await Promise.all([
        countingService.getCounts(),
        storeService.getAll(),
      ]);

      const storesMap: Record<string, string> = {};
      storesData.forEach((s) => {
        storesMap[s.id] = s.name;
      });
      setStores(storesMap);

      // Filter only pending review
      const pending = allCounts.filter((c) => c.status === "pending_review");
      setCounts(pending);
    } catch (error) {
      console.error("Error loading counts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif font-medium text-2xl tracking-tight text-ink">
          Aprovação de Contagens
        </h1>
        <p className="text-sm text-ink-muted">
          Revise e aprove as contagens finalizadas pelos colaboradores
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-ink-muted">Carregando...</div>
      ) : counts.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center gap-4">
          <CheckCircle className="h-8 w-8 text-brand-verde" />
          <div className="space-y-1">
            <h3 className="font-serif font-medium text-lg text-ink">Tudo em dia!</h3>
            <p className="text-sm text-ink-muted max-w-sm mx-auto">
              Não há contagens pendentes de aprovação no momento.
            </p>
          </div>
          <Link to="/contagem">
            <Button variant="outline" className="mt-2">
              Ver histórico de contagens
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {counts.map((count) => (
            <Card
              key={count.id}
              className="flex flex-col overflow-hidden border border-rule-soft bg-bg-card"
            >
              <div className="p-6 flex-1 space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="inline-flex items-center px-2 py-0.5 rounded-md border border-rule-soft bg-accent/20 text-brand-marrom-escuro text-xs font-medium gap-1 shrink-0">
                    <Clock className="h-3 w-3 text-brand-marrom-escuro" />
                    Aguardando Análise
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-ink-muted font-mono">
                      #{count.id.substring(0, 6)}
                    </div>
                    {count.store_id && stores[count.store_id] && (
                      <div className="text-xs font-medium text-ink-soft mt-1">
                        {stores[count.store_id]}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                    Data da Contagem
                  </div>
                  <div className="font-medium text-ink flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-ink-soft" />
                    {format(
                      new Date(count.created_at),
                      "dd 'de' MMMM 'às' HH:mm",
                      { locale: ptBR },
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">Resumo</div>
                  <div className="font-serif text-2xl font-semibold text-ink">
                    {count.items.length}{" "}
                    <span className="font-sans text-sm font-normal text-ink-muted ml-1">
                      itens contados
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-bg-soft p-4 border-t border-rule-soft">
                <Link to={`/aprovacao/${count.id}`}>
                  <Button className="w-full group bg-ink text-bg hover:bg-ink-soft hover:text-bg">
                    Revisar Contagem
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
