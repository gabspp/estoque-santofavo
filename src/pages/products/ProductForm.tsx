import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { type Category, type Subcategory, type Unit } from "@/types";

const productSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  barcode: z.string().optional(),
  category_id: z.string().min(1, "Selecione uma categoria"),
  subcategory_id: z.string().optional(),
  unit: z.string().min(1, "Selecione uma unidade"),
  min_stock: z.number().min(0, "Estoque mínimo deve ser positivo"),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      unit: "UN",
      min_stock: 0,
    },
  });

  const selectedCategoryId = watch("category_id");

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadSubcategories(selectedCategoryId);
    } else {
      setSubcategories([]);
    }
  }, [selectedCategoryId]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadSubcategories = async (categoryId: string) => {
    try {
      const data = await categoryService.getSubcategories(categoryId);
      setSubcategories(data);
    } catch (error) {
      console.error("Error loading subcategories:", error);
    }
  };

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  const loadProduct = async (productId: string) => {
    setLoading(true);
    try {
      const product = await productService.getProductById(productId);
      if (product) {
        setValue("name", product.name);
        setValue("barcode", product.barcode || "");
        setValue("unit", product.unit);
        setValue("min_stock", product.min_stock);

        if (product.category_id) {
          setValue("category_id", product.category_id);
          // Subcategories will lazy load via useEffect when category_id is set
          // But we might need to wait or rely on React batching.
          // Ideally we fetch subs then set value.
          await loadSubcategories(product.category_id);
          if (product.subcategory_id) {
            setValue("subcategory_id", product.subcategory_id);
          }
        }
      } else {
        navigate("/produtos");
      }
    } catch (error) {
      console.error("Error loading product:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);
    try {
      // Find category name for legacy support
      const selectedCategory = categories.find(
        (c) => c.id === data.category_id,
      );
      const payload = {
        ...data,
        category: selectedCategory?.name || "Outros", // Fallback for legacy field
      };

      if (id) {
        await productService.updateProduct(id, payload);
      } else {
        await productService.createProduct(payload);
      }
      navigate("/produtos");
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setLoading(false);
    }
  };

  const units: Unit[] = [
    "UN",
    "KG",
    "LT",
    "CX",
    "pct 500g",
    "pct 400g",
    "pct 800g",
    "balde 5 kg",
    "galão 7,6",
    "bloco",
    "rolo",
  ]; // Enhanced list based on CSV

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/produtos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-brand-brown">
            {id ? "Editar Produto" : "Novo Produto"}
          </h1>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Produto</Label>
              <Input
                id="name"
                {...register("name")}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category_id">Grupo (Categoria)</Label>
                <select
                  id="category_id"
                  {...register("category_id")}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow focus-visible:ring-offset-2"
                >
                  <option value="">Selecione...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.category_id.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="subcategory_id">Categoria (Subcategoria)</Label>
                <select
                  id="subcategory_id"
                  {...register("subcategory_id")}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow focus-visible:ring-offset-2"
                  disabled={!selectedCategoryId}
                >
                  <option value="">Selecione...</option>
                  {subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="barcode">Código de Barras (Opcional)</Label>
                <Input id="barcode" {...register("barcode")} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit">Unidade de Medida</Label>
                <Input
                  id="unit"
                  {...register("unit")}
                  placeholder="Ex: UN, KG, CX..."
                  list="units-list"
                />
                <datalist id="units-list">
                  {units.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
                {errors.unit && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.unit.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="min_stock">Estoque Mínimo</Label>
                <Input
                  id="min_stock"
                  type="number"
                  step="0.001"
                  {...register("min_stock", { valueAsNumber: true })}
                  className={errors.min_stock ? "border-red-500" : ""}
                />
                {errors.min_stock && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.min_stock.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Link to="/produtos">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" isLoading={loading}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Produto
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
