// Supabase Edge Function: notify-email
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const TEAMS_WEBHOOK_URL = Deno.env.get('TEAMS_WEBHOOK_URL')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const payload = await req.json()
        console.log('Incoming Payload:', JSON.stringify(payload))
        const { to, subject, html, content, ticketId, priority, creator, title, ticketUrl } = payload

        console.log(`Sending Polished Teams Notification: ${subject}`)

        if (!TEAMS_WEBHOOK_URL) {
            throw new Error('TEAMS_WEBHOOK_URL is not set')
        }

        // Determine color based on priority
        let themeColor = "5A3FA3" // Default Purple
        const p = priority?.toLowerCase() || 'medium'
        if (p === 'hugh' || p === 'high' || p === 'critical') themeColor = "E74C3C" // Red
        if (p === 'medium') themeColor = "F39C12" // Orange

        // Prepare text content
        const textContent = content || html?.replace(/<[^>]*>?/gm, '') || 'Sin detalles adicionales';

        // Premium MessageCard format
        const teamsMessage: any = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": themeColor,
            "summary": subject,
            "sections": [
                {
                    "activityTitle": `🎫 ${subject}`,
                    "activitySubtitle": title || "Actualización de Ticket",
                    "activityImage": "https://img.icons8.com/fluency/96/ticket.png",
                    "facts": [
                        { "name": "Creado por:", "value": creator || "N/A" },
                        { "name": "Prioridad:", "value": p.toUpperCase() },
                        { "name": "ID Ticket:", "value": ticketId ? `TK-${ticketId.toString().padStart(4, '0')}` : "N/A" }
                    ],
                    "text": `**Mensaje:**\n\n${textContent}`,
                    "markdown": true
                }
            ],
            "potentialAction": [
                {
                    "@type": "OpenUri",
                    "name": "Ver Ticket en el Panel",
                    "targets": [
                        { "os": "default", "uri": ticketUrl || "https://glzhkzmbcnizaamqtdin.supabase.co" }
                    ]
                }
            ]
        };

        const res = await fetch(TEAMS_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teamsMessage),
        })

        const responseText = await res.text();
        console.log('Teams API Response Status:', res.status)

        if (!res.ok) {
            return new Response(JSON.stringify({
                error: 'Teams Webhook Error',
                details: responseText,
                status: res.status
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: res.status,
            })
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        const err = error as Error;
        console.error('Error in notify-email function:', err.message)
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
