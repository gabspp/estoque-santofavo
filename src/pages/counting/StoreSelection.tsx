import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StoreIcon, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { storeService } from "@/services/storeService";
import { countingService } from "@/services/countingService";
import type { Store, StockCount } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function StoreSelection() {
    const navigate = useNavigate();
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Modal de conflito
    const [conflictCount, setConflictCount] = useState<StockCount | null>(null);
    const [pendingStoreId, setPendingStoreId] = useState<string | null>(null);

    useEffect(() => {
        loadStores();
    }, []);

    const loadStores = async () => {
        try {
            const data = await storeService.getAll();
            setStores(data);
        } catch (error) {
            console.error("Failed to load stores", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectStore = async (storeId: string) => {
        setProcessing(true);
        try {
            const existing = await countingService.getDraftCountForStoreThisWeek(storeId);
            if (existing) {
                setPendingStoreId(storeId);
                setConflictCount(existing);
                return;
            }
            await createNewCount(storeId);
        } catch (error) {
            console.error("Failed to check existing count", error);
            alert("Erro ao verificar contagens. Tente novamente.");
        } finally {
            setProcessing(false);
        }
    };

    const createNewCount = async (storeId: string) => {
        setProcessing(true);
        try {
            const count = await countingService.createCount(storeId);
            navigate(`/contagem/${count.id}`);
        } catch (error) {
            console.error("Failed to create count", error);
            alert("Erro ao iniciar contagem. Tente novamente.");
        } finally {
            setProcessing(false);
        }
    };

    const handleCancel = () => {
        setConflictCount(null);
        setPendingStoreId(null);
    };

    const handleResume = () => {
        if (conflictCount) {
            navigate(`/contagem/${conflictCount.id}`);
        }
    };

    const handleStartNew = async () => {
        if (!pendingStoreId) return;
        setConflictCount(null);
        setPendingStoreId(null);
        await createNewCount(pendingStoreId);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <h1 className="text-2xl font-bold mb-6 text-center text-brand-brown">
                Selecione a Loja
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stores.map((store) => (
                    <Card
                        key={store.id}
                        className={`cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-brand-brown/20 ${processing ? 'opacity-50 pointer-events-none' : ''}`}
                        onClick={() => handleSelectStore(store.id)}
                    >
                        <CardContent className="flex flex-col items-center justify-center p-8 text-center h-48">
                            <div className="bg-brand-yellow/10 p-4 rounded-full mb-4">
                                <StoreIcon className="w-8 h-8 text-brand-brown" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">{store.name}</h2>
                            <p className="text-sm text-gray-500 mt-2">Código: {store.code}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Modal de conflito */}
            {conflictCount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="bg-yellow-100 p-2 rounded-full shrink-0">
                                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Contagem em andamento
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Já existe uma contagem em rascunho para essa loja nessa semana, iniciada em{" "}
                                    <span className="font-medium">
                                        {format(new Date(conflictCount.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                    .
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    O que deseja fazer?
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-6">
                            <Button
                                onClick={handleResume}
                                className="w-full bg-brand-brown hover:bg-brand-brown/90 text-white"
                            >
                                Retomar contagem existente
                            </Button>
                            <Button
                                onClick={handleStartNew}
                                variant="outline"
                                className="w-full border-gray-300"
                                disabled={processing}
                            >
                                Iniciar nova contagem
                            </Button>
                            <Button
                                onClick={handleCancel}
                                variant="outline"
                                className="w-full text-gray-500 border-gray-200"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
