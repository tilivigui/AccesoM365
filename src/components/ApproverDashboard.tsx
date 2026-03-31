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
      <div className="w-10 h-10 border-4 border-[#00adef] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-300 font-black text-[9px] uppercase tracking-[0.4em]">Cargando Solicitudes...</p>
    </div>
  );

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 shadow-sm">
               <Zap className="text-[#00adef]" size={14} />
             </div>
             <span className="text-[9px] font-black text-[#00adef] uppercase tracking-[0.2em]">Centro de Gestión</span>
           </div>
           <h2 className="text-3xl font-black text-[#235b73] tracking-tighter">Administración</h2>
           <p className="text-slate-400 font-semibold text-sm mt-1">Autorización y gobernanza de espacios.</p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100/50 w-fit shrink-0">
           <button className="px-4 py-2 bg-white text-[#235b73] text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm border border-slate-100 transition-all">Todas</button>
           <button className="px-4 py-2 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-lg hover:text-[#00adef] transition-all">Pendientes</button>
           <button className="px-4 py-2 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-lg hover:text-[#00adef] transition-all">Archivo</button>
        </div>
      </header>

      <div className="grid gap-6">
        {requests.map((req) => (
          <div key={req.id} className={`card-premium group relative ${
            req.status === 'pending' ? 'ring-1 ring-slate-100' : 'opacity-70 grayscale-[0.5] shadow-none'
          }`}>
            <div className="p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-2 border ${
                      req.status === 'pending' ? 'bg-cyan-50 text-[#00adef] border-cyan-100' :
                      req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'
                    }`}>
                       <span className={`w-1.5 h-1.5 rounded-full ${
                          req.status === 'pending' ? 'bg-[#00adef] animate-pulse' :
                          req.status === 'approved' ? 'bg-emerald-500' : 'bg-red-500'
                       }`}></span>
                       {req.status === 'pending' ? 'Pendiente' : req.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-[#235b73] mb-4 tracking-tight group-hover:text-[#00adef] transition-all">{req.title}</h3>

                  <div className="flex flex-wrap gap-6 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-[#00adef]" />
                      {new Date(req.start_time).toLocaleString('es-ES', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={12} className="text-[#00adef]" />
                      {req.organizer_email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash size={12} className="text-[#00adef]" />
                      {req.room_id}
                    </div>
                  </div>
                </div>

                {req.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      disabled={isProcessing === req.id}
                      onClick={() => handleAction(req.id, 'rejected')}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all disabled:opacity-50"
                      title="Rechazar"
                    >
                      <X size={18} strokeWidth={2.5} />
                    </button>
                    <button
                      disabled={isProcessing === req.id}
                      onClick={() => handleAction(req.id, 'approved')}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#235b73] hover:bg-[#1a4558] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#235b73]/10 disabled:opacity-50"
                    >
                      {isProcessing === req.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <><Check size={14} strokeWidth={3} /> Aprobar</>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-8 grid md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                <div>
                  <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-2"><Info size={14} className="text-[#00adef]" /> Agenda</h4>
                  <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                    <div className="text-[11px] text-slate-600 leading-relaxed font-medium line-clamp-3 overflow-hidden" dangerouslySetInnerHTML={{ __html: req.description_html }} />
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div>
                    <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-2"><ListTodo size={14} className="text-[#00adef]" /> Recursos y Asistentes</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {req.resources && req.resources.map((res: string) => (
                        <span key={res} className="px-2.5 py-1 bg-white text-[#235b73] text-[9px] font-bold rounded-lg border border-slate-100">{res}</span>
                      ))}
                      {req.participants && req.participants.map((p: any) => (
                        <span key={p.id} className="px-2.5 py-1 bg-cyan-50 text-[#235b73] text-[9px] font-bold rounded-lg border border-cyan-100/50">{p.displayName}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="text-center py-20 bg-white border-2 border-dashed border-slate-50 rounded-3xl">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-100 mx-auto mb-6">
               <LayoutGrid size={32} />
            </div>
            <h4 className="text-xl font-black text-[#235b73] mb-2 tracking-tight opacity-20">Cola de Gestión Vacía</h4>
            <p className="text-slate-300 font-bold text-xs uppercase tracking-widest">No hay solicitudes pendientes.</p>
          </div>
        )}
      </div>
    </div>
  );
};
