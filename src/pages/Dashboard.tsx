import { Package, AlertTriangle, FileClock, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActionButtons } from "@/components/dashboard/ActionButtons";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { user } = useAuth();
  const stats = useDashboardStats();

  const userName = user?.email?.split("@")[0] || "Gestor";

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-brand-brown">
          Olá, {userName.charAt(0).toUpperCase() + userName.slice(1)}
        </h1>
        <p className="text-gray-500">
          Bem-vindo ao painel de controle do Santo Favo.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Produtos"
          value={stats.loading ? "..." : stats.totalProducts}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Estoque Baixo"
          value={stats.loading ? "..." : stats.lowStock}
          icon={AlertTriangle}
          color={stats.lowStock > 0 ? "red" : "green"}
          description="Produtos abaixo do mínimo"
        />
        <StatCard
          title="Contagens Pendentes"
          value={stats.loading ? "..." : stats.pendingCounts}
          icon={FileClock}
          color={stats.pendingCounts > 0 ? "yellow" : "default"}
          description="Aguardando aprovação"
        />
        <StatCard
          title="Última Atualização"
          value={
            stats.loading || !stats.lastUpdate
              ? "..."
              : format(stats.lastUpdate, "HH:mm")
          }
          icon={Clock}
          color="default"
          description={
            stats.loading || !stats.lastUpdate
              ? ""
              : format(stats.lastUpdate, "dd/MM/yyyy", { locale: ptBR })
          }
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ações Rápidas
        </h2>
        <ActionButtons />
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Atividade Recente
        </h2>
        <div className="text-center py-8 text-gray-500">
          <p>Nenhuma atividade recente para mostrar.</p>
        </div>
      </div>
    </div>
  );
}
