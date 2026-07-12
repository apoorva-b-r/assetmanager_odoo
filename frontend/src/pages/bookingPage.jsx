import { useEffect, useState } from "react";
import { apiClient } from "../lib/api-client";
import { useAuth } from "../context/AuthContext";

function toIso(date, time) {
  return new Date(`${date}T${time}:00`).toISOString();
}

export default function BookingPage() {
  const { user, isAdmin } = useAuth();
  const [assets, setAssets] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [bookedById, setBookedById] = useState("");
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");
  const [conflict, setConflict] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedResourceId) {
      loadBookings(selectedResourceId, selectedDate);
    }
  }, [selectedResourceId, selectedDate]);

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
        const employees = await apiClient.get("/employees").catch(() => []);
        if (employees.length > 0) {
          setBookedById(employees[0].id);
        }
      } else {
        setBookedById(user?.id || "");
      }
    } catch (error) {
      setMessage(error.message || "Failed to load booking data.");
    } finally {
      setLoading(false);
    }
  }

  async function loadBookings(resourceAssetId, date) {
    try {
      const data = await apiClient.get(`/bookings?resourceAssetId=${resourceAssetId}&date=${date}`);
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
        ...(isAdmin && bookedById ? { bookedById } : {}),
      });
      await loadBookings(selectedResourceId, selectedDate);
    } catch (error) {
      if (error.code === "BOOKING_CONFLICT") {
        setConflict(error.data?.currentBooking || null);
      }
      setMessage(error.message || "Failed to create booking.");
    }
  }

  async function handleCancel(id) {
    try {
      await apiClient.put(`/bookings/${id}/cancel`);
      await loadBookings(selectedResourceId, selectedDate);
    } catch (error) {
      setMessage(error.message || "Failed to cancel booking.");
    }
  }

  async function handleReschedule(id) {
    try {
      await apiClient.put(`/bookings/${id}/reschedule`, {
        startTime: toIso(selectedDate, startTime),
        endTime: toIso(selectedDate, endTime),
      });
      await loadBookings(selectedResourceId, selectedDate);
    } catch (error) {
      setMessage(error.message || "Failed to reschedule booking.");
    }
  }

  return (
    <div className="p-8 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Resource Booking</h1>
        <p className="mt-1 text-sm text-slate-500">Live booking calendar connected to the backend overlap checks.</p>
      </div>

      {message && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      )}

      {conflict && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Slot conflict with {conflict.bookedBy?.name || conflict.id} from {new Date(conflict.startTime).toLocaleTimeString()} to{" "}
          {new Date(conflict.endTime).toLocaleTimeString()}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Bookings</h2>
              <p className="text-sm text-slate-500">Select a resource and date to inspect availability.</p>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedResourceId}
                onChange={(event) => setSelectedResourceId(event.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              >
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.tag} - {asset.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            {bookings.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing here yet.</p>
            ) : (
              bookings.map((booking) => {
                const canManageBooking = isAdmin || String(booking.bookedById) === String(user?.id);

                return (
                  <div key={booking.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {new Date(booking.startTime).toLocaleTimeString()} - {new Date(booking.endTime).toLocaleTimeString()}
                        </p>
                        <p className="text-sm text-slate-500">
                          {booking.bookedBy?.name || "Unknown"} - {booking.status}
                        </p>
                      </div>
                      {canManageBooking && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleCancel(booking.id)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleReschedule(booking.id)}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
                          >
                            Reschedule to form times
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <form onSubmit={handleBook} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create Booking</h2>
            <p className="text-sm text-slate-500">Overlap detection is handled by the backend.</p>
          </div>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Booked By</span>
            {isAdmin ? (
              <input
                value={bookedById}
                onChange={(event) => setBookedById(event.target.value)}
                placeholder="User id"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
              />
            ) : (
              <input value={user?.name || ""} disabled className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5" />
            )}
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Start</span>
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">End</span>
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
              />
            </label>
          </div>

          <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white">
            Book Slot
          </button>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Selected resource</p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {assets.find((asset) => String(asset.id) === String(selectedResourceId))?.name || "No resource selected"}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
