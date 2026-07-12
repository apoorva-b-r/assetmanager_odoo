import { useEffect, useState, useMemo } from "react";
import { apiClient } from "../lib/api-client";
import { useAuth } from "../context/AuthContext";

function toIso(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 to 20:00

export default function BookingPage() {
  const { user, isAdmin } = useAuth();
  const [assets, setAssets] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [viewMode, setViewMode] = useState("week"); // 'week' or 'day'
  
  // Form states
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [bookedById, setBookedById] = useState("");
  const [employees, setEmployees] = useState([]);
  
  // App state
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [message, setMessage] = useState("");
  const [conflict, setConflict] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedResourceId) {
      loadBookings(selectedResourceId);
    }
  }, [selectedResourceId]);

  async function loadData() {
    setLoading(true);
    try {
      const assetData = await apiClient.get("/assets");
      const bookableAssets = assetData.filter((asset) => asset.isBookable);
      setAssets(bookableAssets);

      if (bookableAssets.length > 0) {
        setSelectedResourceId(bookableAssets[0].id);
      }

      if (isAdmin) {
        const empData = await apiClient.get("/employees").catch(() => []);
        setEmployees(empData);
        if (empData.length > 0) {
          setBookedById(empData[0].id);
        }
      } else {
        setBookedById(user?.id || "");
      }
    } catch (error) {
      setMessage(error.message || "Failed to load bookable resources.");
    } finally {
      setLoading(false);
    }
  }

  async function loadBookings(resourceAssetId) {
    try {
      // Load all bookings for the resource to display on the calendar
      const data = await apiClient.get(`/bookings?resourceAssetId=${resourceAssetId}`);
      setBookings(data.items || data || []);
    } catch (error) {
      setMessage(error.message || "Failed to load bookings.");
    }
  }

  async function handleBook(event) {
    event.preventDefault();
    setMessage("");
    setConflict(null);

    try {
      await apiClient.post("/bookings", {
        resourceAssetId: selectedResourceId,
        startTime: toIso(selectedDate, startTime),
        endTime: toIso(selectedDate, endTime),
        bookedById: isAdmin && bookedById ? bookedById : user?.id,
      });
      await loadBookings(selectedResourceId);
      setMessage("Resource booked successfully.");
    } catch (error) {
      if (error.code === "BOOKING_CONFLICT") {
        setConflict(error.data?.currentBooking || null);
      }
      setMessage(error.message || "Failed to create booking.");
    }
  }

  async function handleCancel(id) {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setMessage("");
    try {
      await apiClient.put(`/bookings/${id}/cancel`);
      setSelectedBooking(null);
      await loadBookings(selectedResourceId);
      setMessage("Booking cancelled successfully.");
    } catch (error) {
      setMessage(error.message || "Failed to cancel booking.");
    }
  }

  async function handleReschedule(id) {
    const newStart = prompt("Enter new start time (HH:MM):", startTime);
    if (!newStart) return;
    const newEnd = prompt("Enter new end time (HH:MM):", endTime);
    if (!newEnd) return;

    setMessage("");
    try {
      await apiClient.put(`/bookings/${id}/reschedule`, {
        startTime: toIso(selectedDate, newStart),
        endTime: toIso(selectedDate, newEnd),
      });
      setSelectedBooking(null);
      await loadBookings(selectedResourceId);
      setMessage("Booking rescheduled successfully.");
    } catch (error) {
      setMessage(error.message || "Failed to reschedule booking.");
    }
  }

  // Get start of the week for the selected date
  const startOfWeek = useMemo(() => {
    const current = new Date(selectedDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(current.setDate(diff));
  }, [selectedDate]);

  // Generate list of 7 days in the selected week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
  }, [startOfWeek]);

  // Helpers to navigate dates
  function navigateDays(amount) {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + amount);
    setSelectedDate(current.toISOString().slice(0, 10));
  }

  function navigateWeeks(amount) {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + amount * 7);
    setSelectedDate(current.toISOString().slice(0, 10));
  }

  // Map bookings to day/week view
  const activeViewBookings = useMemo(() => {
    return bookings.map((booking) => {
      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);
      
      // Calculate top and height relative to 08:00
      const startHours = start.getHours();
      const startMinutes = start.getMinutes();
      const endHours = end.getHours();
      const endMinutes = end.getMinutes();

      const top = Math.max(0, (startHours - 8) * 60 + startMinutes);
      const height = Math.max(30, (endHours - startHours) * 60 + (endMinutes - startMinutes));

      // Determine booking status
      const now = new Date();
      let derivedStatus = booking.status;
      if (booking.status !== "CANCELLED") {
        if (now < start) {
          derivedStatus = "UPCOMING";
        } else if (now > end) {
          derivedStatus = "COMPLETED";
        } else {
          derivedStatus = "ONGOING";
        }
      }

      return {
        ...booking,
        start,
        end,
        top,
        height,
        derivedStatus,
        dateKey: start.toISOString().slice(0, 10),
      };
    });
  }, [bookings]);

  // Grid click handler to pre-fill time
  function handleGridClick(date, hour) {
    setSelectedDate(date.toISOString().slice(0, 10));
    const startStr = `${String(hour).padStart(2, "0")}:00`;
    const endStr = `${String(hour + 1).padStart(2, "0")}:00`;
    setStartTime(startStr);
    setEndTime(endStr);
  }

  if (loading) {
    return <div className="p-8 text-slate-500">Loading booking telemetry...</div>;
  }

  const selectedAsset = assets.find((a) => String(a.id) === String(selectedResourceId));

  return (
    <div className="p-8 min-h-screen">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Resource Booking</h1>
          <p className="mt-1 text-sm text-slate-500">Minute-precision overlap protected schedule calendar.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedResourceId}
            onChange={(e) => setSelectedResourceId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold"
          >
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.tag} - {asset.name}
              </option>
            ))}
          </select>

          <div className="rounded-xl border border-slate-200 bg-white p-1 flex gap-1 text-xs font-medium">
            <button
              onClick={() => setViewMode("day")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${viewMode === "day" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${viewMode === "week" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      {conflict && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-bounce">
          Conflict: Slots overlap with active reservation of {conflict.bookedBy?.name} ({new Date(conflict.startTime).toLocaleTimeString()} - {new Date(conflict.endTime).toLocaleTimeString()}).
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Calendar Grid Section */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm overflow-x-auto">
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => (viewMode === "week" ? navigateWeeks(-1) : navigateDays(-1))}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
              >
                &larr; Prev
              </button>
              <button
                onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
              >
                Today
              </button>
              <button
                onClick={() => (viewMode === "week" ? navigateWeeks(1) : navigateDays(1))}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
              >
                Next &rarr;
              </button>
            </div>
            <h2 className="text-sm font-bold text-slate-800">
              {viewMode === "week"
                ? `${weekDays[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${weekDays[6].toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
                : new Date(selectedDate).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </h2>
          </div>

          {/* Time-Grid Layout */}
          <div className="relative border border-slate-100 rounded-xl" style={{ minWidth: viewMode === "week" ? "680px" : "320px" }}>
            {/* Grid Header */}
            <div className="grid grid-cols-[60px_1fr] bg-slate-50 border-b border-slate-100">
              <div className="p-3 text-[10px] uppercase font-bold text-slate-400 border-r border-slate-100 text-center">Time</div>
              <div className={`grid ${viewMode === "week" ? "grid-cols-7" : "grid-cols-1"}`}>
                {(viewMode === "week" ? weekDays : [new Date(selectedDate)]).map((day) => (
                  <div key={day.toISOString()} className="p-3 text-center border-r border-slate-100 last:border-r-0">
                    <p className="text-xs font-bold text-slate-700">
                      {day.toLocaleDateString(undefined, { weekday: "short" })}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{day.getDate()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid Body */}
            <div className="relative grid grid-cols-[60px_1fr]" style={{ height: "720px" }}>
              {/* Hour Lines Labels */}
              <div className="relative border-r border-slate-100 bg-slate-50/50">
                {HOURS.slice(0, -1).map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full text-right pr-2 text-[10px] font-medium text-slate-400"
                    style={{ top: `${(hour - 8) * 60}px`, height: "60px", lineHeight: "1.5" }}
                  >
                    {String(hour).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              <div className={`relative grid ${viewMode === "week" ? "grid-cols-7" : "grid-cols-1"}`}>
                {/* Horizontal Guide Lines */}
                {HOURS.slice(0, -1).map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-slate-100/70 pointer-events-none"
                    style={{ top: `${(hour - 8) * 60}px` }}
                  />
                ))}

                {/* Render Grid Slots for Selection */}
                {(viewMode === "week" ? weekDays : [new Date(selectedDate)]).map((day, colIdx) => (
                  <div
                    key={day.toISOString()}
                    className="relative h-full border-r border-slate-100/50 last:border-r-0"
                  >
                    {HOURS.slice(0, -1).map((hour) => (
                      <div
                        key={hour}
                        onClick={() => handleGridClick(day, hour)}
                        className="absolute w-full hover:bg-blue-50/20 cursor-crosshair transition-colors"
                        style={{ top: `${(hour - 8) * 60}px`, height: "60px" }}
                      />
                    ))}

                    {/* Plot Floating Booking Blocks */}
                    {activeViewBookings
                      .filter((b) => b.dateKey === day.toISOString().slice(0, 10))
                      .map((booking) => {
                        let colorClass = "bg-slate-100 text-slate-700 border-slate-300";
                        if (booking.derivedStatus === "UPCOMING") colorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
                        if (booking.derivedStatus === "ONGOING") colorClass = "bg-blue-50 text-blue-900 border-blue-200";
                        if (booking.derivedStatus === "COMPLETED") colorClass = "bg-slate-100 text-slate-500 border-slate-200 line-through opacity-70";
                        if (booking.derivedStatus === "CANCELLED") colorClass = "bg-red-50 text-red-500 border-red-200 line-through opacity-50";

                        return (
                          <div
                            key={booking.id}
                            onClick={() => setSelectedBooking(booking)}
                            className={`absolute left-1 right-1 p-2 rounded-xl border text-[10px] font-bold shadow-sm cursor-pointer overflow-hidden transition-transform hover:scale-[1.02] ${colorClass}`}
                            style={{ top: `${booking.top}px`, height: `${booking.height}px` }}
                          >
                            <p className="truncate">
                              {booking.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {booking.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                            <p className="font-semibold truncate mt-0.5">{booking.bookedBy?.name}</p>
                            <span className="text-[8px] font-medium opacity-85">{booking.derivedStatus}</span>
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Creation Form & Detail Drawer */}
        <div className="space-y-6">
          {/* Create Booking */}
          <form onSubmit={handleBook} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Create Booking</h2>
              <p className="text-xs text-slate-500">Select slot in grid to auto-fill times.</p>
            </div>

            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                required
              />
            </label>

            <div className="grid gap-2 grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Start Time</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                  required
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">End Time</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                  required
                />
              </label>
            </div>

            {isAdmin && employees.length > 0 && (
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Booked For Employee</span>
                <select
                  value={bookedById}
                  onChange={(e) => setBookedById(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Book Resource
            </button>
          </form>

          {/* Detailed View Modal Box */}
          {selectedBooking && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-sm">Reservation Info</h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Dismiss
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium uppercase tracking-wide">Resource</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {selectedBooking.resourceAsset?.tag} - {selectedBooking.resourceAsset?.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium uppercase tracking-wide">Schedule Slot</span>
                  <span className="font-semibold text-slate-800">
                    {selectedBooking.start.toLocaleDateString()} · {selectedBooking.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {selectedBooking.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium uppercase tracking-wide">Reserved By</span>
                  <span className="font-semibold text-slate-800">{selectedBooking.bookedBy?.name} ({selectedBooking.bookedBy?.email})</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium uppercase tracking-wide">Reservation Status</span>
                  <span className={`font-bold ${selectedBooking.derivedStatus === "CANCELLED" ? "text-red-600" : "text-blue-600"}`}>
                    {selectedBooking.derivedStatus}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedBooking.derivedStatus !== "CANCELLED" && 
               (isAdmin || String(selectedBooking.bookedById) === String(user?.id)) && (
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => handleCancel(selectedBooking.id)}
                    className="flex-1 rounded-xl border border-red-200 text-red-700 bg-red-50/50 hover:bg-red-50 px-4 py-2.5 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReschedule(selectedBooking.id)}
                    className="flex-1 rounded-xl bg-slate-900 text-white hover:bg-slate-800 px-4 py-2.5 text-xs font-semibold transition-colors"
                  >
                    Reschedule
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
