import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Verificamos que el usuario que llama a la función esté autenticado
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !user) throw new Error('Unauthorized')

        // Verificamos que sea un administrador consultando su perfil
        const { data: callerProfile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || callerProfile?.role !== 'admin') {
            throw new Error('Forbidden: Only admins can perform this action')
        }

        // Si es admin, inicializamos el cliente con SERVICE_ROLE para saltar RLS y Auth limits
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const payload = await req.json()
        const { action, targetUserId, updates } = payload

        if (!targetUserId) throw new Error('Missing targetUserId')

        console.log(`Admin ${user.id} requested action: ${action} on user ${targetUserId}`)

        let resultData = null;

        switch (action) {
            case 'update_profile':
                // Actualizar la tabla profiles ignorando el RLS gracias al service_role
                const { data: updateData, error: updateError } = await supabaseAdmin
                    .from('profiles')
                    .update(updates)
                    .eq('id', targetUserId)
                    .select()

                if (updateError) throw updateError
                resultData = updateData
                break;

            case 'delete_user':
                // Eliminar DEFINITIVAMENTE la identidad del usuario de Auth (esto también borra su perfil por cascada si está así configurado en la DB, o lo deja huérfano)
                const { data: deleteData, error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)
                if (deleteError) throw deleteError
                resultData = deleteData
                break;

            default:
                throw new Error('Invalid action')
        }

        return new Response(JSON.stringify({ success: true, data: resultData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('Edge Function Error:', error.message)
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
