import { useAuth } from "@/context/AuthContext";
import { ActionButtons } from "@/components/dashboard/ActionButtons";

export default function Dashboard() {
  const { user } = useAuth();
  const userName = user?.email?.split("@")[0] || "Gestor";

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="font-serif font-medium text-2xl tracking-tight text-ink">
          Olá, {userName.charAt(0).toUpperCase() + userName.slice(1)}
        </h1>
        <p className="text-sm text-ink-muted">
          Bem-vindo ao painel de controle do Santo Favo.
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-serif font-medium text-xl tracking-tight text-ink mb-4">
          Ações Rápidas
        </h2>
        <ActionButtons />
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-bg-card border border-rule-soft rounded-lg p-6">
        <h2 className="font-serif font-medium text-xl tracking-tight text-ink mb-4">
          Atividade Recente
        </h2>
        <div className="text-center py-8 text-ink-muted">
          <p>Nenhuma atividade recente para mostrar.</p>
        </div>
      </div>
    </div>
  );
}
