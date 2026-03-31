import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { supabase } from '../lib/supabase';
import { searchUsers } from '../services/graphService';
import { Users, User, Wifi, Tv, Mic, Volume2, Monitor, Laptop, X, Send, Clock, Hash, CheckCircle2 } from 'lucide-react';

interface BookingFormProps {
  startTime: Date | null;
  endTime: Date | null;
  room: { id: string; displayName: string; mail?: string };
  onClose: () => void;
  onSuccess: () => void;
}

const RECURSOS = [
  { id: 'wifi', label: 'Conexión Wifi', icon: <Wifi size={20} /> },
  { id: 'tv', label: 'Pantalla TV', icon: <Tv size={20} /> },
  { id: 'mic', label: 'Micrófono', icon: <Mic size={20} /> },
  { id: 'parlantes', label: 'Altavoces', icon: <Volume2 size={20} /> },
  { id: 'proyector', label: 'Proyector', icon: <Monitor size={20} /> },
  { id: 'laptop', label: 'Laptop / PC', icon: <Laptop size={20} /> },
];

export const BookingForm: React.FC<BookingFormProps> = ({ startTime, endTime, room, onClose, onSuccess }) => {
  const { register, handleSubmit } = useForm();
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantResults, setParticipantResults] = useState<any[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<any[]>([]);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Objetivos y agenda de la reunión...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-slate prose-sm focus:outline-none min-h-[140px] p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 hover:border-cyan-200 transition-all focus:ring-4 focus:ring-cyan-500/5 focus:border-[#00adef] font-medium text-slate-700',
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

      const requestData = {
        title: data.title,
        description_html: editor?.getHTML() || '',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        organizer_id: user.id,
        organizer_email: user.email,
        room_id: room.id,
        room_email: room.mail || room.id,
        participants: selectedParticipants,
        resources: selectedResources,
        status: 'pending'
      };

      const { error } = await supabase.from('room_requests').insert(requestData);
      if (error) throw error;

      alert('¡Solicitud de reserva enviada con éxito!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error al enviar la reserva:', err);
      alert('Error al enviar la solicitud: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#235b73]/60 backdrop-blur-md flex items-center justify-center p-6 z-50 overflow-y-auto animate-in fade-in duration-500">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 relative border border-white/20 animate-in zoom-in-95 duration-500 ring-1 ring-black/5">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-300 hover:text-[#235b73] hover:bg-slate-50 p-3 rounded-2xl transition-all shadow-sm"
        >
          <X size={24} />
        </button>

        <div className="p-12 md:p-16">
          <header className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <div className="px-4 py-1.5 bg-cyan-50 text-[#00adef] text-[10px] font-black uppercase tracking-[0.2em] rounded-full ring-2 ring-cyan-100 shadow-sm">Configuración de Reunión</div>
            </div>
            <h2 className="text-5xl font-black text-[#235b73] tracking-tighter mb-4">
              Reservar Sala
            </h2>
            <div className="flex items-center gap-3 text-slate-400 font-black uppercase text-xs tracking-widest bg-slate-50 w-fit px-5 py-2.5 rounded-2xl border border-slate-100">
               <Hash size={16} className="text-[#00adef]" />
               {room.displayName}
            </div>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            {/* Times */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-[#fcfdfe] p-6 rounded-[2rem] border border-cyan-50 ring-4 ring-cyan-50/5 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3 flex items-center gap-2"><Clock size={14} className="text-[#00adef]" /> Hora de Inicio</p>
                  <p className="text-2xl font-black text-[#235b73]">{startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mt-1.5">{startTime?.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
               </div>
               <div className="bg-[#fcfdfe] p-6 rounded-[2rem] border border-cyan-50 ring-4 ring-cyan-50/5 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3 flex items-center gap-2"><Clock size={14} className="text-[#00adef]" /> Hora de Finalización</p>
                  <p className="text-2xl font-black text-[#235b73]">{endTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mt-1.5">{endTime?.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
               </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4 px-4">Asunto de la Reunión</label>
              <input
                {...register('title', { required: true })}
                className="input-field py-5 text-xl font-black px-8 rounded-[2rem]"
                placeholder="Ej. Revisión Semanal de Proyecto"
              />
            </div>

            {/* Participants */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4 px-4">Asistentes Requeridos</label>
              <div className="relative mb-4">
                <Users className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input
                  type="text"
                  value={participantSearch}
                  onChange={handleSearchParticipants}
                  className="input-field pl-16 py-5 font-bold px-8 rounded-[2rem]"
                  placeholder="Buscar por nombre o correo..."
                />
                {participantResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-100 mt-3 rounded-[2.5rem] shadow-2xl z-50 overflow-hidden ring-4 ring-cyan-50/50 animate-in slide-in-from-top-4 duration-300">
                    {participantResults.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addParticipant(p)}
                        className="w-full text-left p-6 hover:bg-cyan-50 flex items-center justify-between group transition-colors border-b border-slate-50 last:border-0"
                      >
                        <div>
                          <span className="block font-black text-[#235b73] group-hover:text-[#00adef] text-base">{p.displayName}</span>
                          <span className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">{p.mail}</span>
                        </div>
                        <CheckCircle2 size={20} className="text-slate-100 group-hover:text-[#00adef] transition-all" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2.5 px-2">
                {selectedParticipants.map(p => (
                  <span key={p.id} className="inline-flex items-center gap-3 px-5 py-2.5 bg-[#235b73] text-white text-xs font-black uppercase tracking-tight rounded-2xl shadow-xl shadow-[#235b73]/20 hover:scale-105 transition-all">
                    <User size={14} className="text-[#00adef]" />
                    {p.displayName}
                    <button type="button" onClick={() => removeParticipant(p.id)} className="text-white/40 hover:text-white transition-colors ml-1"><X size={16} /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4 px-4">Agenda / Detalles Adicionales</label>
              <EditorContent editor={editor} />
            </div>

            {/* Resources */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4 px-4">Recursos Adicionales</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {RECURSOS.map(res => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => toggleResource(res.id)}
                    className={`flex flex-col items-start gap-4 p-6 border-2 rounded-[2.5rem] transition-all ${
                      selectedResources.includes(res.id)
                        ? 'bg-[#00adef] border-[#009bd6] text-white shadow-xl shadow-[#00adef]/20 scale-[1.03] ring-8 ring-cyan-50/50'
                        : 'bg-white border-slate-50 hover:border-cyan-100 hover:bg-cyan-50/10 text-slate-500'
                    }`}
                  >
                    <div className={`p-3 rounded-2xl transition-all ${
                      selectedResources.includes(res.id) ? 'bg-white/20 text-white' : 'bg-slate-50 text-[#235b73]'
                    }`}>
                      {res.icon}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.15em]">{res.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-12 border-t border-slate-50 flex flex-col md:flex-row gap-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-5 text-slate-300 font-black uppercase tracking-[0.4em] text-[10px] hover:text-[#235b73] hover:bg-slate-50 rounded-[2rem] transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] btn-accent py-5 text-sm font-black uppercase tracking-[0.25em] shadow-xl shadow-[#00adef]/20 rounded-[2rem] hover:-translate-y-1 active:scale-95"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send size={22} strokeWidth={2.5} /> Solicitar Reserva
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
