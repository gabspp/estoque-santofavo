import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, Send, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { countingService } from "@/services/countingService";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { storeService } from "@/services/storeService";
import { type StockCount, type StockCountItem, type Product, type Subcategory } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

export default function CountingArea() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [count, setCount] = useState<StockCount | null>(null);
  const [items, setItems] = useState<StockCountItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("Todos");
  const [storeName, setStoreName] = useState<string>("");

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (countId: string) => {
    try {
      const [countData, productsData, subcategoriesData] = await Promise.all([
        countingService.getCountById(countId),
        productService.getProducts(),
        categoryService.getAllSubcategories()
      ]);

      if (!countData) {
        toast({
          title: "Contagem não encontrada",
          variant: "destructive",
        });
        navigate("/contagem");
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

      // Initialize items if empty (first load)
      let initialItems = countData.items;
      if (initialItems.length === 0) {
        initialItems = productsData.map((p) => ({
          product_id: p.id,
          quantity_counted: 0,
          quantity_system: p.current_stock,
        }));
      }

      setCount(countData);
      productsData.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

      const activeProductsData = countData.store_id
        ? productsData.filter(p => p.active_status?.[countData.store_id!] !== false)
        : productsData;

      setProducts(activeProductsData);
      setSubcategories(subcategoriesData);
      setItems(initialItems);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Tente recarregar a página.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId: string, qty: string) => {
    const value = parseFloat(qty);
    if (isNaN(value) && qty !== "") return; // Allow empty string for backspace

    setItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, quantity_counted: isNaN(value) ? 0 : value } // Handle empty as 0 or keep as is? Usually 0.
          : item,
      ),
    );
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await countingService.updateCount(id, items);
      toast({
        title: "Rascunho salvo",
        description: "O progresso foi salvo com sucesso.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o rascunho.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!id) return;
    if (
      !confirm(
        "Deseja realmente finalizar a contagem? Essa ação enviará para aprovação.",
      )
    )
      return;

    setSaving(true);
    try {
      // Save first to ensure latest data
      await countingService.updateCount(id, items);
      await countingService.finalizeCount(id);

      toast({
        title: "Contagem finalizada!",
        description: "Enviada para aprovação do gerente.",
        variant: "success",
      });
      navigate("/contagem");
    } catch (error) {
      console.error("Error finalizing:", error);
      toast({
        title: "Erro ao finalizar",
        description: "Verifique se todos os itens foram preenchidos.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Filter Logic
  // Get all Subcategories present in the product list + "Todos"
  const availableSubcategoryIds = Array.from(new Set(products.map(p => p.subcategory_id).filter(Boolean))) as string[];

  const availableSubcategories = availableSubcategoryIds
    .map(id => subcategories.find(s => s.id === id))
    .filter((s): s is Subcategory => !!s)
    .sort((a, b) => a.name.localeCompare(b.name));

  const filterTabs = [
    { id: "Todos", name: "Todos" },
    ...availableSubcategories.map(s => ({ id: s.id, name: s.name }))
  ];

  const filteredItems = items.filter((item) => {
    const product = products.find((p) => p.id === item.product_id);
    if (!product) return false;

    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchTerm));

    const matchesSubcategory =
      activeSubcategory === "Todos" || product.subcategory_id === activeSubcategory;

    return matchesSearch && matchesSubcategory;
  });

  if (loading)
    return <div className="p-8 text-center">Carregando contagem...</div>;

  return (
    <div className="space-y-6 pb-20">
      {" "}
      {/* pb-20 for bottom action bar */}
      {/* Header with Back button, Count ID, and Status */}
      <div className="flex flex-col gap-4 bg-white p-4 -mx-4 -mt-4 shadow-sm sm:mx-0 sm:mt-0 sm:rounded-lg sm:p-6 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <Link to="/contagem" className="text-gray-500 hover:text-brand-brown">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="text-center">
            <div className="text-sm text-gray-500">Contagem {storeName && ` - ${storeName}`}</div>
            <div className="font-bold text-lg">#{id?.substring(0, 6)}</div>
          </div>
          <div
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              count?.status === "draft"
                ? "bg-gray-100 text-gray-700"
                : "bg-yellow-100 text-yellow-800",
            )}
          >
            {count?.status === "draft" ? "Rascunho" : "Em Análise"}
          </div>
        </div>

        {/* Filters (Search and Category) */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou código de barras..."
              className="pl-9 bg-gray-50 border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubcategory(tab.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  activeSubcategory === tab.id
                    ? "bg-brand-brown text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                )}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Items List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredItems.map((item) => {
          const product = products.find((p) => p.id === item.product_id);
          if (!product) return null;

          return (
            <Card key={item.product_id} className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center shrink-0 font-bold text-gray-400 text-lg">
                {product.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {product.name}
                </div>
                <div className="text-sm text-gray-500">
                  {/* Simplified: No category/subcategory, just unit */}
                  {product.unit}
                </div>
              </div>
              <div className="w-24 shrink-0">
                <Input
                  type="number"
                  inputMode="decimal"
                  className="text-center font-lg h-12"
                  placeholder="0"
                  value={item.quantity_counted}
                  onChange={(e) =>
                    handleQuantityChange(item.product_id, e.target.value)
                  }
                  onFocus={(e) => e.target.select()}
                />
              </div>
            </Card>
          );
        })}
        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nenhum produto encontrado.
          </div>
        )}
      </div>
      {/* Floating Action Bar (Save and Finalize) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:pl-64 z-20">
        <Button
          className="flex-1"
          variant="outline"
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="h-4 w-4 mr-2" />
          Salvar Rascunho
        </Button>
        <Button
          className="flex-1 bg-green-600 hover:bg-green-700"
          onClick={handleFinalize}
          disabled={saving}
        >
          <Send className="h-4 w-4 mr-2" />
          Finalizar
        </Button>
      </div>
    </div>
  );
}
