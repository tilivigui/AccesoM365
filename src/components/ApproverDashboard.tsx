import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, Calendar, User, Building2, ListTodo, Info } from 'lucide-react';

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
        // Call Edge Function for approval (M365 Event Creation)
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
        // Direct update for rejection
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
    <div className="flex justify-center p-12">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Room Request Management</h2>
      <p className="text-gray-500">Review and manage incoming room reservation requests.</p>

      <div className="grid gap-6">
        {requests.map((req) => (
          <div key={req.id} className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all ${
            req.status === 'pending' ? 'border-amber-200 ring-1 ring-amber-50' : 'border-gray-200 grayscale-[0.5]'
          }`}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{req.title}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Calendar size={16} /> {new Date(req.start_time).toLocaleString()} - {new Date(req.end_time).toLocaleTimeString()}</span>
                    <span className="flex items-center gap-1"><User size={16} /> {req.organizer_email}</span>
                    <span className="flex items-center gap-1"><Building2 size={16} /> {req.room_id}</span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {req.status}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Description */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Info size={14} /> Description</h4>
                  <div className="prose prose-sm text-gray-700 max-h-32 overflow-y-auto" dangerouslySetInnerHTML={{ __html: req.description_html }} />
                </div>

                {/* Resources & Participants */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><ListTodo size={14} /> Resources</h4>
                    <div className="flex flex-wrap gap-2">
                      {req.resources && req.resources.map((res: string) => (
                        <span key={res} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded border border-blue-100">{res}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><User size={14} /> Participants ({req.participants?.length || 0})</h4>
                    <div className="flex flex-wrap gap-2">
                      {req.participants && req.participants.map((p: any) => (
                        <span key={p.id} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{p.displayName}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {req.status === 'pending' && (
                <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4">
                  <button
                    disabled={isProcessing === req.id}
                    onClick={() => handleAction(req.id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <X size={20} /> Reject
                  </button>
                  <button
                    disabled={isProcessing === req.id}
                    onClick={() => handleAction(req.id, 'approved')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50"
                  >
                    {isProcessing === req.id ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <><Check size={20} /> Approve & Create Event</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="text-center py-20 bg-white border-2 border-dashed border-gray-200 rounded-2xl">
            <p className="text-gray-500 font-medium">No requests found</p>
          </div>
        )}
      </div>
    </div>
  );
};
