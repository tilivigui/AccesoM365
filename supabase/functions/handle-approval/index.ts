import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-provider-token',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { requestId } = await req.json()

    // 1. Fetch the request details from Supabase
    const { data: request, error: fetchError } = await supabaseClient
      .from('room_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !request) {
      throw new Error('Request not found')
    }

    if (request.status !== 'pending') {
      throw new Error('Request is already processed')
    }

    // 2. Get the user's Microsoft Token from Supabase Auth
    // Note: This assumes the user is logged in and their provider token is available
    // For a real-world scenario, we might need a refresh token or a service principal.
    // In this lab context, we assume the token is passed or retrieved from the session.

    // We fetch the session of the user who is performing the approval
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized approver')

    // Normally, Supabase doesn't store the provider_token in the DB indefinitely.
    // However, for this implementation, we expect it to be available via the session
    // Or we use a Service Principal for Graph API if it's a corporate automation.

    // We get the Microsoft provider token from the custom header
    const providerToken = req.headers.get('x-provider-token');
    if (!providerToken) throw new Error('Microsoft provider token missing');

    // 3. Create the event in Microsoft Graph
    const eventBody = {
      subject: request.title,
      body: {
        contentType: 'html',
        content: request.description_html,
      },
      start: {
        dateTime: request.start_time,
        timeZone: 'UTC',
      },
      end: {
        dateTime: request.end_time,
        timeZone: 'UTC',
      },
      location: {
        displayName: request.room_id,
      },
      attendees: [
        {
          emailAddress: {
            address: request.room_email,
            name: request.room_id,
          },
          type: 'resource',
        },
        ...request.participants.map((p: any) => ({
          emailAddress: {
            address: p.mail,
            name: p.displayName,
          },
          type: 'required',
        })),
      ],
    }

    const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${providerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    })

    if (!graphResponse.ok) {
      const errorText = await graphResponse.text()
      throw new Error(`Microsoft Graph API Error: ${errorText}`)
    }

    const graphData = await graphResponse.json()

    // 4. Update Supabase status
    const { error: updateError } = await supabaseClient
      .from('room_requests')
      .update({
        status: 'approved',
        m365_event_id: graphData.id
      })
      .eq('id', requestId)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ message: 'Request approved and event created', eventId: graphData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
