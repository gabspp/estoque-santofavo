import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, Send, Search, Check, ShoppingCart, Loader2 } from "lucide-react";
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
  const [storeName, setStoreName] = useState<string>("");
  const [completedSubcategories, setCompletedSubcategories] = useState<string[]>([]);

  // UI States
  const [localInputs, setLocalInputs] = useState<Record<string, string>>({});
  const [localToBuy, setLocalToBuy] = useState<Record<string, boolean>>({});
  const [focusedProductId, setFocusedProductId] = useState<string | null>(null);
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const isInitialMount = useRef(true);

  // Debounced Auto-Save
  useEffect(() => {
    if (loading || !id) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setAutoSaveStatus("saving");
    const delayDebounceFn = setTimeout(async () => {
      try {
        await countingService.updateCount(id, items, completedSubcategories);
        setAutoSaveStatus("saved");
      } catch (error) {
        console.error("Auto-save error:", error);
        setAutoSaveStatus("error");
      }
    }, 2000); // 2 seconds debounce

    return () => clearTimeout(delayDebounceFn);
  }, [items, id, completedSubcategories, loading]);

  useEffect(() => {
    const interval = setInterval(() => {
      toast({
        title: "Lembrete",
        description: "Seu progresso de contagem é salvo automaticamente no banco de dados.",
      });
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [toast]);

  // Load Main Data
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

      // Setup initial active category
      setActiveCategory(CATEGORY_ORDER[0]);
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

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

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

  const toggleSubcategoryCompleted = (subcatName: string) => {
    setCompletedSubcategories((prev) => {
      const isCompleted = prev.includes(subcatName);
      const nextList = isCompleted
        ? prev.filter((s) => s !== subcatName)
        : [...prev, subcatName];
      
      toast({
        title: isCompleted ? "Subcategoria reaberta" : "Subcategoria conferida! ✓",
        description: isCompleted 
          ? `${subcatName} foi reaberta para ajustes.` 
          : `${subcatName} foi marcada como concluída.`,
        variant: isCompleted ? "default" : "success",
      });
      return nextList;
    });
  };

  const handleSave = async (silent = false) => {
    if (!id) return;
    setSaving(true);
    try {
      await countingService.updateCount(id, items, completedSubcategories);
      if (!silent) {
        toast({
          title: "Progresso salvo com sucesso! 💾",
          description: "Seu rascunho de contagem foi atualizado.",
          variant: "success",
        });
      }
    } catch (error) {
      console.error("Error saving:", error);
      if (!silent) {
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível conectar ao banco de dados.",
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!id) return;

    // Check for leftovers/uncounted items in the whole checklist
    const uncountedCount = items.filter(
      (item) => localInputs[item.product_id] === "" || localInputs[item.product_id] === undefined
    ).length;

    if (uncountedCount > 0) {
      if (
        !confirm(
          `Atenção: Faltam ${uncountedCount} itens não contados! Eles serão computados como estoque sistêmico atual. Deseja finalizar assim mesmo?`
        )
      ) {
        return;
      }
    } else {
      if (!confirm("Tem certeza de que deseja finalizar esta contagem?")) return;
    }

    setSaving(true);
    try {
      await countingService.updateCount(id, items, completedSubcategories);
      await countingService.finalizeCount(id);
      toast({
        title: "Contagem finalizada! 🎉",
        description: "Os dados foram consolidados para análise administrativa.",
        variant: "success",
      });
      navigate("/contagem");
    } catch (error) {
      console.error("Error finalizing:", error);
      toast({
        title: "Erro ao finalizar",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Resolve subcategory names
  const subcatMap = Object.fromEntries(subcategories.map(s => [s.id, s.name]));
  const getProductSubcategory = (p: Product): string =>
    (p.subcategory_id && subcatMap[p.subcategory_id]) || p.category || "Sem categoria";

  const getSubcategoryProgress = (subcatName: string) => {
    const subcatProducts = products.filter(p => getProductSubcategory(p) === subcatName);
    const total = subcatProducts.length;
    const counted = subcatProducts.filter(p => localInputs[p.id] !== "" && localInputs[p.id] !== undefined).length;
    return { counted, total };
  };

  const getCategoryProgress = (catName: string) => {
    const subcats = SUBCATEGORY_ORDER[catName] || [];
    const catProducts = products.filter(p => subcats.includes(getProductSubcategory(p)));
    const total = catProducts.length;
    const counted = catProducts.filter(p => localInputs[p.id] !== "" && localInputs[p.id] !== undefined).length;
    return { counted, total };
  };

  // Filter items for the active Category view
  const subcats = SUBCATEGORY_ORDER[activeCategory] || [];
  const allFilteredItems = items.filter((item) => {
    const product = products.find((p) => p.id === item.product_id);
    if (!product) return false;

    // Search query matching
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchTerm)) ||
      (product.code !== undefined && product.code.toString().includes(searchTerm));

    // Category matching (belongs to active category's subcategories)
    const productSubcat = getProductSubcategory(product);
    const matchesCategory = subcats.includes(productSubcat);

    // Filter uncounted/pending logic
    const isPending = localInputs[item.product_id] === "" || localInputs[item.product_id] === undefined;
    const matchesPending = !showOnlyPending || isPending;

    return matchesSearch && matchesCategory && matchesPending;
  });

  // Calculate overall uncounted count globally
  const globalUncountedCount = items.filter(
    (item) => localInputs[item.product_id] === "" || localInputs[item.product_id] === undefined
  ).length;

  const totalItems = items.length;
  const countedItems = totalItems - globalUncountedCount;
  const globalProgress = totalItems > 0 ? (countedItems / totalItems) * 100 : 0;

  // Barcode scanner integration: auto focus and select
  useEffect(() => {
    if (!searchTerm) return;

    const matches = allFilteredItems.filter((item) => {
      const product = products.find((p) => p.id === item.product_id);
      return product && product.barcode === searchTerm.trim();
    });

    if (matches.length === 1) {
      const matchedItem = matches[0];
      setTimeout(() => {
        const input = document.getElementById(`input-${matchedItem.product_id}`) as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
        setSearchTerm(""); // clear query
        toast({
          title: "Produto Escaneado 🏷️",
          description: products.find(p => p.id === matchedItem.product_id)?.name || "Produto focado",
          variant: "success",
        });
      }, 100);
    }
  }, [searchTerm, allFilteredItems, products, toast]);

  if (loading)
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-[50vh] gap-3 text-ink-muted">
        <Loader2 className="h-8 w-8 animate-spin text-ink" />
        <span>Carregando área de contagem...</span>
      </div>
    );

  return (
    <div className="space-y-6 pb-28 relative font-sans">
      {/* Sticky Premium Header Container */}
      <div className="sticky top-0 z-20 flex flex-col gap-4 bg-bg border-b border-rule-soft pb-4 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pt-0">
        
        {/* Row 1: Back, Title, Auto-Save Status */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/contagem" className="p-1.5 hover:bg-bg-hover rounded-lg text-ink transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-ink-muted leading-tight">
                {storeName || "Santo Favo"} · Contagem Física
              </div>
              <h1 className="font-serif text-lg text-ink font-semibold mt-0.5 leading-tight">
                Ciclo #{id?.substring(0, 6)}
              </h1>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0 select-none">
            <div className="px-2 py-0.5 border border-rule-soft rounded bg-bg-card text-[10px] font-bold uppercase tracking-wider text-ink-soft">
              {count?.status === "draft" ? "Rascunho" : "Concluído"}
            </div>
            {autoSaveStatus !== "idle" && (
              <span className="text-[9px] font-bold tracking-wider uppercase transition-all duration-300">
                {autoSaveStatus === "saving" && (
                  <span className="text-brand-marrom animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-brand-marrom rounded-full animate-ping" />
                    Salvando...
                  </span>
                )}
                {autoSaveStatus === "saved" && (
                  <span className="text-green-600 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Salvo
                  </span>
                )}
                {autoSaveStatus === "error" && (
                  <span className="text-brand-rosa flex items-center gap-1">
                    ⚠️ Erro ao salvar
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Global Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-baseline text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            <span>Progresso Geral do Ciclo</span>
            <span className="text-ink font-bold leading-none">
              {countedItems} de {totalItems} contados ({globalProgress.toFixed(0)}%)
            </span>
          </div>
          <div className="w-full bg-bg-soft rounded-full h-2.5 overflow-hidden border border-rule-soft p-[1px]">
            <div
              className="bg-brand-marrom-escuro h-full rounded-full transition-all duration-300"
              style={{ width: `${globalProgress}%` }}
            />
          </div>
        </div>

        {/* Row 3: Filters (Search Box + "Não contados (N)" toggle) */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
            <Input
              placeholder="Pesquise por nome, código ou bipa o código de barras..."
              className="pl-9 h-9 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button
            variant={showOnlyPending ? "primary" : "outline"}
            onClick={() => setShowOnlyPending(!showOnlyPending)}
            className="h-9 text-xs font-semibold shrink-0"
          >
            {showOnlyPending ? "Ver Todos" : `Não contados (${globalUncountedCount})`}
          </Button>
        </div>

        {/* Row 4: Top Tier Category scroll controls */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          {CATEGORY_ORDER.map((cat) => {
            const isActive = activeCategory === cat;
            const subcats = SUBCATEGORY_ORDER[cat] || [];
            const isCompleted = subcats.length > 0 && subcats.every(sub => completedSubcategories.includes(sub));
            const { counted, total } = getCategoryProgress(cat);

            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors flex items-center gap-1.5 border select-none",
                  isActive
                    ? "bg-ink text-bg border-ink font-bold"
                    : isCompleted
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-bg-card text-ink-soft border-rule-soft hover:bg-bg-hover"
                )}
              >
                {isCompleted && <Check className="h-3.5 w-3.5 text-green-600" />}
                <span>{cat}</span>
                {total > 0 && !isCompleted && (
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                    isActive ? "bg-bg-soft text-ink" : "bg-bg-soft text-ink-soft"
                  )}>
                    {counted}/{total}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Items List (Continuous scroll grouped by subcategory) */}
      <div className="space-y-8 mt-2">
        {subcats.map((subcat) => {
          const subcatItems = allFilteredItems.filter((item) => {
            const product = products.find((p) => p.id === item.product_id);
            return product && getProductSubcategory(product) === subcat;
          });

          if (subcatItems.length === 0) return null;

          const isCompleted = completedSubcategories.includes(subcat);
          const { counted, total } = getSubcategoryProgress(subcat);

          return (
            <div key={subcat} className="space-y-3">
              {/* Sticky Subcategory Header Divider */}
              <div className="sticky top-[215px] sm:top-[175px] z-10 bg-bg py-2.5 border-b border-rule flex justify-between items-baseline select-none">
                <h3 className="font-serif font-medium text-base text-ink tracking-tight">
                  {subcat}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">
                    {counted} / {total} contados
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleSubcategoryCompleted(subcat)}
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer leading-tight",
                      isCompleted
                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        : "bg-transparent text-ink-muted border border-rule-soft hover:bg-bg-hover hover:text-ink"
                    )}
                  >
                    {isCompleted ? "✓ Conferido" : "Marcar Conferido"}
                  </button>
                </div>
              </div>

              {/* Grid of Items */}
              <div className="grid grid-cols-1 gap-3">
                {subcatItems.map((item) => {
                  const product = products.find((p) => p.id === item.product_id);
                  if (!product) return null;

                  const isCounted = localInputs[item.product_id] !== "" && localInputs[item.product_id] !== undefined;

                  return (
                    <Card
                      key={item.product_id}
                      className={cn(
                        "p-4 flex items-center justify-between gap-4 cursor-pointer transition-all duration-200 border",
                        isCounted
                          ? "border-rule-soft bg-bg-card opacity-100"
                          : "border-rule border-dashed bg-bg-soft/30 opacity-60 hover:opacity-85",
                        focusedProductId === item.product_id && "border-ink bg-bg-hover/10"
                      )}
                      onClick={() => {
                        const input = document.getElementById(`input-${item.product_id}`) as HTMLInputElement;
                        if (input) input.focus();
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className={cn(
                            "font-sans font-medium text-base text-ink leading-tight",
                            isCounted ? "" : "text-ink-soft"
                          )}>
                            {product.name}
                          </span>
                          {isCounted && (
                            <span className="text-green-600 font-bold text-xs shrink-0 select-none">✓</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-ink-muted font-medium">
                            {product.unit} {product.code !== undefined ? `· Cód: ${product.code}` : ""}
                          </span>
                          
                          {/* Discretized Buy button as a tiny tag */}
                          <button
                            type="button"
                            className={cn(
                              "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer leading-tight",
                              localToBuy[item.product_id]
                                ? "bg-brand-rosa/20 text-brand-rosa border border-brand-rosa/30"
                                : "bg-transparent text-ink-muted border border-rule-soft hover:border-brand-rosa/40 hover:text-brand-rosa"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToBuyChange(item.product_id, !localToBuy[item.product_id]);
                            }}
                          >
                            <ShoppingCart className="h-2.5 w-2.5 shrink-0" />
                            {localToBuy[item.product_id] ? "Comprar ✓" : "Comprar"}
                          </button>
                        </div>
                      </div>

                      {/* Tactile Numeric Stepper Widget */}
                      <div className="flex items-center rounded-lg border border-rule bg-bg overflow-hidden h-[42px] shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="w-[40px] h-[42px] bg-bg-soft hover:bg-bg-hover text-ink text-lg font-medium transition-colors border-r border-rule-soft flex items-center justify-center select-none cursor-pointer"
                          onClick={() => {
                            const currentVal = parseFloat(localInputs[item.product_id] || "0");
                            const newVal = Math.max(0, currentVal - 1);
                            handleQuantityChange(item.product_id, newVal.toString());
                          }}
                        >
                          -
                        </button>
                        <input
                          id={`input-${item.product_id}`}
                          type="number"
                          inputMode="decimal"
                          placeholder="—"
                          className="w-[60px] h-[42px] bg-transparent text-center text-sm font-medium text-ink focus:outline-none focus:ring-0 placeholder:text-ink-muted border-0"
                          value={localInputs[item.product_id] ?? ""}
                          onChange={(e) => handleQuantityChange(item.product_id, e.target.value)}
                          onFocus={(e) => {
                            e.target.select();
                            setFocusedProductId(item.product_id);
                          }}
                          onBlur={() => setFocusedProductId(null)}
                          onKeyDown={(e) => {
                            const currentIndex = allFilteredItems.findIndex(fi => fi.product_id === item.product_id);
                            if (e.key === 'Enter' || e.key === 'ArrowDown') {
                              e.preventDefault();
                              if (currentIndex < allFilteredItems.length - 1) {
                                const nextId = allFilteredItems[currentIndex + 1].product_id;
                                document.getElementById(`input-${nextId}`)?.focus();
                              }
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              if (currentIndex > 0) {
                                const prevId = allFilteredItems[currentIndex - 1].product_id;
                                document.getElementById(`input-${prevId}`)?.focus();
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="w-[40px] h-[42px] bg-bg-soft hover:bg-bg-hover text-ink text-lg font-medium transition-colors border-l border-rule-soft flex items-center justify-center select-none cursor-pointer"
                          onClick={() => {
                            const currentVal = parseFloat(localInputs[item.product_id] || "0");
                            const newVal = currentVal + 1;
                            handleQuantityChange(item.product_id, newVal.toString());
                          }}
                        >
                          +
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        {allFilteredItems.length === 0 && (
          <div className="text-center py-16 text-ink-muted font-medium bg-bg-card rounded-lg border border-rule-soft border-dashed">
            Nenhum produto pendente de contagem nesta categoria.
          </div>
        )}
      </div>

      {/* Floating Action Bar (Save and Finalize) conforming to Spec (no shadow, rule border) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg/95 backdrop-blur-md border-t border-rule-soft flex gap-3 md:pl-64 z-20 shadow-none">
        <Button
          className="flex-1"
          variant="outline"
          onClick={() => handleSave(false)}
          disabled={saving}
        >
          <Save className="h-4 w-4 mr-2 shrink-0" />
          Salvar Rascunho
        </Button>
        <Button
          className="flex-1 bg-ink text-bg hover:bg-bg-soft hover:text-ink border border-ink font-semibold"
          onClick={handleFinalize}
          disabled={saving}
        >
          <Send className="h-4 w-4 mr-2 shrink-0" />
          Finalizar Contagem
        </Button>
      </div>
    </div>
  );
}
