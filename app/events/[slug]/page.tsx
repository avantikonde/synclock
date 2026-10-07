'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface AvailabilityData {
  id: string;
  slotTime: string;
  participantId: string;
}

interface ParticipantData {
  id: string;
  name: string;
  email: string | null;
  availabilities: AvailabilityData[];
}

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
  participants: ParticipantData[];
}

export default function EventVotingPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tab mode: 'my-availability' (paint) vs 'group-overlap' (heatmap)
  const [activeTab, setActiveTab] = useState<'my-availability' | 'group-overlap'>('my-availability');

  // Participant identity & selected slots
  const [participantName, setParticipantName] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());

  // Save states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Drag selection state machine
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragMode, setDragMode] = useState<'ADD' | 'REMOVE'>('ADD');

  // Heatmap hover inspector
  const [inspectedSlot, setInspectedSlot] = useState<{
    slotKey: string;
    dayLabel: string;
    timeLabel: string;
  } | null>(null);

  // 1. Fetch Event Details (with participants and availabilities)
  const fetchEvent = useCallback(async () => {
    if (!slug) return;
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
  }, [slug]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  // 2. Restore user from localStorage if returning
  useEffect(() => {
    if (!event || !slug) return;
    try {
      const stored = localStorage.getItem(`synclock_user_${slug}`);
      if (stored) {
        const { name } = JSON.parse(stored);
        if (name && !participantName) {
          setParticipantName(name);

          // Find this participant in event data to restore their slots
          const existing = event.participants?.find((p) => p.name === name);
          if (existing && existing.availabilities) {
            const restoredSet = new Set<string>();
            existing.availabilities.forEach((a) => {
              restoredSet.add(new Date(a.slotTime).toISOString());
            });
            setSelectedSlots(restoredSet);
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse localStorage user', e);
    }
  }, [event, slug, participantName]);

  // 3. Global Mouseup Listener so drag doesn't get stuck if released outside table
  useEffect(() => {
    const handleMouseUp = () => setIsMouseDown(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // 4. Generate Array of Days (Columns)
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

  // 5. Generate Array of Time Intervals (Rows)
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

  // 6. Overlap Aggregation Engine (Day 6)
  // Maps slotKey -> list of participant names who are available
  const overlapMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    if (!event?.participants) return map;

    event.participants.forEach((p) => {
      p.availabilities?.forEach((a) => {
        const key = new Date(a.slotTime).toISOString();
        if (!map[key]) {
          map[key] = [];
        }
        if (!map[key].includes(p.name)) {
          map[key].push(p.name);
        }
      });
    });

    return map;
  }, [event]);

  // Find max overlap score to highlight best times
  const totalParticipants = event?.participants?.length ?? 0;
  const maxOverlapCount = useMemo(() => {
    let max = 0;
    Object.values(overlapMap).forEach((names) => {
      if (names.length > max) max = names.length;
    });
    return max;
  }, [overlapMap]);

  // 7. Drag Handlers for "My Availability" Tab
  const handleCellMouseDown = (slotKey: string) => {
    if (activeTab !== 'my-availability') return;
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
    if (activeTab !== 'my-availability') return;
    if (!isMouseDown) return;

    const next = new Set(selectedSlots);
    if (dragMode === 'ADD') {
      next.add(slotKey);
    } else {
      next.delete(slotKey);
    }
    setSelectedSlots(next);
  };

  // 8. Save Availability (Day 5 API Submission)
  const handleSaveAvailability = async () => {
    if (!participantName.trim()) {
      alert('Please enter your name first.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/events/${slug}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: participantName.trim(),
          selectedSlots: Array.from(selectedSlots),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      // Cache user identity in localStorage
      localStorage.setItem(
        `synclock_user_${slug}`,
        JSON.stringify({
          id: data.participant.id,
          name: data.participant.name,
        })
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Refresh event data so the heatmap tab updates live with the new votes
      await fetchEvent();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error saving availability');
    } finally {
      setIsSaving(false);
    }
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

  // Heatmap styling calculation
  const getHeatmapColor = (availableCount: number) => {
    if (totalParticipants === 0 || availableCount === 0) {
      return 'bg-neutral-50/70 border-neutral-200/60 text-transparent';
    }
    const ratio = availableCount / totalParticipants;

    if (ratio === 1 && totalParticipants > 1) {
      return 'bg-emerald-600 border-emerald-700 text-white font-bold shadow-xs';
    }
    if (ratio >= 0.75) {
      return 'bg-emerald-500 border-emerald-600 text-white font-medium';
    }
    if (ratio >= 0.5) {
      return 'bg-emerald-300 border-emerald-400 text-emerald-950 font-medium';
    }
    if (ratio >= 0.25) {
      return 'bg-emerald-200 border-emerald-300 text-emerald-950';
    }
    return 'bg-emerald-100 border-emerald-200 text-emerald-900';
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
        <div className="max-w-md w-full bg-white border border-neutral-200/80 rounded-2xl p-6 text-center space-y-4 shadow-xs">
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
            <span className="px-2.5 py-1 bg-white border border-neutral-200 rounded-md font-medium text-neutral-600">
              👥 {totalParticipants} {totalParticipants === 1 ? 'voter' : 'voters'}
            </span>
          </div>
        </header>

        {/* Tab Switcher: "My Availability" vs "Group Overlap (Heatmap)" */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex p-1 bg-neutral-200/60 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('my-availability')}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                activeTab === 'my-availability'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              My Availability
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('group-overlap')}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'group-overlap'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <span>Group Overlap</span>
              {totalParticipants > 0 && (
                <span className="text-[10px] bg-neutral-900 text-white px-1.5 py-0.2 rounded-full">
                  {totalParticipants}
                </span>
              )}
            </button>
          </div>

          {/* Action Button for saving availability */}
          {activeTab === 'my-availability' && (
            <button
              type="button"
              onClick={handleSaveAvailability}
              disabled={isSaving}
              className={`px-5 py-2 rounded-xl text-xs font-semibold text-white transition cursor-pointer flex items-center gap-2 ${
                isSaving
                  ? 'bg-neutral-400 cursor-not-allowed'
                  : saveSuccess
                  ? 'bg-emerald-600 shadow-xs'
                  : 'bg-neutral-900 hover:bg-neutral-800 active:scale-95'
              }`}
            >
              {isSaving ? 'Saving...' : saveSuccess ? '✓ Availability Saved!' : 'Save My Availability'}
            </button>
          )}
        </div>

        {/* Tab 1: Voter Controls & Instructions */}
        {activeTab === 'my-availability' && (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex-1 space-y-1">
              <label className="block text-xs font-medium text-neutral-700">
                Your Name <span className="text-neutral-400">*</span>
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
        )}

        {/* Tab 2: Group Overlap Inspector Banner */}
        {activeTab === 'group-overlap' && (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-neutral-900 flex items-center gap-2">
                <span>Hover over any slot to inspect attendees</span>
                {maxOverlapCount > 0 && (
                  <span className="text-[11px] font-normal text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Best overlap: {maxOverlapCount}/{totalParticipants} people
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-500">
                {inspectedSlot ? (
                  <span className="font-medium text-neutral-800">
                    {inspectedSlot.dayLabel} at {inspectedSlot.timeLabel}:{' '}
                    <span className="text-emerald-700 font-semibold">
                      {(overlapMap[inspectedSlot.slotKey] || []).length} of {totalParticipants} available
                    </span>
                  </span>
                ) : (
                  'Move your cursor across the heatmap below to view participant breakdowns.'
                )}
              </div>
            </div>

            {/* List of Attendees on Hover */}
            {inspectedSlot && (
              <div className="flex flex-wrap items-center gap-1.5 max-w-sm">
                {(overlapMap[inspectedSlot.slotKey] || []).map((name) => (
                  <span
                    key={name}
                    className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-medium"
                  >
                    ✓ {name}
                  </span>
                ))}
                {event.participants
                  ?.filter((p) => !(overlapMap[inspectedSlot.slotKey] || []).includes(p.name))
                  .map((p) => (
                    <span
                      key={p.name}
                      className="text-[11px] bg-neutral-100 text-neutral-400 border border-neutral-200 px-2 py-0.5 rounded-md line-through"
                    >
                      {p.name}
                    </span>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Drag / Heatmap Legend */}
        <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
          {activeTab === 'my-availability' ? (
            <span>💡 Click and drag across slots to paint your availability.</span>
          ) : (
            <span>Darker green = higher mutual overlap.</span>
          )}

          <div className="flex items-center gap-3">
            {activeTab === 'my-availability' ? (
              <>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Available
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-neutral-100 border border-neutral-200 inline-block" /> Busy
                </span>
              </>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-[10px]">Low</span>
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200 inline-block" />
                <span className="w-3 h-3 rounded bg-emerald-300 border border-emerald-400 inline-block" />
                <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-600 inline-block" />
                <span className="w-3 h-3 rounded bg-emerald-600 border border-emerald-700 inline-block" />
                <span className="text-[10px]">High</span>
              </div>
            )}
          </div>
        </div>

        {/* The 2D Interactive Grid */}
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
                      const availableNames = overlapMap[slotKey] || [];
                      const count = availableNames.length;

                      const dayLabel = day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                      // TAB 1: User Drag-Selection Cell
                      if (activeTab === 'my-availability') {
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
                      }

                      // TAB 2: Collective Heatmap Cell
                      return (
                        <td key={colIdx} className="p-0.5">
                          <div
                            onMouseEnter={() =>
                              setInspectedSlot({
                                slotKey,
                                dayLabel,
                                timeLabel: slot.label,
                              })
                            }
                            className={`h-7 rounded-md transition-colors cursor-pointer border flex items-center justify-center text-[10px] ${getHeatmapColor(
                              count
                            )}`}
                          >
                            {count > 0 ? count : ''}
                          </div>
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