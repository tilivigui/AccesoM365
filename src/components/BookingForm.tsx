import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { supabase } from '../lib/supabase';
import { searchUsers } from '../services/graphService';
import { Users, Wifi, Tv, Mic, Volume2, Monitor, Laptop, X, Send, Clock, Hash, CheckCircle2 } from 'lucide-react';

interface BookingFormProps {
  startTime: Date | null;
  endTime: Date | null;
  room: { id: string; displayName: string; mail?: string };
  onClose: () => void;
  onSuccess: () => void;
}

const RESOURCES = [
  { id: 'wifi', label: 'Wifi', icon: <Wifi size={18} /> },
  { id: 'tv', label: 'TV Display', icon: <Tv size={18} /> },
  { id: 'mic', label: 'Microphone', icon: <Mic size={18} /> },
  { id: 'parlantes', label: 'Speakers', icon: <Volume2 size={18} /> },
  { id: 'proyector', label: 'Projector', icon: <Monitor size={18} /> },
  { id: 'laptop', label: 'Laptop', icon: <Laptop size={18} /> },
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
    content: '<p>Meeting objectives and agenda...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-0 focus:outline-none min-h-[120px] p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
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
      if (!user) throw new Error('Not authenticated');

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

      alert('Booking request sent successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error submitting booking:', err);
      alert('Error sending request: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 relative border border-white/20 animate-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-2 rounded-xl transition-all"
        >
          <X size={20} />
        </button>

        <div className="p-10">
          <header className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full ring-1 ring-blue-100">Meeting Setup</div>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              Reserve Workspace
            </h2>
            <p className="text-slate-500 font-medium text-lg flex items-center gap-2 mt-1">
              <Hash size={18} className="text-blue-500" />
              {room.displayName}
            </p>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Times */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 ring-1 ring-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Clock size={12} className="text-blue-500" /> Start Time</p>
                  <p className="font-black text-slate-800">{startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">{startTime?.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</p>
               </div>
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 ring-1 ring-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Clock size={12} className="text-blue-500" /> End Time</p>
                  <p className="font-black text-slate-800">{endTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">{endTime?.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</p>
               </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Meeting Topic</label>
              <input
                {...register('title', { required: true })}
                className="input-field py-4 text-lg font-bold"
                placeholder="E.g. Quarterly Strategic Review"
              />
            </div>

            {/* Participants */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Attendees</label>
              <div className="relative mb-3">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={participantSearch}
                  onChange={handleSearchParticipants}
                  className="input-field pl-12 py-3.5 font-bold"
                  placeholder="Invite participants by name or email..."
                />
                {participantResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 mt-2 rounded-2xl shadow-2xl z-50 overflow-hidden ring-1 ring-slate-100 animate-in slide-in-from-top-2 duration-200">
                    {participantResults.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addParticipant(p)}
                        className="w-full text-left p-4 hover:bg-slate-50 flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <span className="block font-black text-slate-800 group-hover:text-blue-600">{p.displayName}</span>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.mail}</span>
                        </div>
                        <CheckCircle2 size={16} className="text-slate-100 group-hover:text-blue-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedParticipants.map(p => (
                  <span key={p.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-lg shadow-slate-200">
                    {p.displayName}
                    <button type="button" onClick={() => removeParticipant(p.id)} className="text-slate-400 hover:text-white transition-colors"><X size={14} /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Briefing / Agenda</label>
              <EditorContent editor={editor} />
            </div>

            {/* Resources */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Requested Resources</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {RESOURCES.map(res => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => toggleResource(res.id)}
                    className={`flex items-center gap-3 p-4 border-2 rounded-2xl transition-all ${
                      selectedResources.includes(res.id)
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 ring-4 ring-blue-50'
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className={selectedResources.includes(res.id) ? 'text-white' : 'text-blue-500'}>{res.icon}</span>
                    <span className="text-xs font-black uppercase tracking-wider">{res.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-8 border-t border-slate-100 flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 text-slate-500 font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-50 rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1 py-4 text-sm font-black uppercase tracking-widest"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send size={18} strokeWidth={2.5} /> Request Booking
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
