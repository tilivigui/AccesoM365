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
        // Use emailAddress as primary ID if available, as it is most reliable for the Graph /users/ endpoint
        id: r.emailAddress || r.id,
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
      <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100/50 shadow-inner">
        <button
          onClick={() => setViewType('rooms')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] rounded-lg transition-all ${
            viewType === 'rooms' ? 'bg-white text-[#235b73] shadow-sm border border-slate-100' : 'text-slate-400 hover:text-[#235b73]'
          }`}
        >
          <Building2 size={12} /> Salas
        </button>
        <button
          onClick={() => setViewType('users')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] rounded-lg transition-all ${
            viewType === 'users' ? 'bg-white text-[#235b73] shadow-sm border border-slate-100' : 'text-slate-400 hover:text-[#235b73]'
          }`}
        >
          <User size={12} /> Usuarios
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder={viewType === 'rooms' ? 'Buscar salas...' : 'Usuario...'}
          className="w-full pl-8 pr-3 py-2 bg-white border border-slate-100 rounded-lg focus:ring-2 focus:ring-[#00adef]/10 focus:border-[#00adef]/40 outline-none text-[10px] font-bold placeholder:text-slate-300 transition-all"
        />
      </div>

      <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 opacity-20">
             <div className="w-4 h-4 border-2 border-[#235b73] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!loading && results.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className={`w-full text-left p-2.5 rounded-xl transition-all group flex items-center gap-3 border ${
              selectedId === item.id
              ? 'bg-[#235b73] border-[#235b73] shadow-lg shadow-[#235b73]/10 scale-[1.01]'
              : 'bg-white border-transparent hover:border-slate-100 hover:bg-slate-50/50'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-all ${
              selectedId === item.id ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-300 group-hover:text-[#235b73] group-hover:bg-white'
            }`}>
              {item.type === 'room' ? <Building2 size={14} /> : <User size={14} />}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className={`text-[10px] font-black truncate tracking-tight ${selectedId === item.id ? 'text-white' : 'text-slate-700'}`}>
                {item.displayName}
              </p>
              {item.mail && (
                <p className={`text-[8px] font-bold truncate opacity-50 ${selectedId === item.id ? 'text-white' : 'text-slate-400'}`}>
                  {item.mail}
                </p>
              )}
            </div>
            {selectedId === item.id && <CheckCircle2 size={12} className="text-[#00adef] shrink-0" />}
          </button>
        ))}

        {!loading && results.length === 0 && (
          <div className="text-center py-16 opacity-10">
            <Search size={32} className="mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sin resultados</p>
          </div>
        )}
      </div>
    </div>
  );
};
