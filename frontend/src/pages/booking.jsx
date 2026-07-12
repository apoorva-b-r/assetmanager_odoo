import React, { useState } from 'react';

const INITIAL_BOOKINGS = [
  {
    id: 1,
    resourceId: 'B2',
    date: '2026-07-07',
    startTime: '09:00',
    endTime: '10:00',
    team: 'Procurement Team',
    status: 'Completed'
  },
  {
    id: 2,
    resourceId: 'B2',
    date: '2026-07-12',
    startTime: '14:00',
    endTime: '15:30',
    team: 'Engineering Sync',
    status: 'Upcoming'
  },
  {
    id: 3,
    resourceId: 'Studio-A',
    date: '2026-07-12',
    startTime: '11:00',
    endTime: '13:00',
    team: 'UX Review',
    status: 'Ongoing'
  }
];

const RESOURCES = [
  { id: 'B2', name: 'Conference Room B2' },
  { id: 'Studio-A', name: 'Design Studio A' },
  { id: 'Lab-1', name: 'R&D Hardware Lab' }
];

const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export default function ResourceBooking() {
  const [viewMode, setViewMode] = useState('Day'); // 'Day' | 'Week' | 'Month'
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [selectedResource, setSelectedResource] = useState('B2');
  const [selectedDate, setSelectedDate] = useState('2026-07-07');

  // Booking Form Fields
  const [bookingTeam, setBookingTeam] = useState('');
  const [bookingStartTime, setBookingStartTime] = useState('09:30');
  const [bookingEndTime, setBookingEndTime] = useState('10:30');
  const [errorMessage, setErrorMessage] = useState('');
  const [notification, setNotification] = useState('');

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const checkOverlap = (resourceId, date, startStr, endStr) => {
    const newStart = timeToMinutes(startStr);
    const newEnd = timeToMinutes(endStr);

    if (newEnd <= newStart) return { conflict: true, reason: 'End time must be after start time.' };

    const conflict = bookings.find(b =>
      b.resourceId === resourceId &&
      b.date === date &&
      b.status !== 'Cancelled' &&
      newStart < timeToMinutes(b.endTime) &&
      newEnd > timeToMinutes(b.startTime)
    );

    if (conflict) {
      return { conflict: true, reason: `Overlaps with "${conflict.team}" (${conflict.startTime} - ${conflict.endTime})` };
    }
    return { conflict: false };
  };

  const handleCreateBooking = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setNotification('');

    const validation = checkOverlap(selectedResource, selectedDate, bookingStartTime, bookingEndTime);
    if (validation.conflict) {
      setErrorMessage(validation.reason);
      return;
    }

    const newBooking = {
      id: Date.now(),
      resourceId: selectedResource,
      date: selectedDate,
      startTime: bookingStartTime,
      endTime: bookingEndTime,
      team: bookingTeam || 'Quick Booking',
      status: 'Upcoming'
    };

    setBookings([...bookings, newBooking]);
    setNotification('🎉 Slot successfully reserved on the calendar!');
    setBookingTeam('');
  };

  // Helper to calculate exact absolute position inside the calendar column stack
  const getPositionStyles = (startTime, endTime) => {
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    const calendarStart = timeToMinutes('08:00');

    // Each 1-hour row is exactly 64px tall (h-16)
    const top = ((startMin - calendarStart) / 60) * 64;
    const height = ((endMin - startMin) / 60) * 64;

    return { top: `${top}px`, height: `${height}px` };
  };

  const activeBookings = bookings.filter(b => b.resourceId === selectedResource && b.date === selectedDate && b.status !== 'Cancelled');

  return (
    <div className="p-8 bg-[#F8F9FC] min-h-screen text-slate-800">

      {/* View Header with Mode Toggles */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Resource Calendar</h1>
          <p className="text-sm text-slate-500 mt-1">Interactive timeline board for tracking asset scheduling layouts.</p>
        </div>

        {/* Calendar Mode Tabs */}
        <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
          {['Day', 'Week', 'Month'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === mode ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {mode} View
            </button>
          ))}
        </div>
      </div>

      {notification && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium">
          {notification}
        </div>
      )}

      {/* Main Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Interactive Calendar Core Viewport */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Calendar Controller Header Toolbar Row */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <select
                value={selectedResource}
                onChange={(e) => setSelectedResource(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none"
              >
                {RESOURCES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none"
            />
          </div>

          {viewMode === 'Day' ? (
            /* ================= DAY CALENDAR COLUMN FLOW ================= */
            <div className="p-6 overflow-y-auto max-h-[600px]">
              <div className="relative grid grid-cols-1 select-none" style={{ height: `${HOURS.length * 64}px` }}>

                {/* Visual Horizontal Grid Hour Dividers */}
                {HOURS.map((hour, idx) => (
                  <div key={hour} className="absolute left-0 right-0 border-t border-slate-100 flex items-start pt-1 text-xs font-mono font-bold text-slate-400" style={{ top: `${idx * 64}px`, height: '64px' }}>
                    <span className="w-12 text-right pr-3">{hour}</span>
                    <div className="flex-1 h-full hover:bg-slate-50/50 cursor-pointer transition-colors" onClick={() => setBookingStartTime(hour)} />
                  </div>
                ))}

                {/* Absolutely Positioned Dynamic Booking Cards Overlay */}
                {activeBookings.map(b => {
                  const style = getPositionStyles(b.startTime, b.endTime);
                  return (
                    <div
                      key={b.id}
                      className="absolute left-16 right-4 p-3 bg-indigo-600 border border-indigo-700 text-white rounded-xl shadow-sm overflow-hidden flex flex-col justify-between group transition-all hover:scale-[1.01]"
                      style={style}
                    >
                      <div>
                        <p className="text-xs font-bold tracking-wide truncate">{b.team}</p>
                        <p className="text-[10px] text-indigo-200 font-medium mt-0.5">{b.startTime} - {b.endTime}</p>
                      </div>
                      <span className="absolute right-2 bottom-2 text-[9px] font-bold uppercase tracking-wider bg-indigo-700/50 px-1.5 py-0.5 rounded text-indigo-100">
                        {b.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Mock Layout Mode for Week / Month Placeholder view screens */
            <div className="p-12 text-center text-slate-400 italic">
              📅 {viewMode} View grid visualization matrix matches Day view structure across additional sequential columns. Switch back to Day View to interact with the full live allocation engine.
            </div>
          )}
        </div>

        {/* Create Booking Side Sidebar Card Deck */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Schedule Asset</h2>
            <p className="text-xs text-slate-400 mt-0.5">Fill details below. Overlap rules prevent duplicate entries natively.</p>
          </div>

          <form onSubmit={handleCreateBooking} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Reserving Team</label>
              <input
                type="text"
                value={bookingTeam}
                onChange={(e) => setBookingTeam(e.target.value)}
                placeholder="e.g., Procurement Team"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Start Time</label>
                <input
                  type="time"
                  value={bookingStartTime}
                  onChange={(e) => { setBookingStartTime(e.target.value); setErrorMessage(''); }}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">End Time</label>
                <input
                  type="time"
                  value={bookingEndTime}
                  onChange={(e) => { setBookingEndTime(e.target.value); setErrorMessage(''); }}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
                <p className="font-bold">⚠️ Slot Allocation Rejected:</p>
                <p className="text-rose-600 font-normal mt-0.5">{errorMessage}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              Commit to Calendar
            </button>
          </form>

          <hr className="border-slate-100" />

          <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-500 space-y-1">
            <span className="font-bold block text-slate-700">💡 Calendar Interaction Tips:</span>
            <p>• Clicking an hour divider line updates the start time field inside the checkout column.</p>
            <p>• Changing the date top-bar instantly updates the layered timeline layout.</p>
          </div>
        </div>

      </div>
    </div>
  );
}