import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, FileText, Search, ChevronRight, Sparkles, Calendar, Loader2 } from 'lucide-react';
import api from '../lib/axios';

interface MeetingItem {
  _id: string;
  title: string;
  roomId: string;
  status: string;
  startTime: string;
  endTime: string;
  duration: number;
  summary: string;
  participants: { name: string }[];
  actionItems: { title: string; status: string; assignee: string }[];
  createdAt: string;
}

// Demo data for when backend isn't running
const DEMO_MEETINGS: MeetingItem[] = [
  {
    _id: '1',
    title: 'Sprint Review – Week 12',
    roomId: 'abc123',
    status: 'ended',
    startTime: new Date(Date.now() - 3600000).toISOString(),
    endTime: new Date().toISOString(),
    duration: 3420,
    summary: 'The team reviewed sprint progress. Sarah completed the authentication flow and dashboard layout with glassmorphism design. Mike finished meeting API endpoints and is working on WebRTC signaling. Alex set up the Whisper integration with 5-second audio chunks. The team decided to use GitHub Actions for CI/CD.',
    participants: [{ name: 'Sarah' }, { name: 'Mike' }, { name: 'Alex' }, { name: 'You' }],
    actionItems: [
      { title: 'Complete WebRTC signaling server', status: 'in-progress', assignee: 'Mike' },
      { title: 'Set up GitHub Actions CI/CD', status: 'pending', assignee: 'Mike' },
      { title: 'Finalize Whisper audio pipeline', status: 'done', assignee: 'Alex' },
      { title: 'Polish glassmorphism UI', status: 'pending', assignee: 'Sarah' }
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    _id: '2',
    title: 'Design Sync – Dashboard UI',
    roomId: 'def456',
    status: 'ended',
    startTime: new Date(Date.now() - 172800000).toISOString(),
    endTime: new Date(Date.now() - 169200000).toISOString(),
    duration: 2700,
    summary: 'Reviewed the dashboard wireframes and decided on the glassmorphism theme with a dark slate color palette. Agreed to use Tailwind CSS v4 with custom utility classes for the glass effect. Planned the component hierarchy for reusable UI elements.',
    participants: [{ name: 'Sarah' }, { name: 'You' }],
    actionItems: [
      { title: 'Create glass-card component', status: 'done', assignee: 'Sarah' },
      { title: 'Implement sidebar navigation', status: 'done', assignee: 'Sarah' }
    ],
    createdAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    _id: '3',
    title: 'Backend Architecture Planning',
    roomId: 'ghi789',
    status: 'ended',
    startTime: new Date(Date.now() - 259200000).toISOString(),
    endTime: new Date(Date.now() - 255600000).toISOString(),
    duration: 4200,
    summary: 'Discussed the three-tier architecture with clear separation between client, API servers, and data layer. Decided on MongoDB for primary storage, Redis for caching and pub/sub, and JWT-based authentication with short-lived access tokens and HTTP-only refresh cookies.',
    participants: [{ name: 'Mike' }, { name: 'Alex' }, { name: 'You' }],
    actionItems: [
      { title: 'Set up MongoDB schemas', status: 'done', assignee: 'Mike' },
      { title: 'Implement JWT auth flow', status: 'done', assignee: 'Alex' },
      { title: 'Configure Redis pub/sub', status: 'in-progress', assignee: 'Mike' }
    ],
    createdAt: new Date(Date.now() - 259200000).toISOString()
  }
];

export default function MeetingHistory() {
  const [meetings, setMeetings] = useState<MeetingItem[]>(DEMO_MEETINGS);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingItem | null>(DEMO_MEETINGS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [_loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/meetings');
        if (res.data.meetings.length > 0) {
          setMeetings(res.data.meetings);
          setSelectedMeeting(res.data.meetings[0]);
        }
      } catch {
        // Use demo data silently
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const filteredMeetings = meetings.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSummarize = async (meetingId: string) => {
    try {
      setSummarizing(true);
      const res = await api.post(`/meetings/${meetingId}/summarize`);
      const updated = res.data.meeting;
      setMeetings(prev => prev.map(m => m._id === meetingId ? { ...m, ...updated } : m));
      setSelectedMeeting(prev => prev?._id === meetingId ? { ...prev, ...updated } : prev);
    } catch {
      // silently fail
    } finally {
      setSummarizing(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-emerald-500/20 text-emerald-400';
      case 'in-progress': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-amber-500/20 text-amber-400';
    }
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-100 overflow-hidden">
      {/* Sidebar List */}
      <aside className={`w-full md:w-[380px] flex-shrink-0 border-r border-white/5 flex-col bg-slate-900/50 ${selectedMeeting ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold tracking-tight">Meeting History</h1>
            <Link to="/" className="text-sm text-blue-400 hover:text-blue-300">← Home</Link>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredMeetings.map(meeting => (
            <button
              key={meeting._id}
              onClick={() => setSelectedMeeting(meeting)}
              className={`w-full text-left p-4 rounded-2xl transition-all group ${
                selectedMeeting?._id === meeting._id
                  ? 'glass-card ring-1 ring-blue-500/30'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-sm text-white truncate pr-2">{meeting.title}</h3>
                <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(meeting.createdAt)}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(meeting.duration)}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{meeting.participants.length}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Detail Panel */}
      <main className={`flex-1 overflow-y-auto relative pb-20 md:pb-0 ${selectedMeeting ? 'block' : 'hidden md:block'}`}>
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

        {selectedMeeting ? (
          <div className="p-8 lg:p-12 max-w-4xl relative z-10">
            {/* Header */}
            <div className="mb-8">
              <button onClick={() => setSelectedMeeting(null)} className="md:hidden flex items-center gap-2 text-sm text-blue-400 mb-6 bg-blue-500/10 px-3 py-1.5 rounded-lg w-fit">
                <ChevronRight className="w-4 h-4 rotate-180" /> Back to meetings
              </button>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full font-medium">
                  {selectedMeeting.status === 'ended' ? 'Completed' : selectedMeeting.status}
                </span>
                <span className="text-xs text-slate-500">{formatDate(selectedMeeting.createdAt)}</span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{selectedMeeting.title}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{formatDuration(selectedMeeting.duration)}</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{selectedMeeting.participants.length} participants</span>
              </div>
            </div>

            {/* AI Summary Card */}
            <div className="glass-card rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">AI Summary</h2>
                {!selectedMeeting.summary && (
                  <button
                    onClick={() => handleSummarize(selectedMeeting._id)}
                    disabled={summarizing}
                    className="ml-auto flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {summarizing ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="w-3.5 h-3.5" /> Generate Summary</>
                    )}
                  </button>
                )}
              </div>
              {selectedMeeting.summary ? (
                <p className="text-slate-300 leading-relaxed text-sm">{selectedMeeting.summary}</p>
              ) : (
                <div className="text-center py-6">
                  <p className="text-slate-500 text-sm mb-3">No AI summary generated yet.</p>
                  <button
                    onClick={() => handleSummarize(selectedMeeting._id)}
                    disabled={summarizing}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    {summarizing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Extracting action items...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Generate AI Summary & Extract Tasks</>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Action Items */}
            <div className="glass-card rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Action Items</h2>
                <span className="ml-auto text-xs text-slate-500">{selectedMeeting.actionItems.length} items</span>
              </div>
              <div className="space-y-3">
                {selectedMeeting.actionItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        item.status === 'done' ? 'bg-emerald-400' : item.status === 'in-progress' ? 'bg-blue-400' : 'bg-amber-400'
                      }`} />
                      <span className="text-sm text-white truncate">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-slate-400">@{item.assignee}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Participants */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" /> Participants
              </h2>
              <div className="flex flex-wrap gap-3">
                {selectedMeeting.participants.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                      {p.name[0]}
                    </div>
                    <span className="text-sm font-medium text-slate-300">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            <p>Select a meeting to view details</p>
          </div>
        )}
      </main>
    </div>
  );
}
