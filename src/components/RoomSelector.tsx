import React, { useState, useEffect } from 'react';
import { Search, User, Building2, CheckCircle2 } from 'lucide-react';
import { listRooms, searchUsers } from '../services/graphService';

interface SelectionItem {
  id: string;
  displayName: string;
  mail?: string;
  type: 'user' | 'room';
}

interface RoomSelectorProps {
  onSelect: (item: SelectionItem) => void;
  selectedId?: string;
}

export const RoomSelector: React.FC<RoomSelectorProps> = ({ onSelect, selectedId }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SelectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState<'users' | 'rooms'>('rooms');

  useEffect(() => {
    if (viewType === 'rooms') {
      fetchRooms();
    }
  }, [viewType]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const rooms = await listRooms();
      setResults(rooms.map((r: any) => ({
        id: r.id || r.emailAddress,
        displayName: r.displayName,
        mail: r.emailAddress,
        type: 'room'
      })));
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (viewType === 'users' && val.length > 2) {
      setLoading(true);
      try {
        const users = await searchUsers(val);
        setResults(users.map((u: any) => ({
          id: u.id,
          displayName: u.displayName,
          mail: u.mail,
          type: 'user'
        })));
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
        <button
          onClick={() => setViewType('rooms')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
            viewType === 'rooms' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 size={14} /> Rooms
        </button>
        <button
          onClick={() => setViewType('users')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
            viewType === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <User size={14} /> Users
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder={viewType === 'rooms' ? 'Quick search...' : 'Search by name...'}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs font-semibold placeholder:text-slate-400 transition-all"
        />
      </div>

      <div className="max-h-[320px] overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 opacity-40">
             <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!loading && results.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className={`w-full text-left p-3 rounded-xl transition-all group flex items-center gap-3 border ${
              selectedId === item.id
              ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-200'
              : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className={`p-2 rounded-lg transition-all ${
              selectedId === item.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50'
            }`}>
              {item.type === 'room' ? <Building2 size={16} /> : <User size={16} />}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className={`text-xs font-black truncate ${selectedId === item.id ? 'text-white' : 'text-slate-700'}`}>
                {item.displayName}
              </p>
              {item.mail && (
                <p className={`text-[10px] font-medium truncate ${selectedId === item.id ? 'text-blue-100' : 'text-slate-400'}`}>
                  {item.mail}
                </p>
              )}
            </div>
            {selectedId === item.id && <CheckCircle2 size={14} className="text-white shrink-0" />}
          </button>
        ))}

        {!loading && results.length === 0 && (
          <div className="text-center py-10 opacity-30">
            <Search size={24} className="mx-auto mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest">No entries found</p>
          </div>
        )}
      </div>
    </div>
  );
};
