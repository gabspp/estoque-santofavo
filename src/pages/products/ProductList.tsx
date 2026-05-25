import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, AlertCircle, ArrowUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { useAuth } from "@/context/AuthContext";
import { type Product, type Category, type Subcategory, type Store } from "@/types";
import { storeService } from "@/services/storeService";
import { cn } from "@/lib/utils";

type SortField = 'code' | 'name' | 'category' | 'subcategory';
type SortOrder = 'asc' | 'desc';

export default function ProductList() {
  const { role } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState(false);

  // Quick edit modal state
  const [quickEditProduct, setQuickEditProduct] = useState<Product | null>(null);
  const [qeForm, setQeForm] = useState({ unit: "", category_id: "", subcategory_id: "" });
  const [qeSaving, setQeSaving] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('subcategory');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, categoriesData, subcategoriesData, storesData] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories(),
        categoryService.getAllSubcategories(),
        storeService.getAll()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setSubcategories(subcategoriesData);
      setStores(storesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQuickEdit = (product: Product) => {
    setQuickEditProduct(product);
    setQeForm({
      unit: product.unit,
      category_id: product.category_id || "",
      subcategory_id: product.subcategory_id || "",
    });
  };

  const handleSaveQuickEdit = async () => {
    if (!quickEditProduct) return;
    setQeSaving(true);
    try {
      const selectedCategory = categories.find(c => c.id === qeForm.category_id);
      await productService.updateProduct(quickEditProduct.id, {
        unit: qeForm.unit,
        category_id: qeForm.category_id || undefined,
        subcategory_id: qeForm.subcategory_id || undefined,
        category: selectedCategory?.name || quickEditProduct.category,
      });
      setQuickEditProduct(null);
      loadData();
    } catch (e) {
      console.error("Erro ao salvar edição rápida", e);
    } finally {
      setQeSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      await productService.deleteProduct(id);
      loadData(); // Reload to refresh list
    }
  };

  const handleToggleStoreStatus = async (productId: string, storeId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      // Optimistic update
      setProducts(products.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            active_status: {
              ...(p.active_status || {}),
              [storeId]: newStatus
            }
          }
        }
        return p;
      }));
      await productService.toggleProductStoreActive(productId, storeId, newStatus);
    } catch (e) {
      console.error("Erro ao alterar status da loja", e);
      loadData(); // Revert on fail
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSubcategoryName = (id?: string) => {
    if (!id) return "-";
    return subcategories.find(s => s.id === id)?.name || "-";
  };

  // 1. Filter
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm),
  );

  // 2. Sort
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortField === 'code') {
      const codeA = a.code ?? Infinity;
      const codeB = b.code ?? Infinity;
      return sortOrder === 'asc' ? codeA - codeB : codeB - codeA;
    }

    let valA = "";
    let valB = "";

    if (sortField === 'name') {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
    } else if (sortField === 'category') {
      valA = a.category.toLowerCase();
      valB = b.category.toLowerCase();
    } else if (sortField === 'subcategory') {
      valA = getSubcategoryName(a.subcategory_id).toLowerCase();
      valB = getSubcategoryName(b.subcategory_id).toLowerCase();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif font-medium text-2xl tracking-tight text-ink">Produtos</h1>
          <p className="text-sm text-ink-muted">Gerencie o catálogo de produtos</p>
        </div>

        {role === 'admin' && (
          <div className="flex gap-2">
            <Button
              variant={editMode ? "primary" : "outline"}
              onClick={() => setEditMode(!editMode)}
              className={editMode ? "bg-ink text-bg" : ""}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {editMode ? "Concluir Edição" : "Edição Rápida"}
            </Button>
            <Link to="/produtos/novo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
        <Input
          placeholder="Buscar por nome ou código de barras..."
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
                <th className="px-4 py-4 text-center w-16 cursor-pointer hover:bg-bg-hover" onClick={() => handleSort('code')}>
                  <div className="flex items-center justify-center gap-1 text-[0.74rem] font-semibold uppercase tracking-wider text-ink-muted">
                    Cód.
                    <ArrowUpDown className="h-3 w-3 text-ink-muted" />
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-bg-hover" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1 text-[0.74rem] font-semibold uppercase tracking-wider text-ink-muted">
                    Produto
                    <ArrowUpDown className="h-3 w-3 text-ink-muted" />
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-bg-hover" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1 text-[0.74rem] font-semibold uppercase tracking-wider text-ink-muted">
                    Categoria
                    <ArrowUpDown className="h-3 w-3 text-ink-muted" />
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-bg-hover" onClick={() => handleSort('subcategory')}>
                  <div className="flex items-center gap-1 text-[0.74rem] font-semibold uppercase tracking-wider text-ink-muted">
                    Subcategoria
                    <ArrowUpDown className="h-3 w-3 text-ink-muted" />
                  </div>
                </th>
                <th className="px-6 py-4 text-[0.74rem] font-semibold uppercase tracking-wider text-ink-muted">Unidade</th>
                <th className="px-6 py-4 text-center text-[0.74rem] font-semibold uppercase tracking-wider text-ink-muted">Total</th>

                {stores.map(store => (
                  <th key={store.id} className="px-6 py-4 text-center text-[0.74rem] font-semibold uppercase tracking-wider text-ink-muted">
                    {store.name}
                  </th>
                ))}

                {role === 'admin' && <th className="px-6 py-4 text-right text-[0.74rem] font-semibold uppercase tracking-wider text-ink-muted">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-rule-soft">
              {loading ? (
                <tr>
                  <td
                    colSpan={role === 'admin' ? 7 + stores.length : 6 + stores.length}
                    className="px-6 py-8 text-center text-ink-muted"
                  >
                    Carregando produtos...
                  </td>
                </tr>
              ) : sortedProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={role === 'admin' ? 7 + stores.length : 6 + stores.length}
                    className="px-6 py-8 text-center text-ink-muted"
                  >
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                sortedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-bg-hover transition-colors"
                  >
                    <td className="px-4 py-4 text-center text-xs text-ink-muted font-mono w-16">
                      {product.code ?? "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-ink">
                        {product.name}
                      </div>
                      {product.barcode && (
                        <div className="text-xs text-ink-muted">
                          {product.barcode}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-0.5 rounded-md border border-rule-soft bg-bg-card text-xs font-medium text-ink-soft">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-ink-soft">
                      {getSubcategoryName(product.subcategory_id)}
                    </td>
                    <td className="px-6 py-4 text-ink-soft">{product.unit}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-medium text-ink">
                          {product.current_stock}
                        </span>
                      </div>
                    </td>

                    {
                      stores.map(store => {
                        const isActive = product.active_status?.[store.id] !== false;
                        const storeStock = product.inventory?.[store.id] ?? 0;
                        const isLowStock = storeStock <= product.min_stock;

                        return (
                          <td key={store.id} className="px-6 py-4 text-center text-ink-soft">
                            {editMode && role === 'admin' ? (
                              <button
                                onClick={() => handleToggleStoreStatus(product.id, store.id, isActive)}
                                className={cn(
                                  "w-10 h-5 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1 mx-auto block",
                                  isActive ? "bg-ink" : "bg-bg-soft border border-rule-soft"
                                )}
                              >
                                <span
                                  className={cn(
                                    "inline-block w-3 h-3 rounded-full transition-transform duration-200 ease-in-out absolute top-1",
                                    isActive ? "translate-x-[22px] left-0 bg-bg" : "translate-x-1 left-0 bg-ink-muted"
                                  )}
                                />
                              </button>
                            ) : (
                              <div className="flex flex-col items-center">
                                <span className={cn(
                                  !isActive && "text-ink-muted/40 line-through",
                                  isActive && isLowStock ? "text-brand-rosa font-medium" : "text-ink"
                                )}>
                                  {storeStock}
                                </span>
                                {isActive && isLowStock && (
                                  <span className="flex items-center text-[10px] text-brand-rosa gap-1 mt-0.5">
                                    <AlertCircle className="h-3 w-3" />
                                    Baixo
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })
                    }

                    {role === 'admin' && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {editMode ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-ink-soft hover:text-ink hover:bg-bg-hover"
                              onClick={() => handleOpenQuickEdit(product)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Link to={`/produtos/${product.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-ink-soft hover:text-ink hover:bg-bg-hover"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-brand-rosa hover:bg-brand-rosa/10"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card >
      {/* Quick Edit Modal */}
      {quickEditProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/60 backdrop-blur-sm p-4">
          <div className="bg-bg-card border border-rule-soft rounded-lg max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif font-medium text-lg text-ink">Edição Rápida</h2>
              <button onClick={() => setQuickEditProduct(null)} className="text-ink-muted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-4 -mt-2 truncate">{quickEditProduct.name}</p>

            <div className="space-y-4">
              {/* Unidade */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">Unidade</label>
                <Input
                  list="unit-options"
                  value={qeForm.unit}
                  onChange={e => setQeForm(f => ({ ...f, unit: e.target.value }))}
                  placeholder="ex: kg, un, pct"
                  className="bg-transparent"
                />
                <datalist id="unit-options">
                  {["kg", "un", "lt", "pct", "cx", "g", "ml"].map(u => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">Categoria</label>
                <select
                  className="w-full bg-transparent border-0 border-b border-rule-soft focus:border-ink py-1.5 text-ink placeholder-ink-muted font-sans outline-none transition-colors"
                  value={qeForm.category_id}
                  onChange={e => setQeForm(f => ({ ...f, category_id: e.target.value, subcategory_id: "" }))}
                >
                  <option value="" className="bg-bg-card">Selecione...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id} className="bg-bg-card">{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Subcategoria */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">Subcategoria</label>
                <select
                  className="w-full bg-transparent border-0 border-b border-rule-soft focus:border-ink py-1.5 text-ink placeholder-ink-muted font-sans outline-none transition-colors disabled:opacity-40"
                  value={qeForm.subcategory_id}
                  onChange={e => setQeForm(f => ({ ...f, subcategory_id: e.target.value }))}
                  disabled={!qeForm.category_id}
                >
                  <option value="" className="bg-bg-card">Selecione...</option>
                  {subcategories
                    .filter(s => s.category_id === qeForm.category_id)
                    .map(s => (
                      <option key={s.id} value={s.id} className="bg-bg-card">{s.name}</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setQuickEditProduct(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-ink text-bg hover:bg-ink-soft hover:text-bg"
                onClick={handleSaveQuickEdit}
                disabled={qeSaving}
              >
                {qeSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
