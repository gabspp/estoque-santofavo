import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Save, Calculator, Search, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { productService } from "@/services/productService";
import { storeService } from "@/services/storeService";
import { categoryService } from "@/services/categoryService";
import { type Product, type Store, type Category, type Subcategory } from "@/types";
import { useToast } from "@/components/ui/use-toast";

const entrySchema = z.object({
  product_id: z.string().min(1, "Selecione um produto"),
  store_id: z.string().min(1, "Selecione uma loja"),
  quantity: z.number().min(0.001, "Quantidade deve ser maior que zero"),
  cost_price: z.number().min(0, "Preço deve ser positivo"),
});

type EntryFormData = z.infer<typeof entrySchema>;

export default function EntryForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  // Autocomplete Dropdown State
  const [productSearchInput, setProductSearchInput] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Quick Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategories, setModalCategories] = useState<Category[]>([]);
  const [modalSubcategories, setModalSubcategories] = useState<Subcategory[]>([]);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  // Modal Form State
  const [newName, setNewName] = useState("");
  const [newBarcode, setNewBarcode] = useState("");
  const [newUnit, setNewUnit] = useState("UN");
  const [newMinStock, setNewMinStock] = useState("0");
  const [newSubcatId, setNewSubcatId] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<EntryFormData>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      quantity: 0,
      cost_price: 0,
    },
  });

  const quantity = watch("quantity");
  const costPrice = watch("cost_price");
  const selectedProductId = watch("product_id");
  const totalCost = (quantity || 0) * (costPrice || 0);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      loadModalCategories();
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (selectedCatId) {
      loadModalSubcategories(selectedCatId);
    } else {
      setModalSubcategories([]);
    }
  }, [selectedCatId]);

  const loadData = async () => {
    try {
      const [productsData, storesData] = await Promise.all([
        productService.getProducts(),
        storeService.getAll()
      ]);

      // Sort products by code, fallback to name
      productsData.sort((a, b) => {
        if (a.code !== undefined && b.code !== undefined) {
          return a.code - b.code;
        }
        if (a.code !== undefined) return -1;
        if (b.code !== undefined) return 1;
        return a.name.localeCompare(b.name);
      });

      setProducts(productsData);
      setStores(storesData);

      // Memory of last selected store
      const savedStoreId = localStorage.getItem("last_store_id");
      if (savedStoreId && storesData.some((s) => s.id === savedStoreId)) {
        setValue("store_id", savedStoreId);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const loadModalCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setModalCategories(data);
    } catch (e) {
      console.error("Error loading modal categories:", e);
    }
  };

  const loadModalSubcategories = async (catId: string) => {
    try {
      const data = await categoryService.getSubcategories(catId);
      setModalSubcategories(data);
    } catch (e) {
      console.error("Error loading modal subcategories:", e);
    }
  };

  const selectProduct = (p: Product) => {
    setValue("product_id", p.id);
    setProductSearchInput(p.name);
    setIsDropdownOpen(false);
    trigger("product_id");

    // Pre-fill cost price with last cost or average cost as speed booster!
    if (p.last_cost !== undefined && p.last_cost > 0) {
      setValue("cost_price", p.last_cost);
    } else if (p.average_cost !== undefined && p.average_cost > 0) {
      setValue("cost_price", p.average_cost);
    } else {
      setValue("cost_price", 0);
    }
  };

  const clearSelectedProduct = () => {
    setValue("product_id", "");
    setProductSearchInput("");
    setIsDropdownOpen(false);
    trigger("product_id");
  };

  const handleProductSearchChange = (val: string) => {
    setProductSearchInput(val);
    setIsDropdownOpen(true);

    // Bipador / perfect match code or barcode detection
    const trimmedVal = val.trim();
    if (trimmedVal.length >= 3) {
      const match = products.find(
        (p) =>
          (p.barcode && p.barcode.trim() === trimmedVal) ||
          (p.code !== undefined && p.code.toString() === trimmedVal)
      );
      if (match) {
        selectProduct(match);
        // Automatically focus the quantity input
        setTimeout(() => {
          const qtyInput = document.getElementById("quantity") as HTMLInputElement;
          if (qtyInput) {
            qtyInput.focus();
            qtyInput.select();
          }
        }, 100);
      }
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert("Nome do insumo é obrigatório");
      return;
    }
    if (!selectedCatId) {
      alert("Selecione um grupo (categoria)");
      return;
    }
    if (!newUnit.trim()) {
      alert("Selecione ou digite uma unidade");
      return;
    }

    setModalLoading(true);
    try {
      const selectedCategory = modalCategories.find((c) => c.id === selectedCatId);
      const payload = {
        name: newName.trim(),
        barcode: newBarcode.trim() || undefined,
        category_id: selectedCatId,
        subcategory_id: newSubcatId || undefined,
        category: selectedCategory?.name || "Outros",
        unit: newUnit.trim(),
        min_stock: parseFloat(newMinStock) || 0,
      };

      const newProduct = await productService.createProduct(payload);

      toast({
        title: "Novo insumo criado! 🎉",
        description: `${newProduct.name} foi adicionado ao catálogo.`,
        variant: "success",
      });

      // Reset modal fields
      setNewName("");
      setNewBarcode("");
      setNewUnit("UN");
      setNewMinStock("0");
      setSelectedCatId("");
      setNewSubcatId("");
      setIsModalOpen(false);

      // Reload products list and automatically select the new product
      const productsData = await productService.getProducts();
      productsData.sort((a, b) => {
        if (a.code !== undefined && b.code !== undefined) {
          return a.code - b.code;
        }
        if (a.code !== undefined) return -1;
        if (b.code !== undefined) return 1;
        return a.name.localeCompare(b.name);
      });
      setProducts(productsData);

      // Select the new product
      selectProduct(newProduct);

      // Focus the quantity input
      setTimeout(() => {
        const qtyInput = document.getElementById("quantity") as HTMLInputElement;
        if (qtyInput) {
          qtyInput.focus();
        }
      }, 100);

    } catch (err) {
      console.error("Error creating product:", err);
      toast({
        title: "Erro ao cadastrar insumo",
        description: "Tente novamente ou verifique se já existe.",
        variant: "destructive",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const onSubmit = async (data: EntryFormData) => {
    if (
      !confirm(
        `Confirma a entrada de ${data.quantity} itens? Isso aumentará o estoque.`,
      )
    )
      return;

    setLoading(true);
    try {
      await productService.addStockEntry({
        product_id: data.product_id,
        store_id: data.store_id,
        quantity: data.quantity,
        cost_price: data.cost_price,
      });

      // Save last used store id in localStorage
      localStorage.setItem("last_store_id", data.store_id);

      toast({
        title: "Entrada registrada com sucesso! 📦",
        variant: "success",
      });
      navigate("/entradas");
    } catch (error) {
      console.error("Error saving entry:", error);
      toast({
        title: "Erro ao registrar entrada",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter products for dropdown
  const filteredProducts = products.filter((p) => {
    const term = productSearchInput.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.code !== undefined && p.code.toString().includes(term)) ||
      (p.barcode && p.barcode.includes(term))
    );
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto relative">
      {/* Click-outside backdrop for dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-10 bg-transparent"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      <div className="flex items-center gap-4">
        <Link to="/entradas">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-brand-brown">
            Nova Entrada de Estoque
          </h1>
          <p className="text-gray-500">Registre a chegada de mercadorias</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 relative">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                {/* Searchable Autocomplete Combobox */}
                <div className="relative">
                  <Label htmlFor="product_search">Produto</Label>
                  <div className="flex gap-2 mt-1">
                    <div className="relative flex-1">
                      <Input
                        id="product_search"
                        type="text"
                        placeholder="Digite o nome, código ou bipa o código..."
                        value={productSearchInput}
                        onChange={(e) => handleProductSearchChange(e.target.value)}
                        onFocus={() => setIsDropdownOpen(true)}
                        className={errors.product_id ? "border-red-500 pr-10 h-10" : "pr-10 h-10"}
                        autoComplete="off"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-gray-400">
                        {selectedProduct ? (
                          <button
                            type="button"
                            onClick={clearSelectedProduct}
                            className="hover:text-gray-600 focus:outline-none"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </div>
                      
                      {/* Dropdown Menu */}
                      {isDropdownOpen && filteredProducts.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-bg-card border border-rule-soft rounded-md max-h-60 overflow-y-auto">
                          {filteredProducts.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => selectProduct(p)}
                              className="px-4 py-2.5 text-sm hover:bg-bg-hover cursor-pointer flex justify-between items-center transition-colors border-b border-rule-soft last:border-0"
                            >
                              <div>
                                <span className="font-semibold text-ink">
                                  {p.code ? `[${p.code}] ` : ""}
                                </span>
                                <span className="text-ink font-medium">{p.name}</span>
                              </div>
                              <span className="text-[11px] text-ink-muted font-bold bg-bg px-2 py-0.5 rounded border border-rule-soft shrink-0">
                                {p.unit} (Estoque: {p.current_stock})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Novo Insumo Button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsModalOpen(true)}
                      className="shrink-0 border-brand-brown/25 text-brand-brown hover:bg-brand-brown/5 h-10 px-3 font-semibold"
                      title="Cadastrar Novo Insumo"
                    >
                      <Plus className="h-4 w-4 mr-1 shrink-0" />
                      Novo
                    </Button>
                  </div>
                  
                  {/* Hidden register input for react-hook-form */}
                  <input type="hidden" {...register("product_id")} />
                  
                  {errors.product_id && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.product_id.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="store_id">Loja Destino</Label>
                  <select
                    id="store_id"
                    {...register("store_id")}
                    className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow focus-visible:ring-offset-2"
                  >
                    <option value="">Selecione uma loja...</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                  {errors.store_id && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.store_id.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantidade</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.001"
                      placeholder="0.00"
                      {...register("quantity", { valueAsNumber: true })}
                      className={errors.quantity ? "border-red-500 mt-1 h-10" : "mt-1 h-10"}
                    />
                    {errors.quantity && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.quantity.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="cost_price">
                      Preço de Custo (Unitário)
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                        R$
                      </span>
                      <Input
                        id="cost_price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register("cost_price", { valueAsNumber: true })}
                        className={`pl-8 h-10 ${errors.cost_price ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.cost_price && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.cost_price.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Link to="/entradas">
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </Link>
                <Button type="submit" isLoading={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Registrar Entrada
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="p-6 bg-bg-card border border-rule-soft">
            <h3 className="font-serif font-medium text-ink mb-4 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-ink-soft" />
              Resumo
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-soft">Qtd. Itens:</span>
                <span className="font-medium text-ink">{quantity || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Valor Unit.:</span>
                <span className="font-medium text-ink">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(costPrice || 0)}
                </span>
              </div>
              <div className="border-t border-rule-soft pt-2 flex justify-between items-center">
                <span className="font-bold text-ink">Total:</span>
                <span className="font-serif text-lg font-bold text-ink">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalCost)}
                </span>
              </div>
            </div>
            <p className="text-xs text-ink-muted mt-4 leading-relaxed">
              Ao registrar, o estoque do produto será atualizado automaticamente
              e o preço médio recalculado.
            </p>
          </Card>
        </div>
      </div>

      {/* Modal Overlay "+ Novo Insumo" */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/60 backdrop-blur-sm p-4">
          <div className="bg-bg-card border border-rule-soft rounded-lg max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 bg-bg-soft border-b border-rule-soft flex justify-between items-center">
              <div>
                <h3 className="font-serif font-medium text-ink text-lg">Cadastrar Novo Insumo</h3>
                <p className="text-xs text-ink-muted mt-0.5">Cadastre o item diretamente sem perder seu lançamento.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-bg-hover rounded-md text-ink-muted hover:text-ink transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateProduct} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <Label htmlFor="modal_name">Nome do Produto *</Label>
                <Input
                  id="modal_name"
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Açúcar Demerara Orgânico"
                  className="mt-1 h-10"
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="modal_category">Grupo (Categoria) *</Label>
                  <select
                    id="modal_category"
                    required
                    value={selectedCatId}
                    onChange={(e) => setSelectedCatId(e.target.value)}
                    className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow focus-visible:ring-offset-2"
                  >
                    <option value="">Selecione...</option>
                    {modalCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="modal_subcategory">Categoria (Subcategoria)</Label>
                  <select
                    id="modal_subcategory"
                    value={newSubcatId}
                    onChange={(e) => setNewSubcatId(e.target.value)}
                    disabled={!selectedCatId}
                    className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow focus-visible:ring-offset-2 disabled:opacity-50"
                  >
                    <option value="">Selecione...</option>
                    {modalSubcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="modal_unit">Unidade de Medida *</Label>
                  <Input
                    id="modal_unit"
                    type="text"
                    required
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="Ex: UN, KG, LT..."
                    className="mt-1 h-10"
                    list="modal-units-list"
                  />
                  <datalist id="modal-units-list">
                    <option value="UN" />
                    <option value="KG" />
                    <option value="LT" />
                    <option value="CX" />
                    <option value="pct 500g" />
                    <option value="pct 400g" />
                    <option value="pct 800g" />
                    <option value="balde 5 kg" />
                    <option value="galão 7,6" />
                    <option value="bloco" />
                    <option value="rolo" />
                  </datalist>
                </div>

                <div>
                  <Label htmlFor="modal_min_stock">Estoque Mínimo</Label>
                  <Input
                    id="modal_min_stock"
                    type="number"
                    step="0.001"
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(e.target.value)}
                    className="mt-1 h-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="modal_barcode">Código de Barras (Opcional)</Label>
                <Input
                  id="modal_barcode"
                  type="text"
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  placeholder="Escaneie ou digite o código..."
                  className="mt-1 h-10"
                  autoComplete="off"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={modalLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" isLoading={modalLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar e Selecionar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
