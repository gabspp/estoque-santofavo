
import { supabase } from '@/lib/supabase'
import { type UserProfile, type UserRole } from '@/types'

export const userService = {
    getProfiles: async (): Promise<UserProfile[]> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('email')

        if (error) throw error
        return data || []
    },

    updateRole: async (userId: string, newRole: UserRole): Promise<void> => {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId)

        if (error) throw error
    }
}
