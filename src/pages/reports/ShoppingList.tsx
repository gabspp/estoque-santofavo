import { useState, useEffect } from "react";
import { Download, Printer, Search, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { productService } from "@/services/productService";
import { storeService } from "@/services/storeService";
import { type Product, type Store } from "@/types";
import { exportToCSV } from "@/utils/export";


export default function ShoppingList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allProducts, allStores] = await Promise.all([
        productService.getProducts(),
        storeService.getAll()
      ]);
      setProducts(allProducts);
      setStores(allStores);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGroupedData = () => {
    const filteredProducts = products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const result: { store: Store; categories: { [category: string]: Product[] } }[] = [];

    stores.forEach((store) => {
      const storeCategories: { [category: string]: Product[] } = {};
      let hasItems = false;

      filteredProducts.forEach((product) => {
        const isActive = product.active_status?.[store.id] !== false;
        if (!isActive) return;

        const storeStock = product.inventory?.[store.id] ?? 0;
        if (storeStock <= product.min_stock) {
          hasItems = true;
          if (!storeCategories[product.category]) {
            storeCategories[product.category] = [];
          }
          storeCategories[product.category].push(product);
        }
      });

      if (hasItems) {
        result.push({
          store,
          categories: storeCategories,
        });
      }
    });

    return result;
  };

  const groupedData = getGroupedData();
  const hasAnyItems = groupedData.length > 0;

  const handleExport = () => {
    const dataToExport: any[] = [];

    groupedData.forEach(({ store, categories }) => {
      Object.entries(categories).forEach(([category, catProducts]) => {
        catProducts.forEach((p) => {
          const storeStock = p.inventory?.[store.id] ?? 0;
          dataToExport.push({
            Loja: store.name,
            Categoria: category,
            Produto: p.name,
            "Estoque Atual": storeStock,
            "Estoque Mínimo": p.min_stock,
            "Sugestão de Compra": Math.ceil(p.min_stock * 1.5 - storeStock),
            Unidade: p.unit,
            "Código de Barras": p.barcode || "-",
          });
        });
      });
    });

    exportToCSV(
      dataToExport,
      `lista_compras_${new Date().toISOString().split("T")[0]}`,
    );
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading)
    return <div className="p-8 text-center text-ink-muted font-medium">Carregando lista de compras...</div>;

  return (
    <div className="space-y-6 print:space-y-4 font-sans select-none">
      {/* Header - Hidden on print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-ink">
            Lista de Compras
          </h1>
          <p className="text-xs text-ink-muted font-medium uppercase tracking-wider mt-0.5">
            Produtos com estoque abaixo do mínimo de segurança agrupados por loja
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="h-9 text-xs">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button
            onClick={handleExport}
            disabled={!hasAnyItems}
            className="h-9 text-xs"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block mb-4 border-b border-rule pb-2">
        <h1 className="font-serif text-2xl font-medium text-ink">Lista de Reposição de Estoque · Santo Favo</h1>
        <p className="text-xs text-ink-muted font-bold uppercase tracking-wider mt-0.5">Gerado em {new Date().toLocaleDateString()}</p>
      </div>

      {/* Search Filter - Hidden on print */}
      <div className="flex gap-4 items-center print:hidden">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
          <Input
            placeholder="Pesquise por produto ou grupo..."
            className="pl-9 h-9 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grouped Data Lists */}
      <div className="space-y-8 print:space-y-6">
        {hasAnyItems ? (
          groupedData.map(({ store, categories }) => (
            <div key={store.id} className="space-y-4 border border-rule-soft rounded-lg overflow-hidden print:border-none print:space-y-3">
              {/* Store Title Bar - Glassy look on screen, simple clean layout on print */}
              <div className="bg-bg-soft/75 px-5 py-3 border-b border-rule-soft flex justify-between items-center print:bg-transparent print:border-b-2 print:border-ink print:px-0 print:py-1">
                <h2 className="font-serif text-lg font-semibold text-ink print:text-md print:font-bold">{store.name}</h2>
              </div>

              <div className="p-4 space-y-6 print:p-0 print:space-y-4">
                {Object.entries(categories).map(([category, catProducts]) => (
                  <div key={category} className="space-y-3 print:space-y-2">
                    {/* Category Title Section Head */}
                    <div className="flex items-baseline justify-between gap-3 pb-1 border-b border-rule-soft select-none print:border-rule">
                      <h3 className="font-sans font-semibold text-[0.74rem] uppercase tracking-widest text-ink-soft print:text-xs">
                        {category}
                      </h3>
                      <span className="text-[10px] font-bold text-ink-muted uppercase print:text-[9px]">
                        {catProducts.length} itens
                      </span>
                    </div>

                    <Card className="overflow-hidden print:border-none">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                          <thead className="bg-bg-soft/20 border-b border-rule-soft print:border-ink">
                            <tr>
                              <th className="px-5 py-2.5 font-sans font-semibold text-xs uppercase tracking-wider text-ink-muted">Produto</th>
                              <th className="px-5 py-2.5 text-center font-sans font-semibold text-xs uppercase tracking-wider text-ink-muted">Referência</th>
                              <th className="px-5 py-2.5 text-center font-sans font-semibold text-xs uppercase tracking-wider text-ink-muted">Unidade</th>
                              <th className="px-5 py-2.5 text-center font-sans font-semibold text-xs uppercase tracking-wider text-ink-muted">Estoque</th>
                              <th className="px-5 py-2.5 text-center font-sans font-semibold text-xs uppercase tracking-wider text-ink-muted">Mínimo</th>
                              <th className="px-5 py-2.5 text-center font-sans font-bold text-xs uppercase tracking-wider text-ink">Sugestão</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-rule-soft print:divide-rule-soft">
                            {catProducts.map((product) => {
                              const storeStock = product.inventory?.[store.id] ?? 0;
                              const suggestion = Math.ceil(
                                product.min_stock * 1.5 - storeStock,
                              );
                              const isCritical = storeStock <= 0;

                              return (
                                <tr
                                  key={product.id}
                                  className="hover:bg-bg-hover transition-colors print:hover:bg-transparent"
                                >
                                  <td className="px-5 py-2.5">
                                    <div className="font-medium text-ink">
                                      {product.name}
                                    </div>
                                  </td>
                                  <td className="px-5 py-2.5 text-center text-xs text-ink-muted">
                                    {product.barcode || "-"}
                                  </td>
                                  <td className="px-5 py-2.5 text-center text-ink-soft">
                                    {product.unit}
                                  </td>
                                  <td className="px-5 py-2.5 text-center font-semibold">
                                    <span
                                      className={
                                        isCritical
                                          ? "text-brand-rosa font-bold"
                                          : "text-ink"
                                      }
                                    >
                                      {storeStock}
                                    </span>
                                  </td>
                                  <td className="px-5 py-2.5 text-center text-ink-muted">
                                    {product.min_stock}
                                  </td>
                                  <td className="px-5 py-2.5 text-center font-bold text-ink bg-bg-soft/10">
                                    {Math.max(0, suggestion)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <Card className="p-12 text-center text-ink-muted font-medium bg-bg-card rounded-lg border border-rule-soft border-dashed">
            <div className="flex flex-col items-center justify-center gap-3">
              <ShoppingCart className="h-8 w-8 text-ink-muted opacity-50" />
              <p className="text-base text-ink">Nenhum produto precisando de reposição no momento.</p>
              <p className="text-xs text-ink-muted uppercase font-bold tracking-wider">O estoque de todas as lojas está acima do mínimo.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
