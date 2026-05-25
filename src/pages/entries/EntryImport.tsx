import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as Papa from "papaparse";
import { Upload, AlertCircle, Check, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { productService } from "@/services/productService";
import { storeService } from "@/services/storeService";
import { type Product, type Store } from "@/types";
import { cn } from "@/lib/utils";

interface ImportedRow {
    id: string; // temp id for key
    csvName: string;
    quantity: number;
    cost: number;
    mappedProductId: string | null;
    mappedStoreId: string | null;
    status: "valid" | "action_required" | "error";
    errorMsg?: string;
}

export default function EntryImport() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [selectedStore, setSelectedStore] = useState<string>("");
    const [importedRows, setImportedRows] = useState<ImportedRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"upload" | "review">("upload");

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

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(), // Fixes "Quantidade " -> "Quantidade"
            complete: (results: any) => {
                processParsedData(results.data);
            },
            error: (error: any) => {
                console.error("CSV Error:", error);
                alert("Erro ao ler o arquivo CSV.");
            },
        });
    };

    const processParsedData = (data: any[]) => {
        const rows: ImportedRow[] = data.map((row: any, index) => {
            // Normalize keys to lowercase and trim
            const normalizedRow: any = {};
            Object.keys(row).forEach((key) => {
                const cleanKey = key.trim().toLowerCase();
                if (cleanKey) normalizedRow[cleanKey] = row[key];
            });

            // Expected headers: nome, quantidade, custo, loja (opcional)
            const name = normalizedRow.nome || normalizedRow.name || "";
            const qtyStr = String(normalizedRow.quantidade || normalizedRow.qty || "0");
            const costStr = String(normalizedRow.custo || normalizedRow.price || "0");
            const lojaValue = String(normalizedRow.loja || normalizedRow.store || normalizedRow.unidade || "").trim().toLowerCase();

            const qty = parseFloat(qtyStr.replace(",", "."));
            const cost = parseFloat(costStr.replace(",", "."));

            // Attempt to find product by exact name match
            const matchedProduct = products.find(
                (p) => p.name.toLowerCase().trim() === String(name).toLowerCase().trim()
            );

            // Attempt to find store dynamically
            let rowStoreId = selectedStore || null;
            if (lojaValue) {
                const matchedStore = stores.find(s => 
                    s.name.toLowerCase().includes(lojaValue) || 
                    s.id.toLowerCase().includes(lojaValue) || 
                    (lojaValue === "26" && s.name.includes("26")) ||
                    (lojaValue === "248" && s.name.includes("248"))
                );
                if (matchedStore) {
                    rowStoreId = matchedStore.id;
                }
            }

            const hasProduct = !!matchedProduct;
            const hasStore = !!rowStoreId;
            const hasQty = !isNaN(qty) && qty > 0;

            return {
                id: `row-${index}`,
                csvName: name,
                quantity: isNaN(qty) ? 0 : qty,
                cost: isNaN(cost) ? 0 : cost,
                mappedProductId: matchedProduct ? matchedProduct.id : null,
                mappedStoreId: rowStoreId,
                status: (hasProduct && hasStore && hasQty) ? "valid" : "action_required",
                errorMsg: !name 
                    ? "Nome ausente" 
                    : (!hasProduct 
                        ? "Produto não associado" 
                        : (!hasStore 
                            ? "Loja não especificada" 
                            : (!hasQty ? "Qtd deve ser maior que 0" : undefined))),
            };
        });

        setImportedRows(rows);
        setStep("review");
    };

    const handleProductSelect = (rowId: string, productId: string) => {
        setImportedRows((prev) =>
            prev.map((row) => {
                if (row.id !== rowId) return row;
                const nextProductId = productId;
                const nextStoreId = row.mappedStoreId;
                const hasProduct = !!nextProductId;
                const hasStore = !!nextStoreId;
                const hasQty = row.quantity > 0;
                
                return {
                    ...row,
                    mappedProductId: nextProductId,
                    status: (hasProduct && hasStore && hasQty) ? "valid" : "action_required",
                    errorMsg: !hasProduct 
                        ? "Produto não associado" 
                        : (!hasStore 
                            ? "Loja não especificada" 
                            : (!hasQty ? "Qtd deve ser maior que 0" : undefined))
                };
            })
        );
    };

    const handleStoreSelect = (rowId: string, storeId: string) => {
        setImportedRows((prev) =>
            prev.map((row) => {
                if (row.id !== rowId) return row;
                const nextProductId = row.mappedProductId;
                const nextStoreId = storeId;
                const hasProduct = !!nextProductId;
                const hasStore = !!nextStoreId;
                const hasQty = row.quantity > 0;
                
                return {
                    ...row,
                    mappedStoreId: nextStoreId,
                    status: (hasProduct && hasStore && hasQty) ? "valid" : "action_required",
                    errorMsg: !hasProduct 
                        ? "Produto não associado" 
                        : (!hasStore 
                            ? "Loja não especificada" 
                            : (!hasQty ? "Qtd deve ser maior que 0" : undefined))
                };
            })
        );
    };

    const handleValueChange = (
        rowId: string,
        field: "quantity" | "cost",
        value: string
    ) => {
        const numValue = parseFloat(value);
        setImportedRows((prev) =>
            prev.map((row) => {
                if (row.id !== rowId) return row;
                const nextQty = field === "quantity" ? (isNaN(numValue) ? 0 : numValue) : row.quantity;
                const nextCost = field === "cost" ? (isNaN(numValue) ? 0 : numValue) : row.cost;
                const hasProduct = !!row.mappedProductId;
                const hasStore = !!row.mappedStoreId;
                const hasQty = nextQty > 0;

                return {
                    ...row,
                    quantity: nextQty,
                    cost: nextCost,
                    status: (hasProduct && hasStore && hasQty) ? "valid" : "action_required",
                    errorMsg: !hasProduct 
                        ? "Produto não associado" 
                        : (!hasStore 
                            ? "Loja não especificada" 
                            : (!hasQty ? "Qtd deve ser maior que 0" : undefined))
                };
            })
        );
    };

    const handleSave = async () => {
        // Validate
        const invalidRows = importedRows.filter(
            (row) => row.status !== "valid" || !row.mappedProductId || !row.mappedStoreId || row.quantity <= 0
        );

        if (invalidRows.length > 0) {
            alert(
                `Existem ${invalidRows.length} linhas com problemas. Verifique produtos, lojas não associadas ou quantidades zeradas.`
            );
            return;
        }

        setLoading(true);
        let successCount = 0;
        let errorCount = 0;

        for (const row of importedRows) {
            if (!row.mappedProductId || !row.mappedStoreId) continue;

            try {
                await productService.addStockEntry({
                    product_id: row.mappedProductId,
                    store_id: row.mappedStoreId,
                    quantity: row.quantity,
                    cost_price: row.cost,
                });
                successCount++;
            } catch (error) {
                console.error(`Error saving row ${row.csvName}:`, error);
                errorCount++;
            }
        }

        setLoading(false);
        alert(`Importação concluída! ${successCount} salvos, ${errorCount} erros.`);
        navigate("/entradas");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate("/entradas")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-brand-brown">
                        Importar Entradas via CSV
                    </h1>
                    <p className="text-gray-500">
                        Carregue um arquivo com colunas: nome, quantidade, custo, loja (opcional)
                    </p>
                </div>
            </div>

            {step === "upload" && (
                <Card className="min-h-[300px] flex flex-col items-center justify-center border-dashed border-2">
                    <div className="text-center space-y-4 w-full max-w-md px-4 py-8">
                        <div className="bg-brand-cream p-4 rounded-full inline-block">
                            <Upload className="h-8 w-8 text-brand-brown" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg">Selecione o arquivo CSV</h3>
                            <p className="text-sm text-gray-500">
                                O arquivo deve conter cabeçalhos: **nome, quantidade, custo**.<br/>
                                Se possuir a coluna **loja** (26 ou 248), as lojas serão mapeadas linha por linha.
                            </p>
                        </div>

                        <div className="w-full max-w-xs mx-auto text-left space-y-1">
                            <label className="text-sm font-medium text-gray-700">Loja Padrão / Fallback (Opcional)</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow focus-visible:ring-offset-2"
                                value={selectedStore}
                                onChange={(e) => setSelectedStore(e.target.value)}
                            >
                                <option value="">Sem padrão (especificar no CSV ou mapear na tela)</option>
                                {stores.map(store => (
                                    <option key={store.id} value={store.id}>{store.name}</option>
                                ))}
                            </select>
                        </div>

                        <Input
                            type="file"
                            accept=".csv"
                            className="max-w-xs mx-auto mt-4"
                            onChange={handleFileUpload}
                        />
                    </div>
                </Card>
            )}

            {step === "review" && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Revisar Importação</CardTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep("upload")}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700">
                                <Save className="h-4 w-4 mr-2" />
                                {loading ? "Salvando..." : "Confirmar Importação"}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome no CSV</TableHead>
                                    <TableHead>Produto no Sistema</TableHead>
                                    <TableHead className="w-[180px]">Loja</TableHead>
                                    <TableHead className="w-[100px]">Qtd</TableHead>
                                    <TableHead className="w-[120px]">Custo Unit.</TableHead>
                                    <TableHead className="w-[120px]">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {importedRows.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-medium max-w-[200px] truncate" title={row.csvName}>
                                            {row.csvName}
                                        </TableCell>
                                        <TableCell>
                                            <select
                                                className={cn(
                                                    "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:ring-offset-2",
                                                    !row.mappedProductId && "border-red-400 bg-red-50 text-red-700"
                                                )}
                                                value={row.mappedProductId || ""}
                                                onChange={(e) => handleProductSelect(row.id, e.target.value)}
                                            >
                                                <option value="" disabled>Selecione um produto...</option>
                                                {products.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </TableCell>
                                        <TableCell>
                                            <select
                                                className={cn(
                                                    "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:ring-offset-2",
                                                    !row.mappedStoreId && "border-red-400 bg-red-50 text-red-700"
                                                )}
                                                value={row.mappedStoreId || ""}
                                                onChange={(e) => handleStoreSelect(row.id, e.target.value)}
                                            >
                                                <option value="" disabled>Selecione a loja...</option>
                                                {stores.map((s) => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                step="0.001"
                                                value={row.quantity}
                                                onChange={(e) => handleValueChange(row.id, "quantity", e.target.value)}
                                                className="w-full h-10"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={row.cost}
                                                onChange={(e) => handleValueChange(row.id, "cost", e.target.value)}
                                                className="w-full h-10"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {row.status === "valid" ? (
                                                <div className="flex items-center text-green-600 font-semibold text-sm">
                                                    <Check className="h-4.5 w-4.5 mr-1 shrink-0" /> OK
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-amber-600 font-semibold text-sm" title={row.errorMsg || "Ação requerida"}>
                                                    <AlertCircle className="h-4.5 w-4.5 mr-1 shrink-0" />
                                                    <span className="max-w-[80px] truncate text-xs">{row.errorMsg || "Ajustar"}</span>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
