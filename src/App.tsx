import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { RoomSelector } from './components/RoomSelector';
import { CalendarView } from './components/CalendarView';
import { BookingForm } from './components/BookingForm';
import { ApproverDashboard } from './components/ApproverDashboard';
import { LogOut, Calendar as CalendarIcon, ShieldCheck, LayoutGrid, Search, Bell, Settings, User, Clock } from 'lucide-react';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasProviderToken, setHasProviderToken] = useState(true);
  const [userRole, setUserRole] = useState<string>('user');
  const [view, setView] = useState<'user' | 'admin'>('user');
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [bookingTime, setBookingTime] = useState<{ start: Date; end: Date } | null>(null);
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    console.log('App: Inicializando sesión...');

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('App: Sesión inicial recuperada:', session ? 'Usuario autenticado' : 'Sin sesión');
      setSession(session);
      setHasProviderToken(!!session?.provider_token);
      if (session?.user) {
        fetchUserRole(session.user.id, session.user.email);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('App: Cambio en el estado de Auth:', event, session ? 'Usuario autenticado' : 'Sin sesión');
      setSession(session);
      setHasProviderToken(!!session?.provider_token);
      if (session?.user) {
        fetchUserRole(session.user.id, session.user.email);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [session]);

  // Effect to fetch notifications when role is determined or changes
  useEffect(() => {
    if (session?.user && (userRole === 'admin' || userRole === 'approver')) {
      fetchNotifications();
      // Refetch every minute for real-time visibility for approvers
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [userRole, session]);

  const fetchNotifications = async () => {
    console.log('App: Buscando solicitudes pendientes para notificaciones...');
    const { data, error } = await supabase
      .from('room_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('App: Error al cargar notificaciones:', error);
    } else if (data) {
      console.log(`App: Se encontraron ${data.length} notificaciones.`);
      setNotifications(data);
    }
  };

  const fetchUserRole = async (userId: string, email?: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('App: Error al obtener rol:', error);
      return;
    }

    if (data) {
      console.log(`App: Rol de usuario detectado: ${data.role}`);
      setUserRole(data.role);
      // Automatically switch to admin view if the logged-in user is the TI supervisor
      if (email === 'supervisorti@livigui.com') {
        setUserRole('approver'); // Fail-safe: asegurar rol de aprobador
        setView('admin');
      }
    } else if (email === 'supervisorti@livigui.com') {
      // Si no hay perfil pero es el supervisor, forzar rol
      console.log('App: Forzando rol de aprobador para el supervisor (sin perfil DB)');
      setUserRole('approver');
      setView('admin');
    }
  };

  const handleLogout = () => supabase.auth.signOut();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfe]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#00adef] border-t-transparent rounded-full animate-spin shadow-xl shadow-cyan-100"></div>
          <p className="text-slate-300 font-black text-[10px] uppercase tracking-[0.5em]">Verificando Sesión...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen bg-[#fcfdfe] overflow-hidden text-slate-900 font-sans text-sm">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col shrink-0">
        <div className="p-6 mb-2">
          <div className="flex items-center gap-2.5">
             <div className="p-2 bg-[#235b73] rounded-lg shadow-lg shadow-[#235b73]/10">
               <CalendarIcon className="text-[#00adef]" size={18} strokeWidth={2.5} />
             </div>
             <span className="text-lg font-black tracking-tighter text-[#235b73]">LIVIGUI <span className="text-[#00adef] opacity-60">SALAS</span></span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 mt-6 px-2">Espacio de Trabajo</div>
          <button
            onClick={() => setView('user')}
            className={`w-full nav-link ${view === 'user' ? 'nav-link-active' : 'nav-link-inactive'}`}
          >
            <LayoutGrid size={20} />
            <span>Panel de Reservas</span>
          </button>

          {(userRole === 'admin' || userRole === 'approver') && (
            <button
              onClick={() => setView('admin')}
              className={`w-full nav-link ${view === 'admin' ? 'nav-link-active' : 'nav-link-inactive'}`}
            >
              <ShieldCheck size={20} />
              <span>Administración</span>
            </button>
          )}

          <div className="pt-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 px-2">Selección de Vista</div>
          <div className="px-1">
            <RoomSelector
              selectedId={selectedRoom?.id}
              onSelect={(item) => setSelectedRoom(item)}
            />
          </div>
        </nav>

        <div className="p-6 border-t border-slate-50 bg-[#fcfdfe]/50">
          <div className="flex items-center gap-3 mb-6 p-0.5">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-[#235b73] font-black border border-slate-100 shadow-sm text-xs">
              {session.user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[11px] font-bold truncate text-[#235b73]">{session.user.email}</p>
              <p className="text-[8px] font-black text-[#00adef] uppercase tracking-[0.1em] opacity-70">{userRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50/50 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all border border-transparent hover:border-red-100"
          >
            <LogOut size={14} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#fcfdfe] relative">
        {/* Header Bar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-50 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
             <div className="relative w-64 group">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#00adef] transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar en el workspace..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#00adef]/5 focus:border-[#00adef]/30 transition-all text-[11px] outline-none font-semibold placeholder:text-slate-300"
                />
             </div>
          </div>

          <div className="flex items-center gap-2 relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-xl transition-all relative group ${showNotifications ? 'bg-cyan-50 text-[#00adef]' : 'text-slate-300 hover:text-[#00adef] hover:bg-cyan-50'}`}
            >
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-1 bg-[#00adef] text-white text-[8px] font-black rounded-full border-2 border-white flex items-center justify-center animate-bounce">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200 ring-1 ring-black/5">
                <header className="px-5 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                  <span className="text-[10px] font-black text-[#235b73] uppercase tracking-widest">Notificaciones</span>
                  <span className="px-2 py-0.5 bg-[#00adef] text-white text-[8px] font-black rounded-full uppercase">{notifications.length} Pendientes</span>
                </header>
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => {
                        setEditingRequest(notif);
                        setShowNotifications(false);
                      }}
                      className="w-full text-left p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group"
                    >
                      <p className="text-[11px] font-black text-[#235b73] group-hover:text-[#00adef] truncate mb-1">{notif.title}</p>
                      <p className="text-[9px] text-slate-400 font-bold flex items-center gap-1.5">
                        <Clock size={10} className="text-[#00adef]" />
                        {new Date(notif.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {notif.organizer_email.split('@')[0]}
                      </p>
                    </button>
                  )) : (
                    <div className="p-10 text-center text-slate-300">
                       <Bell size={24} className="mx-auto mb-3 opacity-20" />
                       <p className="text-[10px] font-bold uppercase tracking-widest">Sin pendientes</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button className="p-2 text-slate-300 hover:text-[#235b73] hover:bg-slate-50 rounded-xl transition-all">
              <Settings size={18} />
            </button>
          </div>
        </header>

        {/* Dynamic View Content */}
        <div className="flex-1 p-8 overflow-y-auto relative custom-scrollbar">
          {!hasProviderToken && session && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-6">
              <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem] shadow-2xl flex items-center justify-between gap-6 animate-in slide-in-from-top-10 duration-700">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="text-amber-900 font-black text-sm uppercase tracking-tight">Sesión de Microsoft Incompleta</p>
                    <p className="text-amber-700 text-xs font-bold mt-1">El calendario no se sincronizará. Por favor, reconecta tu cuenta.</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-200"
                >
                  Reconectar
                </button>
              </div>
            </div>
          )}

          {view === 'admin' ? (
            <div className="max-w-5xl mx-auto pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ApproverDashboard />
            </div>
          ) : (
            <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
              {selectedRoom ? (
                <div className="h-full flex flex-col gap-6">
                  <header className="flex items-center justify-between px-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[8px] font-black text-[#00adef] uppercase tracking-[0.2em]">Vista del Calendario</span>
                      </div>
                      <h2 className="text-2xl font-black text-[#235b73] tracking-tighter leading-none">{selectedRoom.displayName}</h2>
                      <p className="text-slate-400 font-semibold flex items-center gap-1.5 mt-2 text-[10px]">
                        <User size={12} className="text-[#00adef]" />
                        {selectedRoom.mail}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="px-3 py-1 bg-cyan-50 text-[#00adef] text-[8px] font-black uppercase tracking-widest rounded-lg border border-cyan-100 shadow-sm">Activa</span>
                      <span className="text-slate-200 text-[10px] font-black">UTC +00:00</span>
                    </div>
                  </header>

                  <div className="flex-1 card-premium p-0.5 bg-white shadow-xl shadow-slate-200/40">
                    <CalendarView
                      selectedId={selectedRoom.id}
                      onSelectTime={(start, end) => setBookingTime({ start, end })}
                      onSelectEvent={(req) => setEditingRequest(req)}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto py-20">
                  <div className="w-32 h-32 bg-cyan-50 rounded-[3rem] flex items-center justify-center text-[#00adef] mb-10 border-2 border-cyan-100 animate-pulse shadow-xl shadow-cyan-100/20">
                    <CalendarIcon size={56} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-4xl font-black text-[#235b73] mb-6 tracking-tighter">Seleccione una Sala</h3>
                  <p className="text-slate-400 text-xl font-bold leading-relaxed">
                    Elija una sala de reuniones o el calendario de un usuario desde el panel lateral para visualizar la disponibilidad y programar su próxima reunión.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Booking Modal Overlay (New) */}
      {bookingTime && selectedRoom && (
        <BookingForm
          startTime={bookingTime.start}
          endTime={bookingTime.end}
          room={selectedRoom}
          userRole={userRole}
          onClose={() => setBookingTime(null)}
          onSuccess={() => {
            setBookingTime(null);
            if (userRole === 'admin' || userRole === 'approver') fetchNotifications();
          }}
        />
      )}

      {/* Booking Modal Overlay (Edit/Approve) */}
      {editingRequest && (
        <BookingForm
          startTime={new Date(editingRequest.start_time)}
          endTime={new Date(editingRequest.end_time)}
          room={{
            id: editingRequest.room_id,
            displayName: editingRequest.room_id, // Fallback if name not in DB
            mail: editingRequest.room_email
          }}
          requestData={editingRequest}
          userRole={userRole}
          onClose={() => setEditingRequest(null)}
          onSuccess={() => {
            setEditingRequest(null);
            if (userRole === 'admin' || userRole === 'approver') fetchNotifications();
          }}
        />
      )}
    </div>
  );
}

export default App;
