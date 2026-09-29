'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CreatedEvent {
  slug: string;
  hostKey: string;
  eventId: string;
}

const LOCATION_PRESETS = [
  { label: 'Google Meet', icon: '' },
  { label: 'Zoom', icon: '' },
  { label: 'In Person', icon: '' },
  { label: 'Phone Call', icon: '' },
];

const DURATION_PRESETS = [
  { value: 15, label: '15 min', hint: '' },
  { value: 30, label: '30 min', hint: '' },
  { value: 45, label: '45 min', hint: '' },
  { value: 60, label: '60 min', hint: ''},
];

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
  const [copiedLink, setCopiedLink] = useState<'public' | 'admin' | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setLocation = (loc: string) => {
    setFormData((prev) => ({ ...prev, location: loc }));
  };

  const setDuration = (dur: number) => {
    setFormData((prev) => ({ ...prev, duration: dur }));
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
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const publicUrl = createdEvent ? `${origin}/events/${createdEvent.slug}` : '';
  const adminUrl = createdEvent
    ? `${origin}/events/${createdEvent.slug}/admin?key=${createdEvent.hostKey}`
    : '';

  // STATE 2: SUCCESS CELEBRATION VIEW
  if (createdEvent) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl p-8 space-y-6 relative overflow-hidden">
          {/* Decorative glowing sphere */}
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="text-center space-y-2">
            <span className="inline-block text-5xl animate-bounce">🎉</span>
            <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Boom! Poll is Ready
            </h1>
            <p className="text-sm text-slate-600">
              Share the voting link with your crew. Watch the heatmap light up as they vote!
            </p>
          </div>

          {/* Public Voting Link Card */}
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200/60 rounded-2xl p-5 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-indigo-900 tracking-wide uppercase flex items-center gap-1.5">
                <span>🗳️</span> Public Voter Link
              </span>
              {copiedLink === 'public' && (
                <span className="text-xs bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full animate-pulse">
                  Copied to Clipboard!
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="w-full bg-white border border-indigo-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-indigo-950 outline-none"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(publicUrl, 'public')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-indigo-500/25 transition cursor-pointer active:scale-95"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-indigo-700/80">
              Send this to anyone whose availability you want to collect.
            </p>
          </div>

          {/* Host Admin Link Card */}
          <div className="bg-amber-500/10 border border-amber-300/60 rounded-2xl p-5 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-amber-900 tracking-wide uppercase flex items-center gap-1.5">
                <span>🔒</span> Host Magic Link (Keep Secret)
              </span>
              {copiedLink === 'admin' && (
                <span className="text-xs bg-amber-600 text-white font-bold px-2 py-0.5 rounded-full animate-pulse">
                  Copied!
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={adminUrl}
                className="w-full bg-white border border-amber-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-amber-950 outline-none"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(adminUrl, 'admin')}
                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition cursor-pointer active:scale-95"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-amber-800/80">
              ⚠️ Bookmark this! Only this link has the power to lock in the final winning slot.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/events/${createdEvent.slug}`}
              className="flex-1 text-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/25 transition cursor-pointer active:scale-95"
            >
              Open Voting Grid →
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
              className="px-5 py-3 border border-slate-200 hover:bg-white bg-slate-50 rounded-xl text-sm font-bold text-slate-700 transition cursor-pointer"
            >
              + Create Another
            </button>
          </div>
        </div>
      </main>
    );
  }

  // STATE 1: FORM VIEW
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-pink-50 py-12 px-4 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl shadow-xl shadow-slate-200/60 p-8 sm:p-10 space-y-8 relative">
        {/* Header with playful badge */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide">
            <span>✨</span> Next-Gen When2meet Clone
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Sync<span className="text-indigo-600">Lock</span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-base">
            Find the perfect time with your group, collect custom intake questions, and lock in confirmed calendar invites effortlessly.
          </p>
        </div>

        {/* Live Ticket Preview */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-200">
            Live Ticket Preview
          </div>
          <div className="text-xl font-black mt-1 truncate">
            {formData.title || 'Untitled Gathering'}
          </div>
          <div className="flex flex-wrap gap-2 mt-3 text-xs font-medium">
            <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg">
              👤 {formData.hostName || 'Host'}
            </span>
            <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg">
              📍 {formData.location || 'Online'}
            </span>
            <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg">
              ⏱️ {formData.duration} mins
            </span>
            <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg">
              ⏰ {formData.startHour > 12 ? `${formData.startHour - 12} PM` : `${formData.startHour} AM`} -{' '}
              {formData.endHour > 12 ? `${formData.endHour - 12} PM` : `${formData.endHour} AM`}
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-2xl flex items-center gap-2">
            <span>⚠️</span> {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title & Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                What are you scheduling? <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Design Hackathon Sync 🚀"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl px-4 py-3 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Notes or Agenda (Optional)
              </label>
              <textarea
                name="description"
                rows={2}
                value={formData.description}
                onChange={handleChange}
                placeholder="Add context, links, or what people should prepare..."
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl px-4 py-3 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Host Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Your Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="hostName"
                required
                value={formData.hostName}
                onChange={handleChange}
                placeholder="e.g. Maya Lin"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl px-4 py-3 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
              />
            </div>

            {/* Location selector with quick chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Where will you meet?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {LOCATION_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setLocation(preset.label)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      formData.location === preset.label
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {preset.icon} {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Duration Pills */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Meeting Duration
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {DURATION_PRESETS.map((dur) => (
                <button
                  key={dur.value}
                  type="button"
                  onClick={() => setDuration(dur.value)}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    formData.duration === dur.value
                      ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/30'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                  }`}
                >
                  <div
                    className={`font-black text-sm ${
                      formData.duration === dur.value ? 'text-indigo-900' : 'text-slate-800'
                    }`}
                  >
                    {dur.label}
                  </div>
                  <div
                    className={`text-[11px] font-medium mt-0.5 ${
                      formData.duration === dur.value ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  >
                    {dur.hint}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Boundaries */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Earliest Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                required
                value={formData.startDate}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Latest Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                required
                value={formData.endDate}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Daily Time Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Earliest Daily Hour
              </label>
              <select
                name="startHour"
                value={formData.startHour}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition cursor-pointer"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? '12:00 AM (Midnight)' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM (Noon)' : `${i - 12}:00 PM`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Latest Daily Hour
              </label>
              <select
                name="endHour"
                value={formData.endHour}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition cursor-pointer"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Big Action Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-8 rounded-2xl text-white font-extrabold text-base tracking-wide shadow-xl transition-all cursor-pointer ${
                isLoading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:scale-[0.98]'
              }`}
            >
              {isLoading ? 'Creating Your Poll...' : 'Create Scheduling Poll ✨'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}