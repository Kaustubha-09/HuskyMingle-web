'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, X, Tag, MapPin, Clock, Eye, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

const CATEGORIES = ['All', 'Books', 'Electronics', 'Furniture', 'Clothing', 'Lab Supplies', 'Sports', 'Dorm Essentials', 'Free'];
const CONDITIONS = ['Any', 'NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'];
const CONDITION_LABELS: Record<string, string> = {
  NEW: 'New', LIKE_NEW: 'Like New', GOOD: 'Good', FAIR: 'Fair', POOR: 'Poor',
};
const CONDITION_COLORS: Record<string, string> = {
  NEW: 'bg-green-100 text-green-700',
  LIKE_NEW: 'bg-blue-100 text-blue-700',
  GOOD: 'bg-yellow-100 text-yellow-700',
  FAIR: 'bg-orange-100 text-orange-700',
  POOR: 'bg-red-100 text-red-700',
};

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  status: string;
  images: string[];
  tags: string[];
  viewCount: number;
  createdAt: string;
  seller: { id: string; profile: { name: string; avatar?: string; university?: string } };
}

function ListingCard({ listing, onClick }: { listing: Listing; onClick: () => void }) {
  const isFree = listing.price === 0;
  const isSold = listing.status === 'SOLD';
  return (
    <div onClick={onClick} className="bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
      <div className="relative h-44 bg-gray-50 flex items-center justify-center">
        {listing.images[0] ? (
          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <Tag size={36} />
            <span className="text-xs">{listing.category}</span>
          </div>
        )}
        {isSold && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-800 font-bold px-3 py-1 rounded-full text-sm">SOLD</span>
          </div>
        )}
        {!isSold && (
          <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full ${CONDITION_COLORS[listing.condition] ?? 'bg-gray-100 text-gray-600'}`}>
            {CONDITION_LABELS[listing.condition] ?? listing.condition}
          </span>
        )}
        {isFree && !isSold && (
          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">FREE</span>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-900 text-sm line-clamp-2 leading-snug">{listing.title}</p>
        <div className="flex items-center justify-between mt-2">
          <span className={`font-bold text-base ${isFree ? 'text-green-600' : 'text-[#8B0000]'}`}>
            {isFree ? 'Free' : `$${listing.price}`}
          </span>
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Eye size={11} /><span>{listing.viewCount}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-1 text-gray-400 text-xs">
          <Clock size={11} />
          <span>{formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}</span>
        </div>
      </div>
    </div>
  );
}

function ListingModal({ listing, currentUserId, onClose, onSold, onDelete }: {
  listing: Listing; currentUserId: string; onClose: () => void; onSold: () => void; onDelete: () => void;
}) {
  const isMine = listing.seller.id === currentUserId;
  const isFree = listing.price === 0;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="relative h-64 bg-gray-100 flex items-center justify-center rounded-t-2xl overflow-hidden">
          {listing.images[0] ? (
            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
          ) : <Tag size={48} className="text-gray-300" />}
          <button onClick={onClose} className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow"><X size={16} /></button>
          {listing.status === 'SOLD' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white font-bold px-4 py-2 rounded-full text-gray-800">SOLD</span>
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="font-bold text-xl text-gray-900 leading-tight">{listing.title}</h2>
            <span className={`font-bold text-xl whitespace-nowrap ${isFree ? 'text-green-600' : 'text-[#8B0000]'}`}>
              {isFree ? 'Free' : `$${listing.price}`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">{listing.category}</span>
            <span className={`text-xs px-2.5 py-1 rounded-full ${CONDITION_COLORS[listing.condition] ?? 'bg-gray-100 text-gray-600'}`}>
              {CONDITION_LABELS[listing.condition] ?? listing.condition}
            </span>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed mb-4">{listing.description}</p>
          {listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {listing.tags.map(t => (
                <span key={t} className="bg-[#8B0000]/10 text-[#8B0000] text-xs px-2 py-0.5 rounded-full">#{t}</span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
            <div className="w-9 h-9 rounded-full bg-[#8B0000] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {listing.seller.profile.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">{listing.seller.profile.name}</p>
              <p className="text-xs text-gray-500">{listing.seller.profile.university ?? 'Northeastern University'}</p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-gray-400 text-xs">
              <MapPin size={11} /><span>Boston, MA</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
            <Eye size={12} /><span>{listing.viewCount} views</span>
            <span>·</span>
            <Clock size={12} />
            <span>Listed {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}</span>
          </div>
          {isMine ? (
            <div className="flex gap-2">
              {listing.status === 'ACTIVE' && (
                <button onClick={onSold} className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors">
                  <CheckCircle size={16} /> Mark as Sold
                </button>
              )}
              <button onClick={onDelete} className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-100 transition-colors">
                Delete Listing
              </button>
            </div>
          ) : (
            <a href={`/messages?new=${listing.seller.id}`}
              className="flex items-center justify-center w-full bg-[#8B0000] text-white py-2.5 rounded-xl font-semibold hover:bg-[#6B0000] transition-colors">
              Message Seller
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateListingModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: any) => void }) {
  const [form, setForm] = useState({ title: '', description: '', price: '', category: 'Books', condition: 'GOOD', tags: '' });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ ...form, price: Number(form.price), tags: form.tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean) });
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-lg">Create Listing</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30"
              placeholder="e.g. MATH2321 Textbook" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Description *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} required rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30 resize-none"
              placeholder="Describe your item..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Price ($)</label>
              <input type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30"
                placeholder="0 = Free" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Condition</label>
              <select value={form.condition} onChange={e => set('condition', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30 bg-white">
                {['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'].map(c => <option key={c} value={c}>{CONDITION_LABELS[c]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter(c => c !== 'All').map(c => (
                <button key={c} type="button" onClick={() => set('category', c)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.category === c ? 'bg-[#8B0000] text-white border-[#8B0000]' : 'border-gray-200 text-gray-600 hover:border-[#8B0000]'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Tags (comma-separated)</label>
            <input value={form.tags} onChange={e => set('tags', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30"
              placeholder="math, textbook, cs3500" />
          </div>
          <button type="submit" className="w-full bg-[#8B0000] text-white py-2.5 rounded-xl font-semibold hover:bg-[#6B0000] transition-colors">
            Post Listing
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [condition, setCondition] = useState('Any');
  const [tab, setTab] = useState<'browse' | 'mine'>('browse');
  const [selected, setSelected] = useState<Listing | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: listings = [] } = useQuery<Listing[]>({
    queryKey: ['marketplace', search, category, condition, tab],
    queryFn: async () => {
      if (tab === 'mine') return (await api.get('/marketplace/mine')).data;
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (category !== 'All') params.category = category;
      if (condition !== 'Any') params.condition = condition;
      return (await api.get('/marketplace', { params })).data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/marketplace', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['marketplace'] }); setShowCreate(false); },
  });
  const soldMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/marketplace/${id}/sold`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['marketplace'] }); setSelected(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/marketplace/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['marketplace'] }); setSelected(null); },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campus Marketplace</h1>
          <p className="text-sm text-gray-500 mt-0.5">Buy &amp; sell within the Husky community</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-[#8B0000] text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-[#6B0000] transition-colors">
          <Plus size={16} /> List Item
        </button>
      </div>

      <div className="flex border-b border-gray-200 mb-4">
        {(['browse', 'mine'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-[#8B0000] text-[#8B0000]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'mine' ? 'My Listings' : 'Browse'}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <div className="space-y-3 mb-5">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search listings..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${category === c ? 'bg-[#8B0000] text-white border-[#8B0000]' : 'border-gray-200 text-gray-600 hover:border-[#8B0000]'}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CONDITIONS.map(c => (
              <button key={c} onClick={() => setCondition(c)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${condition === c ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                {c === 'Any' ? 'Any Condition' : CONDITION_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
      )}

      {listings.length === 0 ? (
        <div className="text-center py-20">
          <Tag size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{tab === 'mine' ? "You haven't listed anything yet" : 'No listings found'}</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 text-[#8B0000] font-semibold text-sm">
            + Post your first listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {listings.map(l => <ListingCard key={l.id} listing={l} onClick={() => setSelected(l)} />)}
        </div>
      )}

      {selected && (
        <ListingModal listing={selected} currentUserId={user?.id ?? ''} onClose={() => setSelected(null)}
          onSold={() => soldMutation.mutate(selected.id)} onDelete={() => deleteMutation.mutate(selected.id)} />
      )}
      {showCreate && (
        <CreateListingModal onClose={() => setShowCreate(false)} onCreate={data => createMutation.mutate(data)} />
      )}
    </div>
  );
}
