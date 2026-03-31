import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { supabase } from '../lib/supabase';
import { searchUsers } from '../services/graphService';
import { Users, Wifi, Tv, Mic, Volume2, Monitor, Laptop, X, Send, Clock, Hash, CheckCircle2, type LucideProps } from 'lucide-react';

interface BookingFormProps {
  startTime: Date | null;
  endTime: Date | null;
  room: { id: string; displayName: string; mail?: string };
  onClose: () => void;
  onSuccess: () => void;
  requestData?: any; // Existing request for editing/approval
  userRole?: string;
}

const RECURSOS = [
  { id: 'wifi', label: 'Conexión Wifi', icon: Wifi },
  { id: 'tv', label: 'Pantalla TV', icon: Tv },
  { id: 'mic', label: 'Micrófono', icon: Mic },
  { id: 'parlantes', label: 'Altavoces', icon: Volume2 },
  { id: 'proyector', label: 'Proyector', icon: Monitor },
  { id: 'laptop', label: 'Laptop / PC', icon: Laptop },
];

export const BookingForm: React.FC<BookingFormProps> = ({ startTime, endTime, room, onClose, onSuccess, requestData, userRole }) => {
  const isEditing = !!requestData;
  const isApprover = userRole === 'admin' || userRole === 'approver';

  const { register, handleSubmit } = useForm({
    defaultValues: {
      title: requestData?.title || ''
    }
  });

  const [participantSearch, setParticipantSearch] = useState('');
  const [participantResults, setParticipantResults] = useState<any[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<any[]>(requestData?.participants || []);
  const [selectedResources, setSelectedResources] = useState<string[]>(requestData?.resources || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActioning, setIsActioning] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: requestData?.description_html || '<p>Objetivos y agenda de la reunión...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-slate prose-sm focus:outline-none min-h-[100px] p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-[#00adef]/30 transition-all focus:ring-2 focus:ring-[#00adef]/5 focus:border-[#00adef] font-medium text-slate-700 text-xs',
      },
    },
  });

  const handleSearchParticipants = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setParticipantSearch(val);
    if (val.length > 2) {
      const users = await searchUsers(val);
      setParticipantResults(users);
    }
  };

  const addParticipant = (user: any) => {
    if (!selectedParticipants.find(p => p.id === user.id)) {
      setSelectedParticipants([...selectedParticipants, user]);
    }
    setParticipantSearch('');
    setParticipantResults([]);
  };

  const removeParticipant = (id: string) => {
    setSelectedParticipants(selectedParticipants.filter(p => p.id !== id));
  };

  const toggleResource = (id: string) => {
    setSelectedResources(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const onSubmit = async (data: any) => {
    if (!startTime || !endTime) return;
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const payload = {
        title: data.title,
        description_html: editor?.getHTML() || '',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        participants: selectedParticipants,
        resources: selectedResources,
      };

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.provider_token) {
        throw new Error('Tu sesión de Microsoft ha expirado. Por favor, reconecta tu cuenta.');
      }

      if (isEditing) {
        const { error } = await supabase
          .from('room_requests')
          .update(payload)
          .eq('id', requestData.id);
        if (error) throw error;

        // Notificar cambio (Opcional, no bloquea el éxito si falla)
        try {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-event`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'x-provider-token': session?.provider_token,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'modified',
              requestId: requestData.id,
              requestData: { ...payload, organizer_email: user.email, room_id: room.displayName }
            })
          });
        } catch (notifErr) {
          console.error('Error enviando notificación (continuando):', notifErr);
        }

        alert('Reserva actualizada correctamente');
      } else {
        const { data: createdRecords, error } = await supabase.from('room_requests').insert({
          ...payload,
          organizer_id: user.id,
          organizer_email: user.email,
          room_id: room.id,
          room_email: room.mail || room.id,
          status: 'pending'
        }).select();

        if (error) throw error;
        const newRequest = createdRecords?.[0];
        if (!newRequest) throw new Error('Error al crear la solicitud');

        // Notificar creación (Opcional, no bloquea el éxito si falla)
        try {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-event`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'x-provider-token': session?.provider_token,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'created',
              requestId: newRequest.id,
              requestData: { ...payload, organizer_email: user.email, room_id: room.displayName }
            })
          });
        } catch (notifErr) {
          console.error('Error enviando notificación (continuando):', notifErr);
        }

        alert('¡Solicitud de reserva enviada con éxito!');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error al procesar la reserva:', err);
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprovalAction = async (status: 'approved' | 'rejected') => {
    if (!requestData?.id) return;
    setIsActioning(status);

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
          body: JSON.stringify({ requestId: requestData.id })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Error al procesar la aprobación');
        }
      } else {
        const { data: updatedRequest, error } = await supabase
          .from('room_requests')
          .update({ status: 'rejected' })
          .eq('id', requestData.id)
          .select()
          .single();

        if (error) throw error;

        // Notificar rechazo
        const { data: { session } } = await supabase.auth.getSession();
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-event`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'x-provider-token': session?.provider_token || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'rejected',
            requestId: requestData.id,
            requestData: updatedRequest
          })
        });
      }

      alert(`Reserva ${status === 'approved' ? 'aprobada' : 'rechazada'} con éxito`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error en acción de aprobación:', err);
      alert('Error: ' + err.message);
    } finally {
      setIsActioning(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-0 relative border border-slate-200 animate-in zoom-in-95 duration-300 flex flex-col custom-scrollbar">
        <header className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[9px] font-black text-[#00adef] uppercase tracking-[0.15em]">
                {isEditing ? 'Gestión de Solicitud' : 'Configuración de Reserva'}
              </span>
            </div>
            <h2 className="text-xl font-black text-[#235b73] tracking-tighter">
              {isEditing ? 'Detalles de la Reunión' : 'Nueva Reunión'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-[#235b73] hover:bg-slate-50 p-2 rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8 flex-1">
          {/* Room Context */}
          <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-wider bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100/50 w-fit">
              <Hash size={12} className="text-[#00adef]" />
              SALA: {room.displayName}
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                <div className="p-2 bg-white rounded-lg shadow-sm text-[#00adef]"><Clock size={16} /></div>
                <div>
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Inicio</p>
                  <p className="text-sm font-black text-[#235b73]">{startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                </div>
              </div>
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                <div className="p-2 bg-white rounded-lg shadow-sm text-[#00adef]"><Clock size={16} /></div>
                <div>
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Fin</p>
                  <p className="text-sm font-black text-[#235b73]">{endTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                </div>
              </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Asunto</label>
            <input
              {...register('title', { required: true })}
              className="input-field py-3.5 text-sm font-bold"
              placeholder="Ej. Revisión Semanal de Proyecto"
            />
          </div>

          {/* Participants */}
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Participantes</label>
            <div className="relative mb-3">
              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input
                type="text"
                value={participantSearch}
                onChange={handleSearchParticipants}
                className="input-field pl-10 py-3 text-xs"
                placeholder="Buscar por nombre o correo..."
              />
              {participantResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-100 mt-2 rounded-xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  {participantResults.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addParticipant(p)}
                      className="w-full text-left p-3.5 hover:bg-slate-50 flex items-center justify-between group transition-colors border-b border-slate-50 last:border-0"
                    >
                      <div>
                        <span className="block font-bold text-[#235b73] text-xs">{p.displayName}</span>
                        <span className="block text-[9px] text-slate-300 mt-0.5">{p.mail}</span>
                      </div>
                      <CheckCircle2 size={14} className="text-slate-100 group-hover:text-[#00adef]" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedParticipants.map(p => (
                <span key={p.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#235b73] text-white text-[10px] font-bold rounded-lg shadow-sm">
                  {p.displayName}
                  <button type="button" onClick={() => removeParticipant(p.id)} className="text-white/40 hover:text-white transition-colors"><X size={12} /></button>
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Agenda</label>
            <EditorContent editor={editor} />
          </div>

          {/* Resources */}
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Equipamiento</label>
            <div className="grid grid-cols-3 gap-2">
              {RECURSOS.map(res => {
                const Icon = res.icon as React.FC<LucideProps>;
                return (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => toggleResource(res.id)}
                    className={`flex items-center gap-2.5 p-3 border rounded-xl transition-all text-left ${
                      selectedResources.includes(res.id)
                        ? 'bg-[#235b73] border-[#235b73] text-white shadow-lg shadow-[#235b73]/10'
                        : 'bg-white border-slate-100 hover:border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className={`${selectedResources.includes(res.id) ? 'text-[#00adef]' : 'text-slate-300'}`}>
                      <Icon size={14} />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-tighter">{res.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <footer className="pt-8 border-t border-slate-50 bg-slate-50/30 flex gap-4 sticky bottom-0 z-10 backdrop-blur-sm">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-slate-400 font-bold uppercase tracking-widest text-[9px] hover:text-[#235b73] rounded-lg transition-all"
            >
              Cancelar
            </button>
          {isApprover && isEditing && requestData.status === 'pending' && (
            <>
              <button
                type="button"
                disabled={!!isActioning}
                onClick={() => handleApprovalAction('rejected')}
                className="flex-1 py-3 text-red-500 font-bold uppercase tracking-widest text-[9px] hover:bg-red-50 rounded-lg transition-all border border-red-100"
              >
                {isActioning === 'rejected' ? '...' : 'Rechazar'}
              </button>
              <button
                type="button"
                disabled={!!isActioning}
                onClick={() => handleApprovalAction('approved')}
                className="flex-1 bg-[#235b73] text-white py-3 shadow-lg shadow-[#235b73]/10 uppercase tracking-widest text-[9px] font-black rounded-lg hover:bg-[#1a4558]"
              >
                {isActioning === 'approved' ? 'Aprobando...' : 'Aprobar'}
              </button>
            </>
          )}

            <button
              type="submit"
            disabled={isSubmitting || !!isActioning || (isEditing && requestData.status !== 'pending' && !isApprover)}
              className="flex-[2] btn-accent py-3 shadow-lg shadow-[#00adef]/20 uppercase tracking-widest text-[10px] font-black"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                <Send size={18} strokeWidth={2.5} /> {isEditing ? 'Actualizar' : 'Solicitar Reserva'}
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
