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
    <div className="space-y-6">
      <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 ring-1 ring-slate-50 shadow-inner">
        <button
          onClick={() => setViewType('rooms')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all ${
            viewType === 'rooms' ? 'bg-[#235b73] text-white shadow-xl shadow-[#235b73]/20' : 'text-slate-400 hover:text-[#235b73]'
          }`}
        >
          <Building2 size={14} /> Salas
        </button>
        <button
          onClick={() => setViewType('users')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all ${
            viewType === 'users' ? 'bg-[#235b73] text-white shadow-xl shadow-[#235b73]/20' : 'text-slate-400 hover:text-[#235b73]'
          }`}
        >
          <User size={14} /> Usuarios
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder={viewType === 'rooms' ? 'Buscar salas...' : 'Nombre de usuario...'}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#00adef]/10 focus:border-[#00adef] outline-none text-xs font-bold placeholder:text-slate-300 transition-all shadow-sm"
        />
      </div>

      <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 opacity-30">
             <div className="w-6 h-6 border-2 border-[#235b73] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!loading && results.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className={`w-full text-left p-4 rounded-2xl transition-all group flex items-center gap-4 border shadow-sm ${
              selectedId === item.id
              ? 'bg-[#00adef] border-[#009bd6] shadow-xl shadow-[#00adef]/20 ring-4 ring-[#00adef]/10 scale-[1.02]'
              : 'bg-white border-slate-50 hover:border-cyan-100 hover:bg-cyan-50/20'
            }`}
          >
            <div className={`p-2.5 rounded-xl transition-all ${
              selectedId === item.id ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-300 group-hover:text-[#235b73] group-hover:bg-white shadow-inner'
            }`}>
              {item.type === 'room' ? <Building2 size={18} /> : <User size={18} />}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className={`text-xs font-black truncate tracking-tight ${selectedId === item.id ? 'text-white' : 'text-slate-800'}`}>
                {item.displayName}
              </p>
              {item.mail && (
                <p className={`text-[10px] font-bold truncate opacity-60 ${selectedId === item.id ? 'text-white' : 'text-slate-400'}`}>
                  {item.mail}
                </p>
              )}
            </div>
            {selectedId === item.id && <CheckCircle2 size={16} className="text-white shrink-0" />}
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
