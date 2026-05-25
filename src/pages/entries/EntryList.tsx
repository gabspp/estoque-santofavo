import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, ArrowUpRight, Upload } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { productService } from "@/services/productService";
import { type StockEntry, type Product } from "@/types";

export default function EntryList() {
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [entriesData, productsData] = await Promise.all([
        productService.getStockEntries(),
        productService.getProducts(),
      ]);
      setEntries(entriesData);
      setProducts(productsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (id: string) => {
    return products.find((p) => p.id === id)?.name || "Produto Desconhecido";
  };

  const filteredEntries = entries.filter((entry) => {
    const productName = getProductName(entry.product_id).toLowerCase();
    return productName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif font-medium text-2xl tracking-tight text-ink">
            Entradas de Estoque
          </h1>
          <p className="text-sm text-ink-muted">
            Registre novas compras e visualize o histórico
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/entradas/importar">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar CSV
            </Button>
          </Link>
          <Link to="/entradas/nova">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Entrada
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
        <Input
          placeholder="Buscar por nome do produto..."
          className="pl-10 max-w-md bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-bg-soft text-ink-muted border-b border-rule-soft">
              <tr>
                <th className="px-6 py-4 text-[0.74rem] font-semibold uppercase tracking-wider text-ink-muted">Data</th>
                <th className="px-6 py-4 text-[0.74rem] font-semibold uppercase tracking-wider text-ink-muted">Produto</th>
                <th className="px-6 py-4 text-center text-[0.74rem] font-semibold uppercase tracking-wider text-ink-muted">Quantidade</th>
                <th className="px-6 py-4 text-right text-[0.74rem] font-semibold uppercase tracking-wider text-ink-muted">Preço Custo</th>
                <th className="px-6 py-4 text-right text-[0.74rem] font-semibold uppercase tracking-wider text-ink-muted">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule-soft">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-ink-muted"
                  >
                    Carregando entradas...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-ink-muted"
                  >
                    Nenhuma entrada registrada.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-bg-hover transition-colors"
                  >
                    <td className="px-6 py-4 text-ink-soft">
                      {format(new Date(entry.created_at), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </td>
                    <td className="px-6 py-4 font-medium text-ink">
                      {getProductName(entry.product_id)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md border border-rule-soft bg-bg-card text-xs font-medium text-brand-marrom-escuro">
                        <ArrowUpRight className="h-3 w-3 mr-1 text-brand-verde" />+
                        {entry.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-ink-soft">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(entry.cost_price)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-ink">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(entry.total_cost)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
