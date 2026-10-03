'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface EventData {
  id: string;
  title: string;
  description: string | null;
  hostName: string;
  location: string;
  startDate: string;
  endDate: string;
  startHour: number;
  endHour: number;
  duration: number;
  status: string;
  slug: string;
}

export default function EventVotingPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Participant identity & selected slots
  const [participantName, setParticipantName] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());

  // Drag selection state machine
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragMode, setDragMode] = useState<'ADD' | 'REMOVE'>('ADD');

  // 1. Fetch Event Details on mount
  useEffect(() => {
    if (!slug) return;

    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${slug}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load event');
        }

        setEvent(data.event);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Failed to load event details.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvent();
  }, [slug]);

  // 2. Global Mouseup Listener so drag doesn't get stuck if released outside the table
  useEffect(() => {
    const handleMouseUp = () => setIsMouseDown(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // 3. Generate Array of Days (Columns)
  const days = useMemo(() => {
    if (!event) return [];
    const list: Date[] = [];
    const current = new Date(event.startDate);
    const end = new Date(event.endDate);

    current.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
      list.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return list;
  }, [event]);

  // 4. Generate Array of Time Intervals (Rows)
  const timeSlots = useMemo(() => {
    if (!event) return [];
    const slots: { hour: number; minute: number; label: string }[] = [];
    const startMins = event.startHour * 60;
    const endMins = event.endHour * 60;
    const step = event.duration || 30;

    for (let m = startMins; m < endMins; m += step) {
      const hour = Math.floor(m / 60);
      const minute = m % 60;
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const displayMinute = minute < 10 ? `0${minute}` : `${minute}`;
      slots.push({
        hour,
        minute,
        label: `${displayHour}:${displayMinute} ${period}`,
      });
    }
    return slots;
  }, [event]);

  // Helper to build unique ISO timestamp key for each cell
  const getSlotKey = (day: Date, hour: number, minute: number) => {
    const d = new Date(day);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  // 5. Drag Handlers (Paintbrush vs. Eraser)
  const handleCellMouseDown = (slotKey: string) => {
    setIsMouseDown(true);
    const next = new Set(selectedSlots);

    if (next.has(slotKey)) {
      next.delete(slotKey);
      setDragMode('REMOVE');
    } else {
      next.add(slotKey);
      setDragMode('ADD');
    }
    setSelectedSlots(next);
  };

  const handleCellMouseEnter = (slotKey: string) => {
    if (!isMouseDown) return;

    const next = new Set(selectedSlots);
    if (dragMode === 'ADD') {
      next.add(slotKey);
    } else {
      next.delete(slotKey);
    }
    setSelectedSlots(next);
  };

  // Quick Action Utilities
  const selectAll = () => {
    if (!event) return;
    const all = new Set<string>();
    days.forEach((day) => {
      timeSlots.forEach((slot) => {
        all.add(getSlotKey(day, slot.hour, slot.minute));
      });
    });
    setSelectedSlots(all);
  };

  const clearSelection = () => {
    setSelectedSlots(new Set());
  };

  // Loading State
  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6 text-neutral-900">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
          <div className="w-2 h-2 rounded-full bg-neutral-900 animate-ping" />
          Loading event grid...
        </div>
      </main>
    );
  }

  // Error State
  if (errorMessage || !event) {
    return (
      <main className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6 text-neutral-900">
        <div className="max-w-md w-full bg-white border border-neutral-200/80 rounded-2xl p-6 text-center space-y-4">
          <div className="text-xl">⚠️</div>
          <h1 className="text-base font-semibold">Event Not Found</h1>
          <p className="text-xs text-neutral-500">
            {errorMessage || "The event you are looking for doesn't exist or may have been deleted."}
          </p>
          <Link
            href="/create"
            className="inline-block px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-medium"
          >
            Create an Event
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafafa] py-10 px-4 select-none text-neutral-900">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400">
                SyncLock Event
              </span>
              <span className="inline-block w-1 h-1 rounded-full bg-neutral-300" />
              <span className="text-xs text-neutral-500 font-medium">Hosted by {event.hostName}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              {event.title}
            </h1>
            {event.description && (
              <p className="text-xs text-neutral-500 max-w-xl">{event.description}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-white border border-neutral-200 rounded-md font-medium text-neutral-600">
              📍 {event.location}
            </span>
            <span className="px-2.5 py-1 bg-white border border-neutral-200 rounded-md font-medium text-neutral-600">
              ⏱️ {event.duration}m slots
            </span>
          </div>
        </header>

        {/* Voter Controls & Instructions */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex-1 space-y-1">
            <label className="block text-xs font-medium text-neutral-700">
              Your Name
            </label>
            <input
              type="text"
              placeholder="e.g. Maya"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              className="w-full sm:max-w-xs bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-semibold text-neutral-900">
                {selectedSlots.size} slots selected
              </div>
              <div className="text-[11px] text-neutral-400">
                {((selectedSlots.size * event.duration) / 60).toFixed(1)} hrs total
              </div>
            </div>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={selectAll}
                className="px-2.5 py-1.5 border border-neutral-200 hover:bg-neutral-50 rounded-lg text-xs font-medium text-neutral-700 transition cursor-pointer"
              >
                All
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="px-2.5 py-1.5 border border-neutral-200 hover:bg-neutral-50 rounded-lg text-xs font-medium text-neutral-700 transition cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Drag Helper Hint */}
        <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
          <span>💡 Click and drag across slots to paint your availability.</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Available
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-neutral-100 border border-neutral-200 inline-block" /> Busy
            </span>
          </div>
        </div>

        {/* The Virtual Time Grid */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-xs overflow-x-auto p-4 sm:p-6">
          <div className="inline-block min-w-full">
            <table className="border-collapse w-full">
              <thead>
                <tr>
                  <th className="p-2 w-20 text-[11px] font-mono text-neutral-400 text-left uppercase">
                    Time
                  </th>
                  {days.map((day, idx) => (
                    <th
                      key={idx}
                      className="p-2 text-center text-xs font-medium text-neutral-800 min-w-[90px]"
                    >
                      <div className="text-[11px] text-neutral-400 uppercase font-mono">
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="font-semibold text-neutral-900">
                        {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot, rowIdx) => (
                  <tr key={rowIdx}>
                    <td className="pr-3 py-1 text-[11px] font-mono text-neutral-400 text-right align-middle whitespace-nowrap">
                      {slot.label}
                    </td>
                    {days.map((day, colIdx) => {
                      const slotKey = getSlotKey(day, slot.hour, slot.minute);
                      const isSelected = selectedSlots.has(slotKey);

                      return (
                        <td key={colIdx} className="p-0.5">
                          <div
                            onMouseDown={() => handleCellMouseDown(slotKey)}
                            onMouseEnter={() => handleCellMouseEnter(slotKey)}
                            className={`h-7 rounded-md transition-colors cursor-pointer border ${
                              isSelected
                                ? 'bg-emerald-500 border-emerald-600 shadow-xs'
                                : 'bg-neutral-50/70 border-neutral-200/60 hover:bg-neutral-100'
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}