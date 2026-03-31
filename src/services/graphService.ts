import { Client } from '@microsoft/microsoft-graph-client';
import { supabase } from '../lib/supabase';

/**
 * Get the Microsoft OAuth token from the Supabase session
 */
export async function getGraphAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.provider_token || null;
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
 * Fetch calendar events for a specific user or room
 */
export async function getCalendarEvents(id: string, start: string, end: string) {
  const client = await getGraphClient();
  if (!client) throw new Error('Not authenticated');

  const result = await client
    .api(`/users/${id}/calendarView`)
    .query({
      startDateTime: start,
      endDateTime: end,
    })
    .select('id,subject,start,end,location,isAllDay')
    .get();

  return result.value;
}

/**
 * Fetch current user's profile from Graph
 */
export async function getMe() {
  const client = await getGraphClient();
  if (!client) throw new Error('Not authenticated');

  return await client.api('/me').get();
}
