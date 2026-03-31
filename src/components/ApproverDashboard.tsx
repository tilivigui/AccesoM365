import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, User, ListTodo, Info, LayoutGrid, Clock, Hash, Zap } from 'lucide-react';

export const ApproverDashboard: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('room_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setIsProcessing(id);
    try {
      if (status === 'approved') {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-approval`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'x-provider-token': session?.provider_token || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requestId: id })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Error al procesar la aprobación');
        }
      } else {
        const { error } = await supabase
          .from('room_requests')
          .update({ status: 'rejected' })
          .eq('id', id);

        if (error) throw error;
      }

      await fetchRequests();
      alert(`¡Reserva ${status === 'approved' ? 'aprobada' : 'rechazada'} con éxito!`);
    } catch (err: any) {
      console.error('Action error:', err);
      alert('Error: ' + err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-32 gap-6">
      <div className="w-16 h-16 border-4 border-[#00adef] border-t-transparent rounded-full animate-spin shadow-2xl shadow-cyan-100"></div>
      <p className="text-slate-300 font-black text-[10px] uppercase tracking-[0.5em]">Cargando Solicitudes...</p>
    </div>
  );

  return (
    <div className="space-y-16 max-w-6xl mx-auto">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div>
           <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-cyan-50 rounded-xl border border-cyan-100">
               <Zap className="text-[#00adef]" size={20} />
             </div>
             <span className="text-[10px] font-black text-[#00adef] uppercase tracking-[0.4em]">Panel de Control</span>
           </div>
           <h2 className="text-6xl font-black text-[#235b73] tracking-tighter">Administración</h2>
           <p className="text-slate-400 font-bold text-xl mt-4">Gestione las solicitudes de reserva y la gobernanza de espacios.</p>
        </div>

        <div className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-[2rem] border border-slate-100 w-fit shrink-0 shadow-inner">
           <button className="px-6 py-3 bg-white text-[#235b73] text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-100 border border-slate-100">Todas</button>
           <button className="px-6 py-3 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:text-[#00adef] hover:bg-cyan-50/50 transition-all">Pendientes</button>
           <button className="px-6 py-3 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:text-[#00adef] hover:bg-cyan-50/50 transition-all">Archivo</button>
        </div>
      </header>

      <div className="grid gap-10">
        {requests.map((req) => (
          <div key={req.id} className={`card-premium group hover:-translate-y-2 border-2 ${
            req.status === 'pending' ? 'ring-8 ring-cyan-50/20 border-cyan-50' : 'opacity-80 hover:opacity-100 grayscale-[0.3] border-slate-50 shadow-none'
          }`}>
            <div className="p-12 md:p-16">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-12 pb-12 border-b border-slate-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] shadow-xl flex items-center gap-3 ${
                      req.status === 'pending' ? 'bg-cyan-50 text-[#00adef] shadow-cyan-100 ring-4 ring-cyan-50/30' :
                      req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100 ring-4 ring-emerald-50' : 'bg-red-50 text-red-500 shadow-red-100 ring-4 ring-red-50'
                    }`}>
                       <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                          req.status === 'pending' ? 'bg-[#00adef]' :
                          req.status === 'approved' ? 'bg-emerald-500' : 'bg-red-500'
                       }`}></span>
                       {req.status === 'pending' ? 'Pendiente' : req.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                    </div>
                  </div>
                  <h3 className="text-4xl font-black text-[#235b73] mb-6 tracking-tighter group-hover:text-[#00adef] transition-all duration-500">{req.title}</h3>

                  <div className="flex flex-wrap gap-10 text-sm">
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><Clock size={14} className="text-[#00adef]" /> Programación</span>
                      <span className="font-black text-[#235b73]">{new Date(req.start_time).toLocaleString('es-ES', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="w-px h-12 bg-slate-100 hidden sm:block"></div>
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><User size={14} className="text-[#00adef]" /> Solicitante</span>
                      <span className="font-black text-[#235b73]">{req.organizer_email}</span>
                    </div>
                    <div className="w-px h-12 bg-slate-100 hidden sm:block"></div>
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><Hash size={14} className="text-[#00adef]" /> Sala</span>
                      <span className="font-black text-[#235b73] truncate max-w-[200px]">{req.room_id}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-5 gap-16">
                {/* Description */}
                <div className="md:col-span-3">
                  <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><Info size={16} className="text-[#00adef]" /> Detalles de la Reunión</h4>
                  <div className="p-8 bg-[#fcfdfe] border border-cyan-50 rounded-[3rem] ring-8 ring-cyan-50/5">
                    <div className="prose prose-slate prose-sm text-slate-700 leading-relaxed font-bold opacity-80" dangerouslySetInnerHTML={{ __html: req.description_html }} />
                  </div>
                </div>

                {/* Resources & Participants */}
                <div className="md:col-span-2 space-y-10">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><ListTodo size={16} className="text-[#00adef]" /> Recursos</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {req.resources && req.resources.map((res: string) => (
                        <span key={res} className="px-4 py-2.5 bg-white text-[#235b73] text-[10px] font-black uppercase tracking-widest rounded-2xl border border-slate-100 shadow-sm hover:border-[#00adef] transition-all">{res}</span>
                      ))}
                      {(!req.resources || req.resources.length === 0) && <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest italic">Sin recursos adicionales</span>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><User size={16} className="text-[#00adef]" /> Asistentes ({req.participants?.length || 0})</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {req.participants && req.participants.map((p: any) => (
                        <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 bg-cyan-50 text-[#235b73] text-[10px] font-black uppercase tracking-tight rounded-2xl border border-cyan-100 shadow-sm">
                          <div className="w-2 h-2 bg-[#00adef] rounded-full shadow-lg shadow-cyan-200"></div>
                          {p.displayName}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {req.status === 'pending' && (
                <div className="mt-16 pt-12 border-t border-slate-50 flex flex-col sm:flex-row gap-6">
                  <button
                    disabled={isProcessing === req.id}
                    onClick={() => handleAction(req.id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-3 py-5 border-2 border-slate-50 text-slate-300 font-black uppercase tracking-[0.4em] text-[10px] rounded-[2rem] hover:bg-red-50 hover:border-red-50 hover:text-red-400 transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                  >
                    <X size={20} strokeWidth={2.5} /> Rechazar
                  </button>
                  <button
                    disabled={isProcessing === req.id}
                    onClick={() => handleAction(req.id, 'approved')}
                    className="flex-[2] btn-accent py-5 text-sm font-black uppercase tracking-[0.25em] shadow-2xl shadow-[#00adef]/30 rounded-[2rem] active:scale-95 hover:-translate-y-1"
                  >
                    {isProcessing === req.id ? (
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <><Check size={20} strokeWidth={4} /> Aprobar y Sincronizar</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="text-center py-40 bg-white border-4 border-dashed border-slate-50 rounded-[4rem] shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-100 mx-auto mb-10 ring-8 ring-slate-50/50">
               <LayoutGrid size={48} />
            </div>
            <h4 className="text-4xl font-black text-[#235b73] mb-4 tracking-tighter opacity-20">Cola de Gestión Vacía</h4>
            <p className="text-slate-300 font-bold text-xl uppercase tracking-widest">No hay solicitudes pendientes de autorización.</p>
          </div>
        )}
      </div>
    </div>
  );
};
