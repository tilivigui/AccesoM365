import { Client } from '@microsoft/microsoft-graph-client';
import { supabase } from '../lib/supabase';

/**
 * Get the Microsoft OAuth token from the Supabase session
 */
export async function getGraphAccessToken(): Promise<string | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('GraphService: Error obteniendo sesión de Supabase:', error);
    return null;
  }

  const token = session?.provider_token;

  if (!token) {
    console.warn('GraphService: [ALERTA] No se encontró provider_token en la sesión actual.');
    console.log('GraphService: Detalles de sesión:', {
      hasSession: !!session,
      user: session?.user?.email,
      expiresAt: session?.expires_at,
      hasToken: !!token
    });
  } else {
    console.log('GraphService: Token de Microsoft (M365) recuperado correctamente.');
  }

  return token || null;
}

/**
 * Initialize Microsoft Graph Client
 */
export async function getGraphClient(): Promise<Client | null> {
  const token = await getGraphAccessToken();
  if (!token) return null;

  return Client.init({
    authProvider: (done) => {
      done(null, token);
    },
  });
}

/**
 * Search users in the M365 tenant
 */
export async function searchUsers(query: string) {
  const client = await getGraphClient();
  if (!client) throw new Error('Not authenticated');

  const result = await client
    .api('/users')
    .filter(`startswith(displayName,'${query}') or startswith(mail,'${query}')`)
    .select('id,displayName,mail')
    .top(10)
    .get();

  return result.value;
}

/**
 * List available meeting rooms (Places)
 */
export async function listRooms() {
  const client = await getGraphClient();
  if (!client) throw new Error('Not authenticated');

  // Microsoft Graph API to get rooms
  const result = await client
    .api('/places/microsoft.graph.room')
    .get();

  return result.value;
}

/**
 * Fetch and format calendar events for a specific user or room
 */
export async function getCalendarEvents(id: string, start: string, end: string) {
  if (!id) return [];

  const client = await getGraphClient();
  if (!client) {
    console.error('GraphService: Cliente no inicializado - Falta autenticación.');
    throw new Error('Not authenticated');
  }

  // Resolvemos el endpoint correcto. Para recursos (salas), /users/{email} es lo estándar.
  let endpoint = `/users/${id}/calendarView`;

  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email === id || id === 'me') {
    endpoint = `/me/calendarView`;
  }

  try {
    const result = await client
      .api(endpoint)
      .header('Prefer', 'outlook.timezone="UTC"')
      .query({
        startDateTime: start,
        endDateTime: end,
      })
      .select('id,subject,start,end,location,isAllDay,showAs')
      .top(100)
      .get();

    return result.value.map((e: any) => ({
      id: e.id,
      title: e.subject || '(Sin Asunto)',
      start: e.start.dateTime,
      end: e.end.dateTime,
      allDay: e.isAllDay,
      backgroundColor: e.showAs === 'busy' ? '#235b73' : '#00adef',
      borderColor: '#ffffff20',
      textColor: '#ffffff',
      extendedProps: {
        source: 'm365',
        location: e.location?.displayName,
        showAs: e.showAs
      }
    }));
  } catch (error: any) {
    console.error(`GraphService: Error en fetch de eventos para ${id}:`, {
      endpoint,
      message: error.message,
      status: error.status
    });

    if (error.status === 403 || error.status === 404) {
      return [];
    }

    throw error;
  }
}

/**
 * Fetch current user's profile from Graph
 */
export async function getMe() {
  const client = await getGraphClient();
  if (!client) throw new Error('Not authenticated');

  return await client.api('/me').get();
}
