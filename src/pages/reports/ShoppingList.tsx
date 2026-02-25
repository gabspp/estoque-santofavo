import { useState, useEffect } from "react";

import { ShoppingCart, Download, Printer, Search } from "lucide-react";
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
    return <div className="p-8 text-center">Carregando lista...</div>;

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header - Hidden on print if desired, or styled differently */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-brand-brown">
            Lista de Compras
          </h1>
          <p className="text-gray-500">Produtos com estoque baixo ou zerado por loja</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button
            onClick={handleExport}
            disabled={!hasAnyItems}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold">Lista de Reposição - Santo Favo</h1>
        <p className="text-sm">Gerado em {new Date().toLocaleDateString()}</p>
      </div>

      <div className="flex gap-4 items-center print:hidden">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar produto ou categoria..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-8">
        {hasAnyItems ? (
          groupedData.map(({ store, categories }) => (
            <div key={store.id} className="space-y-4 border rounded-xl overflow-hidden print:border-none print:space-y-2">
              <div className="bg-brand-brown text-white px-6 py-4 print:bg-gray-100 print:text-black print:py-2">
                <h2 className="text-xl font-bold">{store.name}</h2>
              </div>

              <div className="p-4 space-y-6 print:p-0">
                {Object.entries(categories).map(([category, catProducts]) => (
                  <div key={category} className="space-y-4 print:space-y-2 print:border-b print:border-gray-200 print:pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 px-2 print:text-md">
                      {category}
                    </h3>

                    <Card className="overflow-hidden shadow-sm border print:shadow-none print:border-none">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-100 print:bg-white print:border-black">
                            <tr>
                              <th className="px-6 py-3">Produto</th>
                              <th className="px-6 py-3 text-center">Referência</th>
                              <th className="px-6 py-3 text-center">Unidade</th>
                              <th className="px-6 py-3 text-center">Estoque Atual</th>
                              <th className="px-6 py-3 text-center">Mínimo</th>
                              <th className="px-6 py-3 text-center font-bold text-gray-900">
                                Sugestão
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                            {catProducts.map((product) => {
                              const storeStock = product.inventory?.[store.id] ?? 0;
                              const suggestion = Math.ceil(
                                product.min_stock * 1.5 - storeStock,
                              );
                              const isCritical = storeStock <= 0;

                              return (
                                <tr
                                  key={product.id}
                                  className="hover:bg-gray-50/50 print:hover:bg-white"
                                >
                                  <td className="px-6 py-3">
                                    <div className="font-medium text-gray-900">
                                      {product.name}
                                    </div>
                                  </td>
                                  <td className="px-6 py-3 text-center text-xs text-gray-500">
                                    {product.barcode || "-"}
                                  </td>
                                  <td className="px-6 py-3 text-center text-gray-500">
                                    {product.unit}
                                  </td>
                                  <td className="px-6 py-3 text-center font-medium">
                                    <span
                                      className={
                                        isCritical
                                          ? "text-red-600 font-bold"
                                          : "text-gray-900"
                                      }
                                    >
                                      {storeStock}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3 text-center text-gray-500">
                                    {product.min_stock}
                                  </td>
                                  <td className="px-6 py-3 text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 print:border print:border-gray-300">
                                      {Math.max(0, suggestion)}
                                    </span>
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
          <Card className="overflow-hidden print:shadow-none print:border-none">
            <div className="px-6 py-12 text-center text-gray-500">
              <div className="flex flex-col items-center justify-center gap-2">
                <ShoppingCart className="h-8 w-8 text-gray-300" />
                <p>Nenhum produto precisando de reposição no momento.</p>
                <p className="text-xs">Ou ajuste os filtros de busca.</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
