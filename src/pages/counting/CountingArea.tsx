import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, Send, Search, Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { countingService } from "@/services/countingService";
import { productService } from "@/services/productService";
import { storeService } from "@/services/storeService";
import { type StockCount, type StockCountItem, type Product, type Subcategory } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const CATEGORY_ORDER = [
  "Insumos (Confeitaria)",
  "Insumos (Salgados)",
  "Insumos (Bar)",
  "Embalagens",
  "Material de Consumo",
  "Material de Apoio"
];

const SUBCATEGORY_ORDER: Record<string, string[]> = {
  "Insumos (Confeitaria)": [
    "Farinhas e Amidos",
    "Açúcares e Adoçantes",
    "Laticínios e Derivados",
    "Chocolates e Derivados de Cacau",
    "Aditivos e Auxiliares",
    "Óleos e Gorduras",
    "Especiarias e Aromatizantes",
    "Frutas Secas e Oleaginosas",
    "Hortifruit",
    "Outros Insumos de Confeitaria"
  ],
  "Insumos (Salgados)": [
    "Insumos para Panificação",
    "Queijos e Laticínios",
    "Ervas e Legumes",
    "Proteínas",
    "Mercearia e Temperos",
    "Outros Insumos de salgados"
  ],
  "Insumos (Bar)": [
    "Bebidas Para Revenda",
    "Saches",
    "Leites",
    "Bases e Ingredientes",
    "Outros Insumos para Bar"
  ],
  "Embalagens": [
    "Papéis para PDM",
    "Embalagens para Produtos",
    "Caixas",
    "Sacos e Sacolas",
    "Cordas",
    "Etiquetas"
  ],
  "Material de Consumo": [
    "Utensílios de Produção",
    "Papel",
    "Descartáveis"
  ],
  "Material de Apoio": [
    "Material de Escritório/Diversos",
    "Material de Limpeza"
  ]
};

const CATEGORY_COLORS: Record<string, { base: string; active: string; completed: string }> = {
  confeitaria: {
    base: "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100",
    active: "bg-amber-500 text-white shadow-md border-amber-500",
    completed: "bg-amber-100 text-amber-700 border-amber-300",
  },
  salgado: {
    base: "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100",
    active: "bg-rose-500 text-white shadow-md border-rose-500",
    completed: "bg-rose-100 text-rose-700 border-rose-300",
  },
  bar: {
    base: "bg-violet-50 text-violet-800 border-violet-200 hover:bg-violet-100",
    active: "bg-violet-500 text-white shadow-md border-violet-500",
    completed: "bg-violet-100 text-violet-700 border-violet-300",
  },
  embalagem: {
    base: "bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100",
    active: "bg-sky-500 text-white shadow-md border-sky-500",
    completed: "bg-sky-100 text-sky-700 border-sky-300",
  },
  consumo: {
    base: "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
    active: "bg-emerald-500 text-white shadow-md border-emerald-500",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-300",
  },
  apoio: {
    base: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200",
    active: "bg-slate-500 text-white shadow-md border-slate-500",
    completed: "bg-slate-200 text-slate-700 border-slate-300",
  },
};

