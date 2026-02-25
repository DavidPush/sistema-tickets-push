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

        // Determine color and icons based on priority
        let accentColor = "default"
        let priorityIcon = "https://img.icons8.com/fluency/48/info.png"
        const p = priority?.toLowerCase() || 'medium'

        if (p === 'hugh' || p === 'high' || p === 'critical') {
            accentColor = "attention"
            priorityIcon = "https://img.icons8.com/fluency/48/high-priority.png"
        } else if (p === 'medium') {
            accentColor = "warning"
            priorityIcon = "https://img.icons8.com/fluency/48/error.png"
        } else {
            accentColor = "accent"
            priorityIcon = "https://img.icons8.com/fluency/48/low-priority.png"
        }

        // Determine event icon
        let eventIcon = "https://img.icons8.com/fluency/96/ticket.png"
        if (subject?.toLowerCase().includes('respuesta') || subject?.toLowerCase().includes('mensaje')) {
            eventIcon = "https://img.icons8.com/fluency/96/comments.png"
        } else if (subject?.toLowerCase().includes('asignado')) {
            eventIcon = "https://img.icons8.com/fluency/96/user-male-circle.png"
        } else if (subject?.toLowerCase().includes('resuelto')) {
            eventIcon = "https://img.icons8.com/fluency/96/ok.png"
        }

        // Prepare text content
        const textContent = content || html?.replace(/<[^>]*>?/gm, '') || 'Sin detalles adicionales';

        // Prepare attachments section
        const attachmentItems: any[] = [];
        if (payload.attachments && Array.isArray(payload.attachments)) {
            payload.attachments.forEach((att: any) => {
                if (att.type?.startsWith('image/') || att.url?.match(/\.(jpeg|jpg|gif|png)$/i)) {
                    attachmentItems.push({
                        "type": "Image",
                        "url": att.url,
                        "size": "Large",
                        "altText": "Adjunto",
                        "spacing": "Medium"
                    });
                } else {
                    attachmentItems.push({
                        "type": "TextBlock",
                        "text": `📎 [Descargar: ${att.name || 'Archivo'}](${att.url})`,
                        "wrap": true,
                        "spacing": "Small"
                    });
                }
            });
        }

        // Action URLs with deep linking for auto-actions
        const baseUrl = ticketUrl || "https://push-hr-tickets.netlify.app/";
        const assignUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}action=assign&id=${ticketId}`;
        const resolveUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}action=resolve&id=${ticketId}`;

        // Premium AdaptiveCard format
        const teamsMessage = {
            "type": "message",
            "attachments": [
                {
                    "contentType": "application/vnd.microsoft.card.adaptive",
                    "content": {
                        "type": "AdaptiveCard",
                        "body": [
                            {
                                "type": "ColumnSet",
                                "columns": [
                                    {
                                        "type": "Column",
                                        "width": "auto",
                                        "items": [
                                            {
                                                "type": "Image",
                                                "url": eventIcon,
                                                "size": "Medium",
                                                "style": "Person"
                                            }
                                        ]
                                    },
                                    {
                                        "type": "Column",
                                        "width": "stretch",
                                        "items": [
                                            {
                                                "type": "TextBlock",
                                                "text": subject || "Actualización de Ticket",
                                                "weight": "Bolder",
                                                "size": "Large",
                                                "wrap": true
                                            },
                                            {
                                                "type": "TextBlock",
                                                "spacing": "None",
                                                "text": title || "Sistema Push HR",
                                                "isSubtle": true,
                                                "wrap": true
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                "type": "Container",
                                "spacing": "Medium",
                                "separator": true,
                                "items": [
                                    {
                                        "type": "FactSet",
                                        "facts": [
                                            { "title": "👤 Creado por:", "value": payload.creator || "N/A" },
                                            { "title": "🚨 Prioridad:", "value": p.toUpperCase() },
                                            { "title": "🆔 ID Ticket:", "value": ticketId ? `TK-${ticketId.toString().padStart(4, '0')}` : "N/A" }
                                        ]
                                    }
                                ]
                            },
                            {
                                "type": "TextBlock",
                                "text": `**Mensaje:**\n\n${textContent}`,
                                "wrap": true,
                                "spacing": "Large"
                            },
                            ...attachmentItems
                        ],
                        "actions": [
                            {
                                "type": "Action.OpenUrl",
                                "title": "Ver Detalle",
                                "url": baseUrl,
                                "style": "default"
                            },
                            {
                                "type": "Action.OpenUrl",
                                "title": "⚡ Tomar Ticket",
                                "url": assignUrl,
                                "style": "positive"
                            },
                            {
                                "type": "Action.OpenUrl",
                                "title": "✅ Resolver",
                                "url": resolveUrl
                            }
                        ],
                        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                        "version": "1.4"
                    }
                }
            ]
        };

        const res = await fetch(TEAMS_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teamsMessage)
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
