import React, { useState, useEffect } from 'react';
import { Search, User, Building2 } from 'lucide-react';
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
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewType('rooms')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded ${
            viewType === 'rooms' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Building2 size={18} /> Rooms
        </button>
        <button
          onClick={() => setViewType('users')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded ${
            viewType === 'users' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <User size={18} /> Users
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder={viewType === 'rooms' ? 'Search rooms...' : 'Search users...'}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="max-h-60 overflow-y-auto space-y-2">
        {loading && <p className="text-center text-gray-500 py-2">Loading...</p>}
        {results.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className={`w-full text-left p-3 rounded-md transition-colors ${
              selectedId === item.id ? 'bg-blue-50 border-blue-300 border' : 'hover:bg-gray-50 border-transparent border'
            }`}
          >
            <p className="font-medium text-gray-800">{item.displayName}</p>
            {item.mail && <p className="text-sm text-gray-500">{item.mail}</p>}
          </button>
        ))}
        {!loading && results.length === 0 && (
          <p className="text-center text-gray-500 py-2">No results found</p>
        )}
      </div>
    </div>
  );
};
