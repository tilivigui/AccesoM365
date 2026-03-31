import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, Calendar, User, ListTodo, Info, LayoutGrid, Hash } from 'lucide-react';

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
          throw new Error(errData.message || 'Error processing approval');
        }
      } else {
        const { error } = await supabase
          .from('room_requests')
          .update({ status: 'rejected' })
          .eq('id', id);

        if (error) throw error;
      }

      await fetchRequests();
      alert(`Request ${status} successfully!`);
    } catch (err: any) {
      console.error('Action error:', err);
      alert('Error: ' + err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-lg shadow-blue-100"></div>
      <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Loading Requests...</p>
    </div>
  );

  return (
    <div className="space-y-12">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-3">
             <LayoutGrid className="text-blue-600" size={24} />
             <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Governance</span>
           </div>
           <h2 className="text-5xl font-black text-slate-900 tracking-tight">Admin Center</h2>
           <p className="text-slate-500 font-medium text-lg mt-2">Manage organizational workspace requests and approvals.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit shrink-0">
           <button className="px-5 py-2 bg-white text-slate-900 text-xs font-black uppercase tracking-wider rounded-xl shadow-sm border border-slate-100">All</button>
           <button className="px-5 py-2 text-slate-500 text-xs font-black uppercase tracking-wider rounded-xl hover:text-slate-900 transition-colors">Pending</button>
           <button className="px-5 py-2 text-slate-500 text-xs font-black uppercase tracking-wider rounded-xl hover:text-slate-900 transition-colors">Archive</button>
        </div>
      </header>

      <div className="grid gap-8">
        {requests.map((req) => (
          <div key={req.id} className={`card-premium group hover:-translate-y-1 ${
            req.status === 'pending' ? 'ring-2 ring-blue-100/50 border-blue-100' : 'opacity-75 hover:opacity-100 grayscale-[0.2]'
          }`}>
            <div className="p-10">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-10 pb-8 border-b border-slate-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-1.5 ${
                      req.status === 'pending' ? 'bg-amber-100 text-amber-700 ring-4 ring-amber-50' :
                      req.status === 'approved' ? 'bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50' : 'bg-red-100 text-red-700 ring-4 ring-red-50'
                    }`}>
                       <span className={`w-2 h-2 rounded-full ${
                          req.status === 'pending' ? 'bg-amber-500' :
                          req.status === 'approved' ? 'bg-emerald-500' : 'bg-red-500'
                       }`}></span>
                       {req.status}
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-blue-600 transition-colors">{req.title}</h3>

                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12} className="text-blue-500" /> Schedule</span>
                      <span className="font-bold text-slate-700">{new Date(req.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="w-px h-8 bg-slate-100 hidden sm:block"></div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><User size={12} className="text-blue-500" /> Requested By</span>
                      <span className="font-bold text-slate-700">{req.organizer_email}</span>
                    </div>
                    <div className="w-px h-8 bg-slate-100 hidden sm:block"></div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Hash size={12} className="text-blue-500" /> Space ID</span>
                      <span className="font-bold text-slate-700">{req.room_id}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-5 gap-10">
                {/* Description */}
                <div className="md:col-span-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Info size={14} className="text-blue-500" /> Agenda Overview</h4>
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl ring-1 ring-slate-50">
                    <div className="prose prose-slate prose-sm text-slate-700 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: req.description_html }} />
                  </div>
                </div>

                {/* Resources & Participants */}
                <div className="md:col-span-2 space-y-8">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ListTodo size={14} className="text-blue-500" /> Resources</h4>
                    <div className="flex flex-wrap gap-2">
                      {req.resources && req.resources.map((res: string) => (
                        <span key={res} className="px-3 py-1.5 bg-white text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl border border-slate-100 shadow-sm">{res}</span>
                      ))}
                      {(!req.resources || req.resources.length === 0) && <span className="text-xs font-bold text-slate-300 italic">No resources requested</span>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><User size={14} className="text-blue-500" /> Attendees ({req.participants?.length || 0})</h4>
                    <div className="flex flex-wrap gap-2">
                      {req.participants && req.participants.map((p: any) => (
                        <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider rounded-xl border border-blue-100">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          {p.displayName}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {req.status === 'pending' && (
                <div className="mt-12 pt-8 border-t border-slate-100 flex gap-4">
                  <button
                    disabled={isProcessing === req.id}
                    onClick={() => handleAction(req.id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-slate-100 text-slate-400 font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-all disabled:opacity-50 active:scale-[0.98]"
                  >
                    <X size={20} strokeWidth={2.5} /> Reject Request
                  </button>
                  <button
                    disabled={isProcessing === req.id}
                    onClick={() => handleAction(req.id, 'approved')}
                    className="flex-3 btn-primary text-sm font-black uppercase tracking-[0.1em]"
                  >
                    {isProcessing === req.id ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <><Check size={20} strokeWidth={3} /> Approve & Synchronize</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="text-center py-32 bg-white border-2 border-dashed border-slate-100 rounded-[3rem] shadow-sm">
            <LayoutGrid size={64} className="mx-auto mb-8 text-slate-100" />
            <h4 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Governance Queue Clear</h4>
            <p className="text-slate-400 font-medium text-lg">There are no pending requests requiring authorization.</p>
          </div>
        )}
      </div>
    </div>
  );
};
