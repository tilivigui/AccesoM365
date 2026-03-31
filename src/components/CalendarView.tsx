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
}

export const CalendarView: React.FC<CalendarViewProps> = ({ selectedId, onSelectTime }) => {
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
      // Utilizamos el ID seleccionado que viene del RoomSelector (puede ser email o id)
      let graphEvents = [];
      try {
        graphEvents = await getCalendarEvents(
          selectedId,
          info.start.toISOString(),
          info.end.toISOString()
        );
      } catch (graphError: any) {
        console.error('Calendar: Error al obtener eventos de Microsoft Graph:', graphError);
        // Si es un error de autenticación (token expirado o ausente), notificamos al usuario
        if (graphError.message?.includes('authenticated') || graphError.status === 401) {
          alert('Tu sesión de Microsoft ha expirado o no tiene permisos suficientes. Por favor, cierra sesión e inicia de nuevo.');
        }
      }

      const formattedGraphEvents = graphEvents;

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
        display: 'block',
        textColor: '#ffffff',
        extendedProps: { source: 'supabase', status: r.status }
      }));

      // Filter out Supabase events that are already in M365 (to avoid duplication if approved)
      // Usamos una lógica de comparación de títulos (limpiando el prefijo [PENDING]) y tiempos
      const filteredSupabase = formattedSupabaseEvents.filter(se => {
        const cleanSupabaseTitle = se.title.replace(/^\[PENDING\]\s*/, '');
        return !formattedGraphEvents.some((ge: any) =>
          ge.id === se.id ||
          (ge.title === cleanSupabaseTitle && Math.abs(new Date(ge.start).getTime() - new Date(se.start).getTime()) < 60000)
        );
      });

      console.log(`Calendar: Eventos M365: ${formattedGraphEvents.length}, Eventos Supabase (filt): ${filteredSupabase.length}`);
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
        buttonText={{
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day: 'Día'
        }}
        locale={esLocale}
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
