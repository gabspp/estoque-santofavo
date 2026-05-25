import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();


  // Redirect if already logged in (optional, usually handled by route guards but good for UX)
  // useEffect(() => {
  //   if (user) navigate('/')
  // }, [user, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      navigate("/");
    } catch (err: any) {
      setError(err.message || "Erro ao realizar login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md space-y-8 bg-bg-card p-8 rounded-lg border border-rule-soft">
        <div className="text-center">
          <h2 className="font-serif font-medium text-3.5xl tracking-tight text-ink">
            Santo Favo
          </h2>
          <p className="font-serif italic text-sm text-ink-soft mt-1">Controle de Estoque</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-brand-rosa/20 text-brand-marrom-escuro font-serif italic text-xs p-3 rounded-md text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="mt-1 bg-transparent"
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 bg-transparent"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-ink text-bg hover:bg-ink-soft hover:text-bg"
            isLoading={loading}
          >
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
