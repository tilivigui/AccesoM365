import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { supabase } from '../lib/supabase';
import { searchUsers } from '../services/graphService';
import { Users, Wifi, Tv, Mic, Volume2, Monitor, Laptop, X, Send } from 'lucide-react';

interface BookingFormProps {
  startTime: Date | null;
  endTime: Date | null;
  room: { id: string; displayName: string; mail?: string };
  onClose: () => void;
  onSuccess: () => void;
}

const RESOURCES = [
  { id: 'wifi', label: 'Wifi', icon: <Wifi size={18} /> },
  { id: 'tv', label: 'TV', icon: <Tv size={18} /> },
  { id: 'mic', label: 'Micrófono', icon: <Mic size={18} /> },
  { id: 'parlantes', label: 'Parlantes', icon: <Volume2 size={18} /> },
  { id: 'proyector', label: 'Proyector', icon: <Monitor size={18} /> },
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
    content: '<p>Reserva de sala para reunión...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-2 focus:outline-none min-h-[150px] border border-gray-300 rounded p-3 bg-white',
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Book {room.displayName}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Times */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Start</p>
              <p className="font-medium">{startTime?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">End</p>
              <p className="font-medium">{endTime?.toLocaleString()}</p>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
            <input
              {...register('title', { required: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="E.g. Team Weekly Sync"
            />
          </div>

          {/* Participants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Participants</label>
            <div className="relative">
              <Users className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                value={participantSearch}
                onChange={handleSearchParticipants}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Search by name or email..."
              />
              {participantResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 mt-1 rounded-md shadow-lg z-50">
                  {participantResults.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addParticipant(p)}
                      className="w-full text-left p-2 hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span>{p.displayName}</span>
                      <span className="text-xs text-gray-400">{p.mail}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedParticipants.map(p => (
                <span key={p.id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                  {p.displayName}
                  <button type="button" onClick={() => removeParticipant(p.id)} className="hover:text-blue-900"><X size={14} /></button>
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <EditorContent editor={editor} />
          </div>

          {/* Resources */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Resources</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {RESOURCES.map(res => (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => toggleResource(res.id)}
                  className={`flex items-center gap-2 p-3 border rounded-lg transition-all ${
                    selectedResources.includes(res.id)
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {res.icon}
                  <span className="text-sm font-medium">{res.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-gray-100 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send size={18} /> Send Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
