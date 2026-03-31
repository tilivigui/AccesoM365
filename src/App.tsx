import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { RoomSelector } from './components/RoomSelector';
import { CalendarView } from './components/CalendarView';
import { BookingForm } from './components/BookingForm';
import { ApproverDashboard } from './components/ApproverDashboard';
import { LogOut, Calendar as CalendarIcon, ShieldCheck, User } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-blue-600" size={24} />
          <h1 className="text-xl font-bold text-gray-900">Room Manager</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('user')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                view === 'user' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Bookings
            </button>
            {(userRole === 'admin' || userRole === 'approver') && (
              <button
                onClick={() => setView('admin')}
                className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                  view === 'admin' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ShieldCheck size={18} /> Approvals
              </button>
            )}
          </div>

          <div className="h-6 w-px bg-gray-200"></div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900">{session.user.email}</p>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-hidden">
        {view === 'admin' ? (
          <div className="max-w-4xl mx-auto">
            <ApproverDashboard />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Select Room/User</h3>
                <RoomSelector
                  selectedId={selectedRoom?.id}
                  onSelect={(item) => setSelectedRoom(item)}
                />
              </section>

              {selectedRoom && (
                <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={18} />
                    <span className="text-xs font-bold uppercase opacity-80">Selected View</span>
                  </div>
                  <h4 className="text-lg font-bold truncate">{selectedRoom.displayName}</h4>
                  <p className="text-sm opacity-90 truncate">{selectedRoom.mail}</p>
                </div>
              )}
            </div>

            {/* Calendar */}
            <div className="lg:col-span-3">
              {selectedRoom ? (
                <CalendarView
                  selectedId={selectedRoom.id}
                  onSelectTime={(start, end) => setBookingTime({ start, end })}
                />
              ) : (
                <div className="h-full bg-white rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                  <CalendarIcon size={48} className="mb-4 opacity-20" />
                  <p className="text-lg font-medium">Select a room or user to view availability</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {bookingTime && selectedRoom && (
        <BookingForm
          startTime={bookingTime.start}
          endTime={bookingTime.end}
          room={selectedRoom}
          onClose={() => setBookingTime(null)}
          onSuccess={() => {
            setBookingTime(null);
            // In a real app, we'd trigger a calendar refresh here
          }}
        />
      )}
    </div>
  );
}

export default App;
