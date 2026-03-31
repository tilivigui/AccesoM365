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
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-8 mb-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
               <CalendarIcon className="text-white" size={20} strokeWidth={2.5} />
             </div>
             <span className="text-xl font-black tracking-tight">ROOMS<span className="text-blue-600">HUB</span></span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-4">Workspace</div>
          <button
            onClick={() => setView('user')}
            className={`w-full nav-link ${view === 'user' ? 'nav-link-active' : 'nav-link-inactive'}`}
          >
            <LayoutGrid size={20} />
            <span>Dashboard</span>
          </button>

          {(userRole === 'admin' || userRole === 'approver') && (
            <button
              onClick={() => setView('admin')}
              className={`w-full nav-link ${view === 'admin' ? 'nav-link-active' : 'nav-link-inactive'}`}
            >
              <ShieldCheck size={20} />
              <span>Admin Center</span>
            </button>
          )}

          <div className="pt-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-4">Selection</div>
          <div className="px-2">
            <RoomSelector
              selectedId={selectedRoom?.id}
              onSelect={(item) => setSelectedRoom(item)}
            />
          </div>
        </nav>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-6 p-1">
            <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 font-black border border-slate-300">
              {session.user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate text-slate-800">{session.user.email}</p>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-80">{userRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 font-bold text-sm rounded-xl transition-all"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Header Bar */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
             <div className="relative w-72">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Universal search..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm outline-none font-medium"
                />
             </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Dynamic View Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {view === 'admin' ? (
            <div className="max-w-5xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ApproverDashboard />
            </div>
          ) : (
            <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
              {selectedRoom ? (
                <div className="h-full flex flex-col gap-6">
                  <header className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedRoom.displayName}</h2>
                      <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                        <User size={14} className="text-blue-500" />
                        {selectedRoom.mail}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-black uppercase rounded-full ring-1 ring-green-200">Active</span>
                      <span className="text-slate-300 text-sm font-bold">GMT+00:00</span>
                    </div>
                  </header>

                  <div className="flex-1 card-premium p-6">
                    <CalendarView
                      selectedId={selectedRoom.id}
                      onSelectTime={(start, end) => setBookingTime({ start, end })}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                  <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center text-blue-600 mb-8 border-2 border-blue-100 animate-pulse">
                    <CalendarIcon size={40} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Select a workspace</h3>
                  <p className="text-slate-500 text-lg font-medium leading-relaxed">
                    Choose a meeting room or user calendar from the sidebar to view availability and start scheduling your next meeting.
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
