import React, { useState } from 'react';

export default function Assets() {
  const [search, setSearch] = useState('');
  const assets = [
    { id: 'E409', name: 'MacBook Pro M3', category: 'Hardware', status: 'Allocated', location: 'Floor 3 - Desk 12' },
    { id: 'E291', name: 'iPad Pro 12.9', category: 'Hardware', status: 'Available', location: 'IT Storage Box B' },
    { id: 'M981', name: 'Dell UltraSharp 32', category: 'Peripherals', status: 'Available', location: 'Floor 2 - Tech Lab' },
    { id: 'S104', name: 'Testing Server Rack 2', category: 'Infrastructure', status: 'Reserved', location: 'Server Room A' },
  ];

  const filtered = assets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.id.includes(search));

  return (
    <div className="p-8 min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Assets Catalog</h1>
          <p className="text-slate-500 mt-1 text-sm">Centralized register for company equipment track logs.</p>
        </div>
        <input
          type="text"
          placeholder="Search by name or serial..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm w-72 focus:outline-none focus:border-indigo-500 shadow-sm"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Asset Tag</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Location Placement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {filtered.map(asset => (
              <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-semibold">#{asset.id}</td>
                <td className="px-6 py-4 font-semibold text-slate-800">{asset.name}</td>
                <td className="px-6 py-4 text-slate-500">{asset.category}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${asset.status === 'Available' ? 'bg-emerald-50 text-emerald-700' :
                      asset.status === 'Allocated' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                    {asset.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">{asset.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}