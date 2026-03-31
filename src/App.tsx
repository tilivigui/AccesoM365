import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { RoomSelector } from './components/RoomSelector';
import { CalendarView } from './components/CalendarView';
import { BookingForm } from './components/BookingForm';
import { ApproverDashboard } from './components/ApproverDashboard';
import { LogOut, Calendar as CalendarIcon, ShieldCheck, LayoutGrid, Search, Bell, Settings, User } from 'lucide-react';

function App() {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [view, setView] = useState<'user' | 'admin'>('user');
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [bookingTime, setBookingTime] = useState<{ start: Date; end: Date } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchUserRole(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchUserRole(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setUserRole(data.role);
    }
  };

  const handleLogout = () => supabase.auth.signOut();

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen bg-[#fcfdfe] overflow-hidden text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-80 bg-white border-r border-slate-100 flex flex-col shrink-0">
        <div className="p-10 mb-6">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-[#235b73] rounded-xl shadow-lg shadow-[#235b73]/20">
               <CalendarIcon className="text-[#00adef]" size={24} strokeWidth={2.5} />
             </div>
             <span className="text-2xl font-black tracking-tighter text-[#235b73]">LIVIGUI <span className="text-[#00adef] opacity-70">SALAS</span></span>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2.5 overflow-y-auto">
          <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] mb-6 px-4">Espacio de Trabajo</div>
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

          <div className="pt-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] mb-6 px-4">Selección de Vista</div>
          <div className="px-2">
            <RoomSelector
              selectedId={selectedRoom?.id}
              onSelect={(item) => setSelectedRoom(item)}
            />
          </div>
        </nav>

        <div className="p-8 border-t border-slate-50 bg-[#fcfdfe]/50">
          <div className="flex items-center gap-4 mb-8 p-1">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center text-[#235b73] font-black border border-cyan-100 shadow-sm">
              {session.user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-black truncate text-[#235b73]">{session.user.email}</p>
              <p className="text-[10px] font-black text-[#00adef] uppercase tracking-[0.2em] opacity-80">{userRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-400 hover:text-red-500 hover:bg-red-50 font-black text-xs uppercase tracking-widest rounded-2xl transition-all"
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#fcfdfe]">
        {/* Header Bar */}
        <header className="h-24 bg-white border-b border-slate-50 px-10 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
             <div className="relative w-80">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="text"
                  placeholder="Búsqueda universal..."
                  className="w-full pl-12 pr-4 py-3 bg-[#fcfdfe] border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-cyan-500/5 focus:border-[#00adef] transition-all text-sm outline-none font-bold placeholder:text-slate-300"
                />
             </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-3 text-slate-300 hover:text-[#00adef] hover:bg-cyan-50 rounded-2xl transition-all relative group">
              <Bell size={22} />
              <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-[#00adef] rounded-full border-2 border-white ring-2 ring-cyan-50"></span>
            </button>
            <button className="p-3 text-slate-300 hover:text-[#235b73] hover:bg-slate-50 rounded-2xl transition-all">
              <Settings size={22} />
            </button>
          </div>
        </header>

        {/* Dynamic View Content */}
        <div className="flex-1 p-10 overflow-y-auto">
          {view === 'admin' ? (
            <div className="max-w-6xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <ApproverDashboard />
            </div>
          ) : (
            <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-700">
              {selectedRoom ? (
                <div className="h-full flex flex-col gap-8">
                  <header className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-[#00adef] uppercase tracking-[0.3em]">Vista del Calendario</span>
                      </div>
                      <h2 className="text-4xl font-black text-[#235b73] tracking-tighter">{selectedRoom.displayName}</h2>
                      <p className="text-slate-400 font-bold flex items-center gap-2 mt-2">
                        <User size={16} className="text-[#00adef]" />
                        {selectedRoom.mail}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-1.5 bg-cyan-50 text-[#00adef] text-[10px] font-black uppercase tracking-widest rounded-full ring-2 ring-cyan-100 shadow-sm">Activa</span>
                      <span className="text-slate-200 text-sm font-black">GMT-05:00</span>
                    </div>
                  </header>

                  <div className="flex-1 card-premium p-1 bg-white">
                    <CalendarView
                      selectedId={selectedRoom.id}
                      onSelectTime={(start, end) => setBookingTime({ start, end })}
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

      {/* Booking Modal Overlay */}
      {bookingTime && selectedRoom && (
        <BookingForm
          startTime={bookingTime.start}
          endTime={bookingTime.end}
          room={selectedRoom}
          onClose={() => setBookingTime(null)}
          onSuccess={() => setBookingTime(null)}
        />
      )}
    </div>
  );
}

export default App;
