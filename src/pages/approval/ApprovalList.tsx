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
        <h1 className="text-2xl font-bold text-brand-brown">
          Aprovação de Contagens
        </h1>
        <p className="text-gray-500">
          Revise e aprove as contagens finalizadas pelos colaboradores
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : counts.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-medium text-gray-900">Tudo em dia!</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
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
              className="flex flex-col overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6 flex-1 space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 shrink-0">
                    <Clock className="h-3 w-3" />
                    Aguardando Análise
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 font-mono">
                      #{count.id.substring(0, 6)}
                    </div>
                    {count.store_id && stores[count.store_id] && (
                      <div className="text-xs font-medium text-gray-700 mt-1">
                        {stores[count.store_id]}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">
                    Data da Contagem
                  </div>
                  <div className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-brand-brown" />
                    {format(
                      new Date(count.created_at),
                      "dd 'de' MMMM 'às' HH:mm",
                      { locale: ptBR },
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Resumo</div>
                  <div className="text-2xl font-bold text-brand-brown">
                    {count.items.length}{" "}
                    <span className="text-sm font-normal text-gray-500">
                      itens contados
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 border-t border-gray-100">
                <Link to={`/aprovacao/${count.id}`}>
                  <Button className="w-full group">
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
