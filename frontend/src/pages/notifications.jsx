import React, { useState } from 'react';

// Comprehensive mock dataset matching every case in your wireframe requirement
const INITIAL_NOTIFICATIONS = [
  { id: 1, type: 'assignment', text: 'Laptop AF-0014 assigned to Priya Shah', time: '2m ago', category: 'Bookings', unread: true },
  { id: 2, type: 'maintenance', text: 'Maintenance request AF-0055 approved by Manager', time: '18m ago', category: 'Approvals', unread: true },
  { id: 3, type: 'booking', text: 'Booking confirmed : Room B2 : 2:00 to 3:00 PM', time: '1h ago', category: 'Bookings', unread: false },
  { id: 4, type: 'transfer', text: 'Transfer approved : AF-0033 to Facilities Dept', time: '3h ago', category: 'Approvals', unread: false },
  { id: 5, type: 'alert', text: 'Overdue return : AF-0021 was due 3 days ago', time: '1d ago', category: 'Alerts', unread: false },
  { id: 6, type: 'audit', text: 'Audit discrepancy flagged : AF-0088 marked Damaged', time: '2d ago', category: 'Alerts', unread: false },
];

export default function ActivityNotificationsWorkspace() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState('All');

  // Interactive Live Simulator: Fires realistic operational notifications immediately into the stream
  const triggerSimulatedEvent = (type) => {
    let text = '';
    let category = 'Alerts';

    switch (type) {
      case 'overdue':
        text = '⚠️ Overdue return alert: iPad Array AF-0941 has exceeded its booking window by 24h.';
        category = 'Alerts';
        break;
      case 'approval':
        text = '✅ Transfer request approved: Core Router Node AF-5592 dispatched to Berlin office.';
        category = 'Approvals';
        break;
      case 'booking':
        text = '📅 Booking reminder: Studio Desk 04 reserved for Creative Team at 1:00 PM today.';
        category = 'Bookings';
        break;
      default:
        text = '⚙️ System log profile refreshed successfully.';
        category = 'All';
    }

    const newNotification = {
      id: Date.now(),
      type,
      text,
      time: 'Just now',
      category,
      unread: true,
    };

    setNotifications([newNotification, ...notifications]);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const clearNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // Filter Logic matching wireframe pills
  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'All') return true;
    return n.category === activeFilter;
  });

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="p-8 bg-[#F8F9FC] min-h-screen text-slate-800 font-sans">

      {/* Title Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Activity Logs & Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">Cross-role compliance logging feed capturing live changes, overrides, and security events.</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl transition-all self-start sm:self-center"
          >
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">

        {/* Left Interactive Simulation Console Box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 xl:col-span-1">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Event Stream Simulator</h3>
            <p className="text-xs text-slate-400 mt-0.5">Click an event type to test how background workflows automatically notify relevant personnel.</p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => triggerSimulatedEvent('overdue')}
              className="w-full text-left p-2.5 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all"
            >
              🚨 Fire Overdue Return Alert
            </button>
            <button
              onClick={() => triggerSimulatedEvent('approval')}
              className="w-full text-left p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 text-xs font-bold transition-all"
            >
              🔒 Fire Manager Approval Event
            </button>
            <button
              onClick={() => triggerSimulatedEvent('booking')}
              className="w-full text-left p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-bold transition-all"
            >
              📅 Fire Resource Booking Alert
            </button>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-400 leading-normal">
            <strong>System Rule:</strong> Every user action leaves an un-alterable, cryptographically stamped cryptographic block in the master audit log database ledger.
          </div>
        </div>

        {/* Right Dynamic Log Window Container */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Wireframe Filtration Pill Bar */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-2">
            {['All', 'Alerts', 'Approvals', 'Bookings'].map(filter => {
              const count = filter === 'All' ? notifications.length : notifications.filter(n => n.category === filter).length;
              const isSelected = activeFilter === filter;

              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <span>{filter}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'
                    }`}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* List Feed Area */}
          <div className="divide-y divide-slate-100">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => {
                // Style configurations based on the notification event profile type
                let indicatorColor = 'bg-slate-400';
                if (notif.category === 'Alerts' || notif.type === 'overdue') indicatorColor = 'bg-rose-500';
                if (notif.category === 'Approvals') indicatorColor = 'bg-emerald-500';
                if (notif.category === 'Bookings') indicatorColor = 'bg-indigo-500';

                return (
                  <div
                    key={notif.id}
                    className={`p-4 flex items-start gap-4 transition-colors hover:bg-slate-50/50 group ${notif.unread ? 'bg-indigo-50/20' : ''
                      }`}
                  >
                    {/* Visual Type Indicator Node dot matching wireframe alignment layout structure */}
                    <div className="mt-1.5 shrink-0 relative">
                      <span className={`w-2.5 h-2.5 rounded-full block border-2 border-white ring-1 ring-slate-200 ${indicatorColor}`} />
                      {notif.unread && (
                        <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                      )}
                    </div>

                    {/* Notification Text content payload block */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs text-slate-700 leading-normal ${notif.unread ? 'font-bold text-slate-900' : 'font-medium'}`}>
                        {notif.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-slate-400">{notif.time}</span>
                        <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">
                          {notif.category}
                        </span>
                      </div>
                    </div>

                    {/* Individual Row Action Delete Control Button */}
                    <button
                      onClick={() => clearNotification(notif.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-600 rounded transition-all text-sm font-bold"
                      title="Dismiss Log Entry"
                    >
                      ×
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs font-medium space-y-1">
                <p>✨ Stream is clean.</p>
                <p className="text-[11px] text-slate-400 font-normal">No notifications found inside the filtered workspace index.</p>
              </div>
            )}
          </div>

          {/* Footer Metadata Status Summary strip */}
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
            <span>System Node Status: Operational</span>
            <span>Logs Synced: Local Memory Mirror</span>
          </div>

        </div>

      </div>

    </div>
  );
}