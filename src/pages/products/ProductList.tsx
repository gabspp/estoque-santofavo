import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, AlertCircle, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { useAuth } from "@/context/AuthContext";
import { type Product, type Subcategory, type Store } from "@/types";
import { storeService } from "@/services/storeService";
import { cn } from "@/lib/utils";

type SortField = 'name' | 'category' | 'subcategory';
type SortOrder = 'asc' | 'desc';

export default function ProductList() {
  const { role } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('subcategory');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, subcategoriesData, storesData] = await Promise.all([
        productService.getProducts(),
        categoryService.getAllSubcategories(),
        storeService.getAll()
      ]);
      setProducts(productsData);
      setSubcategories(subcategoriesData);
      setStores(storesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold text-brand-brown">Produtos</h1>
          <p className="text-gray-500">Gerencie o catálogo de produtos</p>
        </div>

        {role === 'admin' && (
          <div className="flex gap-2">
            <Button
              variant={editMode ? "primary" : "outline"}
              onClick={() => setEditMode(!editMode)}
              className={editMode ? "bg-brand-brown" : ""}
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome ou código de barras..."
          className="pl-10 max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    Produto
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1">
                    Categoria
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('subcategory')}>
                  <div className="flex items-center gap-1">
                    Subcategoria
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th className="px-6 py-4">Unidade</th>
                <th className="px-6 py-4 text-center">Total</th>

                {stores.map(store => (
                  <th key={store.id} className="px-6 py-4 text-center text-xs uppercase tracking-wider">
                    {store.name}
                  </th>
                ))}

                {role === 'admin' && <th className="px-6 py-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={role === 'admin' ? 6 : 5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Carregando produtos...
                  </td>
                </tr>
              ) : sortedProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={role === 'admin' ? 6 : 5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                sortedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {product.name}
                      </div>
                      {product.barcode && (
                        <div className="text-xs text-gray-500">
                          {product.barcode}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {getSubcategoryName(product.subcategory_id)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{product.unit}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-medium text-gray-900">
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
                          <td key={store.id} className="px-6 py-4 text-center text-gray-600">
                            {editMode && role === 'admin' ? (
                              <button
                                onClick={() => handleToggleStoreStatus(product.id, store.id, isActive)}
                                className={cn(
                                  "w-10 h-5 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-brown focus:ring-offset-1 mx-auto block",
                                  isActive ? "bg-brand-brown" : "bg-gray-200"
                                )}
                              >
                                <span
                                  className={cn(
                                    "inline-block w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out absolute top-1",
                                    isActive ? "translate-x-[22px] left-0" : "translate-x-1 left-0"
                                  )}
                                />
                              </button>
                            ) : (
                              <div className="flex flex-col items-center">
                                <span className={cn(
                                  !isActive && "text-gray-300 line-through",
                                  isActive && isLowStock ? "text-red-600 font-medium" : "text-gray-900"
                                )}>
                                  {storeStock}
                                </span>
                                {isActive && isLowStock && (
                                  <span className="flex items-center text-[10px] text-red-500 gap-1 mt-0.5">
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
                          <Link to={`/produtos/${product.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
    </div >
  );
}
