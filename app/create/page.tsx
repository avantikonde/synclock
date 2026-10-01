'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CreatedEvent {
  slug: string;
  hostKey: string;
  eventId: string;
}

const DURATIONS = [15, 30, 45, 60];
const LOCATIONS = ['Google Meet', 'Zoom', 'In Person', 'Phone Call'];

export default function CreateEventPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hostName: '',
    location: 'Google Meet',
    startDate: '',
    endDate: '',
    startHour: 9,
    endHour: 17,
    duration: 30,
    inviteeLimit: 20,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdEvent, setCreatedEvent] = useState<CreatedEvent | null>(null);
  const [copiedType, setCopiedType] = useState<'public' | 'admin' | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setErrorMessage('End date cannot be earlier than start date.');
      setIsLoading(false);
      return;
    }

    if (Number(formData.startHour) >= Number(formData.endHour)) {
      setErrorMessage('Start time must be earlier than end time.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      setCreatedEvent(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'public' | 'admin') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const publicUrl = createdEvent ? `${origin}/events/${createdEvent.slug}` : '';
  const adminUrl = createdEvent
    ? `${origin}/events/${createdEvent.slug}/admin?key=${createdEvent.hostKey}`
    : '';

  // STATE 2: CLEAN MINIMAL SUCCESS VIEW
  if (createdEvent) {
    return (
      <main className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6 text-neutral-900">
        <div className="max-w-md w-full bg-white border border-neutral-200/80 rounded-2xl p-7 shadow-xs space-y-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Poll Published
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
              {formData.title || 'Event'}
            </h1>
            <p className="text-xs text-neutral-500">
              Share the voting link with participants. Use the host key to finalize the meeting time.
            </p>
          </div>

          <div className="space-y-4">
            {/* Voter link */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-neutral-700">Participant Voting Link</span>
                {copiedType === 'public' && (
                  <span className="text-emerald-600 font-medium">Copied</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-mono text-neutral-600 truncate">
                  {publicUrl}
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(publicUrl, 'public')}
                  className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Host secret key */}
            <div className="space-y-1.5 pt-2 border-t border-neutral-100">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-neutral-700">Host Management Link (Private)</span>
                {copiedType === 'admin' && (
                  <span className="text-amber-600 font-medium">Copied</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-mono text-neutral-600 truncate">
                  {adminUrl}
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(adminUrl, 'admin')}
                  className="px-3 py-2 border border-neutral-300 hover:bg-neutral-100 rounded-lg text-xs font-medium text-neutral-800 transition cursor-pointer"
                >
                  Copy
                </button>
              </div>
              <p className="text-[11px] text-neutral-400">
                Keep this link safe. You need it to choose the winning slot later.
              </p>
            </div>
          </div>

          <div className="pt-2 flex gap-2.5">
            <Link
              href={`/events/${createdEvent.slug}`}
              className="flex-1 text-center bg-neutral-900 hover:bg-neutral-800 text-white py-2.5 rounded-xl text-xs font-medium transition"
            >
              Open Voting Grid
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreatedEvent(null);
                setFormData({
                  title: '',
                  description: '',
                  hostName: '',
                  location: 'Google Meet',
                  startDate: '',
                  endDate: '',
                  startHour: 9,
                  endHour: 17,
                  duration: 30,
                  inviteeLimit: 20,
                });
              }}
              className="px-4 py-2.5 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-xs font-medium text-neutral-600 transition cursor-pointer"
            >
              New Poll
            </button>
          </div>
        </div>
      </main>
    );
  }

  // STATE 1: REFINED CLEAN FORM VIEW
  return (
    <main className="min-h-screen bg-[#fafafa] py-16 px-4 text-neutral-900">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Simple Brand Header */}
        <header className="space-y-1">
          <div className="flex items-center gap-2">          
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Create Scheduling Poll
          </h1>
          <p className="text-xs text-neutral-500">
            Find mutual availability without the back-and-forth.
          </p>
        </header>

        {errorMessage && (
          <div className="p-3 bg-red-50/70 border border-red-200 text-red-700 text-xs rounded-xl">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
          {/* Section 1: Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Event Title <span className="text-neutral-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="Team Sync, Coffee Chat, Project Kickoff"
                className="w-full bg-transparent border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Your Name <span className="text-neutral-400">*</span>
                </label>
                <input
                  type="text"
                  name="hostName"
                  required
                  value={formData.hostName}
                  onChange={handleChange}
                  placeholder="Rahul S."
                  className="w-full bg-transparent border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Google Meet, Zoom, or Room"
                  className="w-full bg-transparent border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition"
                />
              </div>
            </div>

            {/* Quick Location Pills */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, location: loc }))}
                  className={`text-xs px-2.5 py-1 rounded-md border transition cursor-pointer ${
                    formData.location === loc
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Description (Optional)
              </label>
              <textarea
                name="description"
                rows={2}
                value={formData.description}
                onChange={handleChange}
                placeholder="What will you discuss?"
                className="w-full bg-transparent border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition"
              />
            </div>
          </div>

          <div className="border-t border-neutral-100" />

          {/* Section 2: Date Boundaries */}
          <div className="space-y-4">
            <div className="text-xs font-medium text-neutral-900">Date Range</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] text-neutral-500 mb-1">From</label>
                <input
                  type="date"
                  name="startDate"
                  required
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-500 mb-1">To</label>
                <input
                  type="date"
                  name="endDate"
                  required
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-100" />

          {/* Section 3: Daily Hours & Duration */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-neutral-900">Duration</span>
              <span className="text-[11px] text-neutral-400">per candidate slot</span>
            </div>

            {/* Segmented Duration Selector */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-neutral-100/70 border border-neutral-200/60 rounded-xl">
              {DURATIONS.map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, duration: dur }))}
                  className={`py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                    formData.duration === dur
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {dur}m
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-1">
              <div>
                <label className="block text-[11px] text-neutral-500 mb-1">Earliest Time</label>
                <select
                  name="startHour"
                  value={formData.startHour}
                  onChange={handleChange}
                  className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-500 mb-1">Latest Time</label>
                <select
                  name="endHour"
                  value={formData.endHour}
                  onChange={handleChange}
                  className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl text-white text-xs font-medium tracking-wide transition cursor-pointer ${
                isLoading
                  ? 'bg-neutral-400 cursor-not-allowed'
                  : 'bg-neutral-900 hover:bg-neutral-800 active:scale-[0.99]'
              }`}
            >
              {isLoading ? 'Creating...' : 'Create Poll'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}