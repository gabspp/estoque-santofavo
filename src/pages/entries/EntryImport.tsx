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
// Select removed
import { productService } from "@/services/productService";
import { type Product } from "@/types";
import { cn } from "@/lib/utils";

interface ImportedRow {
    id: string; // temp id for key
    csvName: string;
    quantity: number;
    cost: number;
    mappedProductId: string | null;
    status: "valid" | "action_required" | "error";
    errorMsg?: string;
}

export default function EntryImport() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [importedRows, setImportedRows] = useState<ImportedRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"upload" | "review">("upload");

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await productService.getProducts();
            setProducts(data);
        } catch (error) {
            console.error("Error loading products:", error);
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

            // Expected headers: nome, quantidade, custo
            const name = normalizedRow.nome || normalizedRow.name || "";
            const qtyStr = String(normalizedRow.quantidade || normalizedRow.qty || "0");
            const costStr = String(normalizedRow.custo || normalizedRow.price || "0");

            const qty = parseFloat(qtyStr.replace(",", "."));
            const cost = parseFloat(costStr.replace(",", "."));

            // Attempt to find product by exact name match
            // We normalize strings to lowercase and trim for better matching
            const matchedProduct = products.find(
                (p) => p.name.toLowerCase().trim() === String(name).toLowerCase().trim()
            );

            return {
                id: `row-${index}`,
                csvName: name,
                quantity: isNaN(qty) ? 0 : qty,
                cost: isNaN(cost) ? 0 : cost,
                mappedProductId: matchedProduct ? matchedProduct.id : null,
                status: matchedProduct ? "valid" : "action_required",
                errorMsg: !name ? "Nome ausente" : undefined,
            };
        });

        setImportedRows(rows);
        setStep("review");
    };

    const handleProductSelect = (rowId: string, productId: string) => {
        setImportedRows((prev) =>
            prev.map((row) =>
                row.id === rowId
                    ? { ...row, mappedProductId: productId, status: "valid" }
                    : row
            )
        );
    };

    const handleValueChange = (
        rowId: string,
        field: "quantity" | "cost",
        value: string
    ) => {
        const numValue = parseFloat(value);
        setImportedRows((prev) =>
            prev.map((row) =>
                row.id === rowId ? { ...row, [field]: isNaN(numValue) ? 0 : numValue } : row
            )
        );
    };

    const handleSave = async () => {
        // Validate
        const invalidRows = importedRows.filter(
            (row) => row.status !== "valid" || !row.mappedProductId || row.quantity <= 0
        );

        if (invalidRows.length > 0) {
            alert(
                `Existem ${invalidRows.length} linhas com problemas. Verifique produtos não associados ou quantidades zeradas.`
            );
            return;
        }

        setLoading(true);
        let successCount = 0;
        let errorCount = 0;

        for (const row of importedRows) {
            if (!row.mappedProductId) continue;

            try {
                await productService.addStockEntry({
                    product_id: row.mappedProductId,
                    quantity: row.quantity,
                    cost_price: row.cost,
                    // total_cost and dates are handled by service/DB
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
                        Carregue um arquivo com: nome, quantidade, custo
                    </p>
                </div>
            </div>

            {step === "upload" && (
                <Card className="min-h-[300px] flex flex-col items-center justify-center border-dashed border-2">
                    <div className="text-center space-y-4">
                        <div className="bg-brand-cream p-4 rounded-full inline-block">
                            <Upload className="h-8 w-8 text-brand-brown" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg">Selecione o arquivo CSV</h3>
                            <p className="text-sm text-gray-500">
                                O arquivo deve ter as colunas: nome, quantidade, custo
                            </p>
                        </div>
                        <Input
                            type="file"
                            accept=".csv"
                            className="max-w-xs mx-auto"
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
                                    <TableHead className="w-[120px]">Qtd</TableHead>
                                    <TableHead className="w-[120px]">Custo Unit.</TableHead>
                                    <TableHead className="w-[100px]">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {importedRows.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-medium">{row.csvName}</TableCell>
                                        <TableCell>
                                            <select
                                                className={cn(
                                                    "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={row.quantity}
                                                onChange={(e) => handleValueChange(row.id, "quantity", e.target.value)}
                                                className="w-full"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={row.cost}
                                                onChange={(e) => handleValueChange(row.id, "cost", e.target.value)}
                                                className="w-full"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {row.status === "valid" ? (
                                                <div className="flex items-center text-green-600">
                                                    <Check className="h-5 w-5 mr-1" /> OK
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-red-600" title="Associe um produto">
                                                    <AlertCircle className="h-5 w-5 mr-1" /> Ação
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
