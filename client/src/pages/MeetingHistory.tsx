import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Users, FileText, Search, ChevronRight, Sparkles, Calendar, Loader2, SearchX } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from '../lib/axios';
import { EmptyState, InitialsAvatar } from '../App';
import { toast } from 'sonner';

interface MeetingItem {
  _id: string;
  title: string;
  roomId: string;
  status: string;
  createdAt: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  summary?: string;
  participants: { userId: any, name?: string }[];
  actionItems: { title: string; status: string; assignee: string }[];
}

export default function MeetingHistory() {
  const navigate = useNavigate();
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [summarizing, setSummarizing] = useState(false);

  const { data: meetings = [], isLoading, refetch } = useQuery({
    queryKey: ['meetings', 'history'],
    queryFn: async () => {
      const { data } = await axios.get('/api/meetings?status=ended');
      return data.meetings || [];
    }
  });

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0m';
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

  const filteredMeetings: MeetingItem[] = meetings.filter((m: MeetingItem) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMeeting = meetings.find((m: MeetingItem) => m._id === selectedMeetingId) || (meetings.length > 0 && !selectedMeetingId ? meetings[0] : null);

  const handleSummarize = async (meetingId: string) => {
    try {
      setSummarizing(true);
      await axios.post(`/api/meetings/${meetingId}/summarize`);
      toast.success('AI Summary generated');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to generate summary');
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
    <div className="flex h-screen bg-[#0f172a] text-slate-100 overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Sidebar List */}
      <aside className={`w-full md:w-[380px] flex-shrink-0 border-r border-white/5 flex-col bg-slate-900/50 ${selectedMeeting ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold tracking-tight">Meeting History</h1>
            <Link to="/dashboard" className="text-sm text-blue-400 hover:text-blue-300">← Home</Link>
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
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-full p-4 rounded-2xl glass-card animate-pulse mb-2">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-slate-700/50 rounded w-1/2"></div>
              </div>
            ))
          ) : meetings.length === 0 ? (
            <EmptyState 
              icon={Clock} 
              title="No meetings yet" 
              description="Completed meetings, AI summaries, and recordings will appear here after your first session." 
              ctaText="Start a meeting"
              onCtaClick={() => navigate(`/lobby/${Math.random().toString(36).substring(2, 9)}`)}
            />
          ) : filteredMeetings.length === 0 ? (
            <EmptyState 
              icon={SearchX} 
              title="No results found" 
              description="Try a different title, date, or participant name." 
              ctaText="Clear search"
              onCtaClick={() => setSearchQuery('')}
            />
          ) : (
            filteredMeetings.map((meeting) => (
              <button
                key={meeting._id}
                onClick={() => setSelectedMeetingId(meeting._id)}
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
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{meeting.participants?.length || 0}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Detail Panel */}
      <main className={`flex-1 overflow-y-auto relative pb-20 md:pb-0 ${selectedMeeting ? 'block' : 'hidden md:block'}`}>
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

        {selectedMeeting ? (
          <div className="p-8 lg:p-12 max-w-4xl relative z-10">
            {/* Header */}
            <div className="mb-8">
              <button onClick={() => setSelectedMeetingId(null)} className="md:hidden flex items-center gap-2 text-sm text-blue-400 mb-6 bg-blue-500/10 px-3 py-1.5 rounded-lg w-fit">
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
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{selectedMeeting.participants?.length || 0} participants</span>
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
                <span className="ml-auto text-xs text-slate-500">{selectedMeeting.actionItems?.length || 0} items</span>
              </div>
              <div className="space-y-3">
                {(!selectedMeeting.actionItems || selectedMeeting.actionItems.length === 0) ? (
                  <p className="text-slate-500 text-sm italic">No action items extracted.</p>
                ) : (
                  selectedMeeting.actionItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          item.status === 'done' ? 'bg-emerald-400' : item.status === 'in-progress' ? 'bg-blue-400' : 'bg-amber-400'
                        }`} />
                        <span className="text-sm text-white truncate">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-slate-400">@{item.assignee || 'Unassigned'}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Participants */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" /> Participants
              </h2>
              <div className="flex flex-wrap gap-3">
                {(!selectedMeeting.participants || selectedMeeting.participants.length === 0) ? (
                  <p className="text-slate-500 text-sm italic">No participants found.</p>
                ) : (
                  selectedMeeting.participants.map((p: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2.5">
                      <InitialsAvatar name={p.userId?.name || p.name || 'User'} url={p.userId?.avatarUrl} className="w-8 h-8 text-xs" />
                      <span className="text-sm font-medium text-slate-300">{p.userId?.name || p.name || 'User'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            {meetings.length > 0 && <p>Select a meeting to view details</p>}
          </div>
        )}
      </main>
    </div>
  );
}
