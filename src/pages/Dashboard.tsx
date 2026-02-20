import { useAuth } from "@/context/AuthContext";
import { ActionButtons } from "@/components/dashboard/ActionButtons";

export default function Dashboard() {
  const { user } = useAuth();
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
