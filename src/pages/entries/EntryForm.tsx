import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Save, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { productService } from "@/services/productService";
import { storeService } from "@/services/storeService";
import { type Product, type Store } from "@/types";

const entrySchema = z.object({
  product_id: z.string().min(1, "Selecione um produto"),
  store_id: z.string().min(1, "Selecione uma loja"),
  quantity: z.number().min(0.001, "Quantidade deve ser maior que zero"),
  cost_price: z.number().min(0, "Preço deve ser positivo"),
});

type EntryFormData = z.infer<typeof entrySchema>;

export default function EntryForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  const {
    register,
    handleSubmit,
    watch,
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
  const totalCost = (quantity || 0) * (costPrice || 0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, storesData] = await Promise.all([
        productService.getProducts(),
        storeService.getAll()
      ]);
      setProducts(productsData);
      setStores(storesData);
    } catch (error) {
      console.error("Error loading data:", error);
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
      navigate("/entradas");
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Erro ao registrar entrada");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
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
          <Card className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="product_id">Produto</Label>
                  <select
                    id="product_id"
                    {...register("product_id")}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow focus-visible:ring-offset-2"
                  >
                    <option value="">Selecione um produto...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.unit}) - Total: {product.current_stock}
                      </option>
                    ))}
                  </select>
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
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow focus-visible:ring-offset-2"
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
                      {...register("quantity", { valueAsNumber: true })}
                      className={errors.quantity ? "border-red-500" : ""}
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
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                        R$
                      </span>
                      <Input
                        id="cost_price"
                        type="number"
                        step="0.01"
                        {...register("cost_price", { valueAsNumber: true })}
                        className={`pl-8 ${errors.cost_price ? "border-red-500" : ""}`}
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
          <Card className="p-6 bg-brand-yellow/10 border-brand-yellow/20">
            <h3 className="font-semibold text-brand-brown mb-4 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Resumo
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Qtd. Itens:</span>
                <span className="font-medium">{quantity || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valor Unit.:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(costPrice || 0)}
                </span>
              </div>
              <div className="border-t border-brand-brown/10 pt-2 flex justify-between items-center">
                <span className="font-bold text-gray-700">Total:</span>
                <span className="font-bold text-lg text-brand-brown">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalCost)}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
              Ao registrar, o estoque do produto será atualizado automaticamente
              e o preço médio recalculado.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
