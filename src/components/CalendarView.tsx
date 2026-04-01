import { useEffect, useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { getCalendarEvents } from '../services/graphService';
import { supabase } from '../lib/supabase';

interface CalendarViewProps {
  selectedId: string;
  onSelectTime: (start: Date, end: Date) => void;
  onSelectEvent?: (request: any) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ selectedId, onSelectTime, onSelectEvent }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  // Trigger re-fetch when selectedId changes
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const view = calendarApi.view;
      fetchEvents({ start: view.activeStart, end: view.activeEnd });
    }
  }, [selectedId]);

  const fetchEvents = async (info: { start: Date; end: Date }) => {
    setLoading(true);
    try {
      console.log('Calendar: Iniciando sincronización de eventos...');

      // 1. Fetch from Microsoft Graph
      let graphEvents = [];
      try {
        graphEvents = await getCalendarEvents(
          selectedId,
          info.start.toISOString(),
          info.end.toISOString()
        );
      } catch (graphError: any) {
        console.error('Calendar: Error al obtener eventos de Microsoft Graph:', graphError);
        if (graphError.message?.includes('authenticated') || graphError.status === 401) {
          alert('Tu sesión de Microsoft ha expirado o no tiene permisos suficientes. Por favor, cierra sesión e inicia de nuevo.');
        }
      }

      const formattedGraphEvents = graphEvents;

      // 2. Fetch Pending/Approved from Supabase
      console.log(`Calendar: Consultando Supabase para rango: ${info.start.toISOString()} - ${info.end.toISOString()}`);
      const { data: supabaseRequests, error } = await supabase
        .from('room_requests')
        .select('*')
        .eq('room_id', selectedId)
        .or(`status.eq.pending,status.eq.approved`)
        .gte('end_time', info.start.toISOString())
        .lte('start_time', info.end.toISOString());

      if (error) throw error;
      console.log(`Calendar: Supabase devolvió ${supabaseRequests?.length || 0} solicitudes.`);

      const formattedSupabaseEvents = (supabaseRequests || []).map((r: any) => ({
        id: r.m365_event_id || r.id,
        title: r.status === 'pending' ? `[PENDIENTE] ${r.title}` : r.title,
        start: r.start_time,
        end: r.end_time,
        backgroundColor: r.status === 'approved' ? '#10b981' : '#00adef',
        borderColor: r.status === 'approved' ? '#059669' : '#009bd6',
        display: 'block',
        textColor: '#ffffff',
        extendedProps: {
          source: 'supabase',
          status: r.status,
          raw: r // Keep for editing
        }
      }));

      // Filter out Supabase events that are already in M365 to avoid duplicates
      const filteredSupabase = formattedSupabaseEvents.filter(se => {
        const m365Id = se.extendedProps.raw.m365_event_id;
        // Check for same ID or same title/time
        return !formattedGraphEvents.some((ge: any) =>
          (m365Id && ge.id === m365Id) ||
          (Math.abs(new Date(ge.start).getTime() - new Date(se.start).getTime()) < 300000) // Increase tolerance to 5 minutes
        );
      });

      console.log(`Calendar [SINCRO]: M365 (${formattedGraphEvents.length}), Supabase Pend/Aprob (${filteredSupabase.length})`);
      if (filteredSupabase.length > 0) console.table(filteredSupabase.map(e => ({ title: e.title, source: e.extendedProps.source, status: e.extendedProps.status })));

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

  const handleEventClick = (clickInfo: any) => {
    if (clickInfo.event.extendedProps.source === 'supabase') {
      if (onSelectEvent) {
        onSelectEvent(clickInfo.event.extendedProps.raw);
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-full relative">
      {loading && (
        <div className="absolute top-2 right-2 flex items-center gap-2 z-10 bg-white/80 p-1 rounded-md">
          <div className="w-3 h-3 border-2 border-[#235b73] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sincronizando</span>
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
        buttonText={{
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day: 'Día'
        }}
        locale={esLocale}
        selectable={true}
        select={handleSelect}
        eventClick={handleEventClick}
        events={events}
        datesSet={(info) => fetchEvents(info)}
        height="700px"
        allDaySlot={false}
        nowIndicator={true}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
      />
    </div>
  );
};
