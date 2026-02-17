import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StoreIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { storeService } from "@/services/storeService";
import { countingService } from "@/services/countingService";
import type { Store } from "@/types";

export default function StoreSelection() {
    const navigate = useNavigate();
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

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
            const count = await countingService.createCount(storeId);
            navigate(`/contagem/${count.id}`);
        } catch (error) {
            console.error("Failed to create count", error);
            alert("Erro ao iniciar contagem. Tente novamente.");
        } finally {
            setProcessing(false);
        }
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
        </div>
    );
}
