import React, { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getCalendarEvents } from '../services/graphService';
import { supabase } from '../lib/supabase';

interface CalendarViewProps {
  selectedId: string;
  onSelectTime: (start: Date, end: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ selectedId, onSelectTime }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  const fetchEvents = async (info: { start: Date; end: Date }) => {
    setLoading(true);
    try {
      console.log('Calendar: Iniciando sincronización de eventos...');

      // 1. Fetch from Microsoft Graph
      // Utilizamos el ID seleccionado que viene del RoomSelector (puede ser email o id)
      const graphEvents = await getCalendarEvents(
        selectedId,
        info.start.toISOString(),
        info.end.toISOString()
      );

      const formattedGraphEvents = graphEvents.map((e: any) => ({
        id: e.id,
        title: e.subject,
        start: e.start.dateTime,
        end: e.end.dateTime,
        backgroundColor: '#0078d4', // Microsoft Blue
        borderColor: '#005a9e',
        extendedProps: { source: 'm365' }
      }));

      // 2. Fetch Pending/Approved from Supabase
      const { data: supabaseRequests, error } = await supabase
        .from('room_requests')
        .select('*')
        .eq('room_id', selectedId)
        .or(`status.eq.pending,status.eq.approved`)
        .gte('start_time', info.start.toISOString())
        .lte('end_time', info.end.toISOString());

      if (error) throw error;

      const formattedSupabaseEvents = supabaseRequests.map((r: any) => ({
        id: r.id,
        title: `[PENDING] ${r.title}`,
        start: r.start_time,
        end: r.end_time,
        backgroundColor: r.status === 'approved' ? '#10b981' : '#f59e0b', // Emerald-500 : Amber-500
        borderColor: r.status === 'approved' ? '#059669' : '#d97706',
        extendedProps: { source: 'supabase', status: r.status }
      }));

      // Filter out Supabase events that are already in M365 (to avoid duplication if approved)
      const filteredSupabase = formattedSupabaseEvents.filter(se =>
        !formattedGraphEvents.some((ge: any) => ge.id === se.id || ge.title.includes(se.title))
      );

      setEvents([...formattedGraphEvents, ...filteredSupabase]);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (selectionInfo: any) => {
    onSelectTime(selectionInfo.start, selectionInfo.end);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-full">
      {loading && (
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-500 font-medium">Syncing...</span>
        </div>
      )}
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        selectable={true}
        select={handleSelect}
        events={events}
        datesSet={(info) => fetchEvents(info)}
        height="auto"
        allDaySlot={false}
        nowIndicator={true}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
      />
    </div>
  );
};
