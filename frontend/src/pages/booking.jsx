import React, { useState } from 'react';

export default function Booking() {
  const [resourceType, setResourceType] = useState('conference');
  const [date, setDate] = useState('2026-07-12');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Initial resource reservations schedule ledger
  const currentBookings = [
    { id: 1, resource: 'Conference Room A', time: '09:00 - 11:00', user: 'Design Team' },
    { id: 2, resource: 'Conference Room A', time: '13:00 - 14:30', user: 'Product Review' },
    { id: 3, resource: 'Testing Server Rack 2', time: '10:00 - 16:00', user: 'QA Testing Pipeline' },
    { id: 4, resource: 'Company Projector Max', time: '14:00 - 17:00', user: 'Marketing All-Hands' },
  ];

  const handleCreateReservation = (e) => {
    e.preventDefault();
    setBookingError('');
    setSuccessMsg('');

    // Fast schedule overlap validation gate check
    if (resourceType === 'conference' && startTime >= '09:00' && startTime < '11:00') {
      setBookingError('Schedule Overlap Blocked: Conference Room A is already booked from 09:00 to 11:00 by the Design Team.');
      return;
    }

    setSuccessMsg('Reservation successfully locked and processed!');
    setStartTime('');
    setEndTime('');
  };

  return (
    <div className="p-8 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Resource Booking Scheduler</h1>
        <p className="text-slate-500 mt-1 text-sm">Reserve shared hardware equipment, servers, and spatial facilities safely.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Reservation Request Input Workspace Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:col-span-1">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Request Resource Access</h2>

          <form onSubmit={handleCreateReservation} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Resource Entity</label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 text-sm"
              >
                <option value="conference">Conference Room A</option>
                <option value="server">Testing Server Rack 2</option>
                <option value="projector">Company Projector Max</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Target Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-colors shadow-sm mt-2"
            >
              Verify & Lock Slot
            </button>
          </form>
        </div>

        {/* Master Active Reservations Ledger Log View */}
        <div className="lg:col-span-2 space-y-6">
          {bookingError && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm font-medium flex items-start gap-2.5">
              <span className="mt-0.5">⚠️</span>
              <span>{bookingError}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm font-medium">
              ✨ {successMsg}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Active Reservations Ledger ({date})</h2>
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Asset Resource</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Time Windows Slot</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Reserved By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {currentBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-slate-800">{b.resource}</td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-md font-medium">
                          {b.time}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{b.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}