const getTabColor = (parentCategory: string, active: boolean, completed: boolean): string => {
  const n = parentCategory.toLowerCase();
  const scheme =
    n.includes("salgado") ? CATEGORY_COLORS.salgado :
      n.includes("bar") ? CATEGORY_COLORS.bar :
        n.includes("confeitaria") || n.includes("insumo") ? CATEGORY_COLORS.confeitaria :
          n.includes("embalagem") ? CATEGORY_COLORS.embalagem :
            n.includes("consumo") ? CATEGORY_COLORS.consumo :
              CATEGORY_COLORS.apoio;

  if (completed && active) return scheme.active;
  if (completed) return scheme.completed;
  if (active) return scheme.active;
  return scheme.base;
};

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
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("");
  const [storeName, setStoreName] = useState<string>("");
  const [completedSubcategories, setCompletedSubcategories] = useState<string[]>([]);

  // UI States
  const [localInputs, setLocalInputs] = useState<Record<string, string>>({});
  const [localToBuy, setLocalToBuy] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      toast({
        title: "Lembrete",
        description: "Lembre-se de salvar o rascunho periodicamente para não perder seu progresso.",
      });
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [toast]);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (countId: string) => {
    try {
      const [countData, productsData, subcatsData] = await Promise.all([
        countingService.getCountById(countId),
        productService.getProducts(),
        productService.getSubcategories(),
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

      setCompletedSubcategories(countData.completed_categories || []);

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

      // Sort items by code, fallback to name
      productsData.sort((a, b) => {
        if (a.code !== undefined && b.code !== undefined) {
          return a.code - b.code;
        }
        if (a.code !== undefined) return -1;
        if (b.code !== undefined) return 1;
        return a.name.localeCompare(b.name);
      });

      const activeProductsData = countData.store_id
        ? productsData.filter(p => p.active_status?.[countData.store_id!] !== false)
        : productsData;

      setProducts(activeProductsData);
      setSubcategories(subcatsData);
      setItems(initialItems);

      const inputsMap: Record<string, string> = {};
      const toBuyMap: Record<string, boolean> = {};
      initialItems.forEach(i => {
        inputsMap[i.product_id] = i.quantity_counted === 0 ? "" : i.quantity_counted.toString();
        toBuyMap[i.product_id] = i.to_buy ?? false;
      });
      setLocalInputs(inputsMap);
      setLocalToBuy(toBuyMap);

      // Setup initial tab layout
      const firstCat = CATEGORY_ORDER[0];
      const firstSubcat = SUBCATEGORY_ORDER[firstCat]?.[0] || "";

      setActiveCategory(firstCat);
      setActiveSubcategory(firstSubcat);
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

  const handleToBuyChange = (productId: string, value: boolean) => {
    setLocalToBuy(prev => ({ ...prev, [productId]: value }));
    setItems(prev =>
      prev.map(item =>
        item.product_id === productId ? { ...item, to_buy: value } : item
      )
    );
  };

  const handleQuantityChange = (productId: string, qty: string) => {
    setLocalInputs(prev => ({ ...prev, [productId]: qty }));
    const value = parseFloat(qty);

    setItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, quantity_counted: isNaN(value) ? 0 : value }
          : item,
      ),
    );
  };

  const handleSave = async (silent = false, extraCompleted?: string[]) => {
    if (!id) return;
    setSaving(true);
    try {
      const newCompleted = extraCompleted || completedSubcategories;
      await countingService.updateCount(id, items, newCompleted);
      if (!silent) {
        toast({
          title: "Rascunho salvo",
          description: "O progresso foi salvo com sucesso.",
          variant: "success",
        });
      }
    } catch (error) {
      console.error("Error saving:", error);
      if (!silent) {
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar o rascunho.",
          variant: "destructive",
        });
      }
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
      await countingService.updateCount(id, items, completedSubcategories);
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

  const advanceToNextUncompleted = (newCompleted: string[]) => {
    for (const cat of CATEGORY_ORDER) {
      const subcats = SUBCATEGORY_ORDER[cat] || [];
      for (const subcat of subcats) {
        if (!newCompleted.includes(subcat)) {
          setActiveCategory(cat);
          setActiveSubcategory(subcat);
          return;
        }
      }
    }
  };

  const handleCompleteSubcategory = () => {
    if (!activeSubcategory) return;

    let newCompleted = [...completedSubcategories];
    if (!newCompleted.includes(activeSubcategory)) {
      newCompleted.push(activeSubcategory);
      setCompletedSubcategories(newCompleted);
    }

    // Auto-save when completing
    handleSave(true, newCompleted);

    toast({
      title: "Subcategoria concluída!",
      description: `${activeSubcategory} marcada como conferida.`,
      variant: "success"
    });

    advanceToNextUncompleted(newCompleted);
  };

  // Resolve subcategories map
  const subcatMap = Object.fromEntries(subcategories.map(s => [s.id, s.name]));

  // For each product, resolve the exact subcategory name it belongs to
  const getProductSubcategory = (p: Product): string =>
    (p.subcategory_id && subcatMap[p.subcategory_id]) || p.category || "Sem categoria";

  const filteredItems = items.filter((item) => {
    const product = products.find((p) => p.id === item.product_id);
    if (!product) return false;

    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchTerm));

    const productSubcat = getProductSubcategory(product);
    const matchesCategory = productSubcat === activeSubcategory;

    return matchesSearch && matchesCategory;
  });

  if (loading)
    return <div className="p-8 text-center">Carregando contagem...</div>;

  const isCurrentSubcategoryCompleted = completedSubcategories.includes(activeSubcategory);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col gap-4 bg-white p-4 -mx-4 -mt-4 shadow-sm sm:mx-0 sm:mt-0 sm:rounded-lg sm:p-6 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <Link to="/contagem" className="text-gray-500 hover:text-brand-brown">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="text-center">
            {/* The Dashboard already formats Contagem #{id}, but we will also show it here briefly */}
            <div className="text-sm text-gray-500">
              Contagem
              {count?.created_at ? ` - ${new Date(count.created_at).toLocaleDateString()}` : ""}
              {storeName && ` - ${storeName}`}
            </div>
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
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou código de barras..."
              className="pl-9 bg-gray-50 border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {/* Top Tier: Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
              {CATEGORY_ORDER.map((cat) => {
                const isActive = activeCategory === cat;
                const subcats = SUBCATEGORY_ORDER[cat] || [];
                // A category is visually "completed" if all its subcategories are completed
                const isCompleted = subcats.length > 0 && subcats.every(sub => completedSubcategories.includes(sub));

                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      if (SUBCATEGORY_ORDER[cat]?.length > 0) {
                        setActiveSubcategory(SUBCATEGORY_ORDER[cat][0]);
                      }
                    }}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 border",
                      isActive
                        ? "bg-slate-800 text-white border-slate-800 shadow-md"
                        : isCompleted
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {isCompleted && <Check className="h-4 w-4 text-emerald-500" />}
                    {cat}
                  </button>
                )
              })}
            </div>

            {/* Second Tier: Subcategories */}
            {activeCategory && SUBCATEGORY_ORDER[activeCategory] && (
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                {SUBCATEGORY_ORDER[activeCategory].map((subcat) => {
                  const isActive = activeSubcategory === subcat;
                  const isCompleted = completedSubcategories.includes(subcat);

                  return (
                    <button
                      key={subcat}
                      onClick={() => setActiveSubcategory(subcat)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border border-transparent",
                        getTabColor(activeCategory, isActive, isCompleted)
                      )}
                    >
                      {isCompleted && <Check className="h-3 w-3" />}
                      {subcat}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control for Subcategory Completion */}
      <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
        <div>
          <h3 className="font-semibold text-blue-900">
            {isCurrentSubcategoryCompleted ? "Subcategoria conferida" : `Conferindo: ${activeSubcategory}`}
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            {isCurrentSubcategoryCompleted
              ? "Você já marcou essa subcategoria como concluída, mas pode ajustar se precisar."
              : `Contém ${filteredItems.length} itens para serem verificados.`}
          </p>
        </div>
        {!isCurrentSubcategoryCompleted && (
          <Button onClick={handleCompleteSubcategory} size="sm" className="hidden sm:flex bg-white hover:bg-red-50 text-red-600 border border-red-300 font-semibold shrink-0">
            <Check className="h-4 w-4 mr-2" />
            Concluir Subcategoria
          </Button>
        )}
      </div>

      {/* Items List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredItems.map((item, index) => {
          const product = products.find((p) => p.id === item.product_id);
          if (!product) return null;

          return (
            <Card
              key={item.product_id}
              className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => {
                const input = document.querySelector(`input[data-index="${index}"]`) as HTMLInputElement;
                if (input) input.focus();
              }}
            >
              <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center shrink-0 font-bold text-gray-400 text-lg">
                {product.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0 py-1">
                <div className="font-medium text-gray-900 leading-tight pr-2">
                  {product.name}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {product.unit} {product.code !== undefined ? `- Cód: ${product.code}` : ""}
                </div>
                <button
                  className={cn(
                    "mt-1.5 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border transition-colors",
                    localToBuy[item.product_id]
                      ? "bg-orange-100 text-orange-700 border-orange-300"
                      : "bg-gray-50 text-gray-400 border-gray-200 hover:border-orange-200 hover:text-orange-500"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToBuyChange(item.product_id, !localToBuy[item.product_id]);
                  }}
                >
                  <ShoppingCart className="h-3 w-3" />
                  Comprar
                </button>
              </div>
              <div className="w-24 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Input
                  type="number"
                  inputMode="decimal"
                  className="text-center font-lg h-12"
                  placeholder="0"
                  data-index={index}
                  value={localInputs[item.product_id] ?? ""}
                  onChange={(e) =>
                    handleQuantityChange(item.product_id, e.target.value)
                  }
                  onFocus={(e) => {
                    e.target.select();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement;
                      if (nextInput) {
                        nextInput.focus();
                      } else {
                        // We are at the end, suggest completing category maybe?
                      }
                    }
                  }}
                />
              </div>
            </Card>
          );
        })}
        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nenhum produto encontrado na subcategoria.
          </div>
        )}
      </div>

      {!isCurrentSubcategoryCompleted && filteredItems.length > 0 && (
        <div className="flex justify-end mt-4 px-2">
          <Button onClick={handleCompleteSubcategory} className="bg-white hover:bg-red-50 text-red-600 border border-red-300 font-semibold shadow-sm px-6">
            Concluir Subcategoria
          </Button>
        </div>
      )}

      {/* Floating Action Bar (Save and Finalize) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:pl-64 z-20">
        <Button
          className="flex-1"
          variant="outline"
          onClick={() => handleSave(false)}
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
