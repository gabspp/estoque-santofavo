import { useState, useEffect } from "react";

import { ShoppingCart, Download, Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { productService } from "@/services/productService";
import { type Product } from "@/types";
import { exportToCSV } from "@/utils/export";

export default function ShoppingList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allProducts = await productService.getProducts();
      // Filter products needing restock (Current <= Min)
      const lowStock = allProducts.filter(
        (p) => p.current_stock <= p.min_stock,
      );
      setProducts(lowStock);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleExport = () => {
    const dataToExport = filteredProducts.map((p) => ({
      Produto: p.name,
      Categoria: p.category,
      "Estoque Atual": p.current_stock,
      "Estoque Mínimo": p.min_stock,
      "Sugestão de Compra": Math.ceil(p.min_stock * 1.5 - p.current_stock), // Suggesting 50% buffer over min
      Unidade: p.unit,
    }));
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
          <p className="text-gray-500">Produtos com estoque baixo ou zerado</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button
            onClick={handleExport}
            disabled={filteredProducts.length === 0}
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
            placeholder="Buscar produto..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden print:shadow-none print:border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-100 print:bg-white print:border-black">
              <tr>
                <th className="px-6 py-3">Produto</th>
                <th className="px-6 py-3 text-center">Referência</th>
                <th className="px-6 py-3 text-center">Estoque Atual</th>
                <th className="px-6 py-3 text-center">Mínimo</th>
                <th className="px-6 py-3 text-center font-bold text-gray-900">
                  Sugestão
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 print:divide-gray-300">
              {filteredProducts.map((product) => {
                const suggestion = Math.ceil(
                  product.min_stock * 1.5 - product.current_stock,
                );
                const isCritical = product.current_stock <= 0;

                return (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50/50 print:hover:bg-white"
                  >
                    <td className="px-6 py-3">
                      <div className="font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.category} ({product.unit})
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center text-xs text-gray-500">
                      {product.barcode || "-"}
                    </td>
                    <td className="px-6 py-3 text-center font-medium">
                      <span
                        className={
                          isCritical
                            ? "text-red-600 font-bold"
                            : "text-gray-900"
                        }
                      >
                        {product.current_stock}
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
              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingCart className="h-8 w-8 text-gray-300" />
                      <p>Nenhum produto precisando de reposição no momento.</p>
                      <p className="text-xs">Ou ajuste os filtros de busca.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
