import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Edit3,
  Search,
  RefreshCw,
  PauseCircle,
  PlayCircle
} from 'lucide-react';

interface RequestsManagementProps {
  onEdit: (request: any) => void;
}

export const RequestsManagement: React.FC<RequestsManagementProps> = ({ onEdit }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('mgmt_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_requests' }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      console.log('RequestsMgmt: DIAGNÓSTICO DE SESIÓN:', {
        email: user?.email,
        jwt_email: session?.access_token ? JSON.parse(atob(session.access_token.split('.')[1])).email : 'no-jwt',
        user_metadata_email: user?.user_metadata?.email,
        role: user?.role,
        id: user?.id
      });

      console.log('RequestsMgmt: Iniciando carga de todas las solicitudes...');

      const { data, error } = await supabase
        .from('room_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('RequestsMgmt: Error en SELECT:', error);
        throw error;
      }

      console.log('RequestsMgmt: DATOS RECUPERADOS:', data);
      console.log(`RequestsMgmt: Registros totales en respuesta: ${data?.length || 0}`);
      if (data) console.table(data.map(d => ({ title: d.title, organizer: d.organizer_email, status: d.status })));
      setRequests(data || []);
    } catch (err) {
      console.error('Error al cargar solicitudes:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
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
        if (!response.ok) throw new Error('Error en Edge Function');
      } else {
        const { error } = await supabase
          .from('room_requests')
          .update({ status })
          .eq('id', id);
        if (error) throw error;
      }
      alert(`Estado actualizado a ${status}`);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta solicitud permanentemente?')) return;
    setIsProcessing(id);
    try {
      const { error } = await supabase.from('room_requests').delete().eq('id', id);
      if (error) throw error;
      alert('Solicitud eliminada');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.organizer_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    const styles: any = {
      pending: 'bg-amber-50 text-amber-600 border-amber-100',
      approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      rejected: 'bg-red-50 text-red-600 border-red-100',
      suspended: 'bg-slate-100 text-slate-600 border-slate-200'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#235b73] tracking-tighter">Gestión de Solicitudes</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Total: {filteredRequests.length} registros</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 shadow-inner mr-2">
            {['all', 'pending', 'approved', 'rejected', 'suspended'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  filterStatus === s ? 'bg-white text-[#235b73] shadow-sm border border-slate-100' : 'text-slate-400 hover:text-[#235b73]'
                }`}
              >
                {s === 'all' ? 'Ver Todo' : s}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#00adef]/10 outline-none w-48 transition-all"
            />
          </div>
          <button onClick={fetchRequests} className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-[#00adef] transition-all">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Solicitud</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Organizador</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha/Sala</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-xs font-black text-[#235b73] truncate max-w-[200px]">{req.title}</p>
                    <p className="text-[9px] text-slate-300 font-bold uppercase mt-0.5">ID: {req.id.split('-')[0]}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-[#235b73]">
                        {req.organizer_email.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">{req.organizer_email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[10px] font-bold text-slate-500">{new Date(req.start_time).toLocaleDateString()}</p>
                    <p className="text-[9px] text-slate-300 font-black uppercase mt-0.5">{req.room_id.split('@')[0]}</p>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(req.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {req.status === 'pending' && (
                        <button disabled={isProcessing === req.id} onClick={() => updateStatus(req.id, 'approved')} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="Aprobar">
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                      {req.status === 'pending' && (
                        <button disabled={isProcessing === req.id} onClick={() => updateStatus(req.id, 'rejected')} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Rechazar">
                          <XCircle size={14} />
                        </button>
                      )}
                      {req.status !== 'suspended' ? (
                        <button disabled={isProcessing === req.id} onClick={() => updateStatus(req.id, 'suspended')} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-all" title="Suspender">
                          <PauseCircle size={14} />
                        </button>
                      ) : (
                        <button disabled={isProcessing === req.id} onClick={() => updateStatus(req.id, 'pending')} className="p-1.5 text-[#00adef] hover:bg-cyan-50 rounded-lg transition-all" title="Reactivar">
                          <PlayCircle size={14} />
                        </button>
                      )}
                      <button disabled={isProcessing === req.id} onClick={() => onEdit(req)} className="p-1.5 text-[#235b73] hover:bg-slate-100 rounded-lg transition-all" title="Actualizar">
                        <Edit3 size={14} />
                      </button>
                      <button disabled={isProcessing === req.id} onClick={() => deleteRequest(req.id)} className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRequests.length === 0 && (
            <div className="p-20 text-center text-slate-300">
              <AlertCircle size={32} className="mx-auto mb-4 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest">Sin registros encontrados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
