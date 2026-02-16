
import { useState, useEffect } from 'react'
import { userService } from '@/services/userService'
import { type UserProfile, type UserRole } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Users } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function UserManagement() {
    const [profiles, setProfiles] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        loadProfiles()
    }, [])

    const loadProfiles = async () => {
        try {
            const data = await userService.getProfiles()
            setProfiles(data)
        } catch (error) {
            console.error('Error loading profiles:', error)
            toast({
                title: "Erro",
                description: "Não foi possível carregar os usuários.",
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleRoleChange = async (userId: string, currentRole: UserRole, email: string) => {
        const newRole = currentRole === 'admin' ? 'employee' : 'admin'

        // Confirmation could be added here

        try {
            await userService.updateRole(userId, newRole)
            setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p))
            toast({
                title: "Sucesso",
                description: `Função de ${email} alterada para ${newRole === 'admin' ? 'Administrador' : 'Funcionário'}.`,
            })
        } catch (error) {
            console.error('Error updating role:', error)
            toast({
                title: "Erro",
                description: "Não foi possível atualizar a função.",
                variant: 'destructive'
            })
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-brand-brown">Gestão de Usuários</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Usuários Cadastrados
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-4">Carregando...</div>
                    ) : (
                        <div className="space-y-4">
                            {profiles.map(profile => (
                                <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                                    <div className="space-y-1">
                                        <p className="font-medium">{profile.email}</p>
                                        <div className="flex items-center gap-1.5">
                                            {profile.role === 'admin' ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    Administrador
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                    <Users className="w-3 h-3 mr-1" />
                                                    Funcionário
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-500">
                                                Criado em: {new Date(profile.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        variant={profile.role === 'admin' ? "danger" : "primary"}
                                        size="sm"
                                        onClick={() => handleRoleChange(profile.id, profile.role, profile.email)}
                                    >
                                        {profile.role === 'admin' ? 'Revogar Admin' : 'Tornar Admin'}
                                    </Button>
                                </div>
                            ))}

                            {profiles.length === 0 && (
                                <p className="text-gray-500 text-center py-4">Nenhum usuário encontrado.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
