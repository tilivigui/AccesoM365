import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-provider-token',
}

interface NotificationPayload {
  type: 'created' | 'approved' | 'rejected' | 'modified';
  requestId: string;
  requestData: {
    title: string;
    start_time: string;
    end_time: string;
    organizer_email: string;
    room_id: string;
    participants: any[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const providerToken = req.headers.get('x-provider-token');
    if (!providerToken) throw new Error('Microsoft provider token missing');

    const { type, requestData }: NotificationPayload = await req.json();

    const formatDate = (iso: string) => {
      const d = new Date(iso);
      return d.toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    let subject = '';
    let bodyContent = '';

    const detailsTable = `
      <div style="font-family: sans-serif; color: #235b73; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; max-width: 600px;">
        <h2 style="margin-top: 0; color: #00adef;">LIVIGUI SALAS</h2>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
        <p><strong>Evento:</strong> ${requestData.title}</p>
        <p><strong>Sala:</strong> ${requestData.room_id}</p>
        <p><strong>Inicio:</strong> ${formatDate(requestData.start_time)}</p>
        <p><strong>Fin:</strong> ${formatDate(requestData.end_time)}</p>
        <p><strong>Organizador:</strong> ${requestData.organizer_email}</p>
      </div>
    `;

    switch (type) {
      case 'created':
        subject = `Nueva Solicitud de Sala: ${requestData.title}`;
        bodyContent = `<p>Se ha creado una nueva solicitud de reserva pendiente de aprobación.</p>${detailsTable}`;
        break;
      case 'approved':
        subject = `Reserva APROBADA: ${requestData.title}`;
        bodyContent = `<p>Tu solicitud de reserva ha sido aprobada y agregada al calendario.</p>${detailsTable}`;
        break;
      case 'rejected':
        subject = `Reserva RECHAZADA: ${requestData.title}`;
        bodyContent = `<p>Lo sentimos, tu solicitud de reserva no ha sido aprobada.</p>${detailsTable}`;
        break;
      case 'modified':
        subject = `Reserva MODIFICADA: ${requestData.title}`;
        bodyContent = `<p>Los detalles de tu reserva han sido actualizados.</p>${detailsTable}`;
        break;
    }

    const recipients = [
      { emailAddress: { address: requestData.organizer_email } },
      { emailAddress: { address: 'supervisorti@livigui.com' } }, // Approver copy
      ...requestData.participants.map(p => ({ emailAddress: { address: p.mail } }))
    ];

    // Filter unique recipients
    const uniqueRecipients = Array.from(new Set(recipients.map(r => r.emailAddress.address)))
      .map(email => ({ emailAddress: { address: email } }));

    const emailBody = {
      message: {
        subject: subject,
        body: {
          contentType: 'HTML',
          content: bodyContent,
        },
        toRecipients: uniqueRecipients,
      },
      saveToSentItems: 'true',
    };

    const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${providerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailBody),
    });

    if (!graphResponse.ok) {
      const errorText = await graphResponse.text();
      console.error('Graph API Error:', errorText);
      throw new Error(`Error al enviar correo via Graph: ${errorText}`);
    }

    return new Response(
      JSON.stringify({ message: 'Notifications sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Notification Error:', error.message);
    return new Response(
      JSON.stringify({ message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
})
