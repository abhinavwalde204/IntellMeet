import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Home, MessageSquare, BookUser, Plus, Link as LinkIcon, MoreHorizontal, LayoutDashboard, BarChart3, Calendar, Copy, Info, Trash2, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isWithinInterval, addMinutes, isBefore } from 'date-fns';
import { toast, Toaster } from 'sonner';

import Login from './pages/Login';
import Register from './pages/Register';
import MeetingLobby from './pages/MeetingLobby';
import MeetingRoom from './pages/MeetingRoom';
import MeetingHistory from './pages/MeetingHistory';
import KanbanBoard from './pages/KanbanBoard';
import TeamWorkspace from './pages/TeamWorkspace';
import Analytics from './pages/Analytics';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationPanel from './components/NotificationPanel';
import { useAuthStore } from './store/authStore';
import LandingPage from './pages/LandingPage';
import axios from './lib/axios';
import { Meeting } from './types/api';

// --- Shared Reusable Components ---

export const EmptyState = ({ icon: Icon, title, description, ctaText, onCtaClick }: any) => (
  <div className="flex flex-col items-center justify-center py-12 text-center h-full">
    <Icon className="w-12 h-12 text-slate-500 mb-4" />
    <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
    <p className="text-slate-400 max-w-sm mb-6">{description}</p>
    {ctaText && onCtaClick && (
      <button onClick={onCtaClick} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20">
        {ctaText}
      </button>
    )}
  </div>
);

export const InitialsAvatar = ({ name, url, className = "w-10 h-10" }: { name: string, url?: string, className?: string }) => {
  if (url) {
    return <img src={url} alt={name} className={`${className} rounded-full border-2 border-[#1e293b] object-cover`} />;
  }
  const initials = name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
  let hash = 0;
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500'];
  const color = colors[Math.abs(hash) % colors.length];

  return (
    <div className={`${className} rounded-full border-2 border-[#1e293b] ${color} flex items-center justify-center text-white text-xs font-semibold`}>
      {initials}
    </div>
  );
};

export const DropdownMenu = ({ trigger, children }: any) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-[#1e293b] ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-slate-700 overflow-hidden">
          <div className="py-1" onClick={() => setOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export const DropdownMenuItem = ({ icon: Icon, label, onClick, textClass = "text-slate-200" }: any) => (
  <button
    onClick={onClick}
    className={`group flex items-center w-full px-4 py-2 text-sm hover:bg-slate-700/50 transition-colors ${textClass}`}
  >
    {Icon && <Icon className="mr-3 h-4 w-4" />}
    {label}
  </button>
);

// --- Dashboard Specific Components ---

const UpcomingMeetingCard = ({ meeting, currentUser, navigate, queryClient }: { meeting: Meeting, currentUser: any, navigate: any, queryClient: any }) => {
  const [timeState, setTimeState] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTimeState(new Date()), 30000); // 30s
    return () => clearInterval(timer);
  }, []);

  const scheduledAt = new Date(meeting.scheduledAt || Date.now() + 86400000); // fallback if missing
  const isUpcoming = isBefore(timeState, scheduledAt);
  const isWithin5Mins = isWithinInterval(timeState, { start: addMinutes(scheduledAt, -5), end: addMinutes(scheduledAt, 120) }); // Active window
  
  const handleJoin = () => {
    if (!isWithin5Mins && isUpcoming) {
      toast.info(`This meeting starts at ${scheduledAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. You can join early if you'd like.`);
    }
    navigate(`/lobby/${meeting.roomId}`);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/meetings/${id}`),
    onSuccess: () => {
      toast.success('Meeting canceled');
      queryClient.invalidateQueries({ queryKey: ['meetings', 'upcoming'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to cancel meeting');
    }
  });

  return (
    <div className="glass-card rounded-[1.5rem] p-5 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">{meeting.title}</h3>
          <p className="text-sm text-slate-400">
            {scheduledAt.toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric'})}, {scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <DropdownMenu trigger={
          <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        }>
          <DropdownMenuItem icon={Copy} label="Copy meeting link" onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/lobby/${meeting.roomId}`);
            toast.success('Link copied');
          }} />
          <DropdownMenuItem icon={Info} label="View details" onClick={() => navigate(`/meetings/${meeting._id}`)} />
          {meeting.hostId?._id === currentUser?.id && (
            <DropdownMenuItem 
              icon={Trash2} 
              label="Cancel meeting" 
              textClass="text-red-400 hover:text-red-300"
              onClick={() => {
                if (window.confirm("Cancel this meeting? Participants will be notified.")) {
                  deleteMutation.mutate(meeting._id);
                }
              }} 
            />
          )}
        </DropdownMenu>
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <div className="flex -space-x-3">
          {meeting.participants?.slice(0, 3).map((p, i) => (
            <InitialsAvatar key={i} name={p.userId?.name || 'Unknown'} url={p.userId?.avatarUrl} />
          ))}
          {meeting.participants?.length > 3 && (
            <div className="w-10 h-10 rounded-full border-2 border-[#1e293b] bg-slate-700 flex items-center justify-center text-xs font-medium text-white z-10 relative">
              +{meeting.participants.length - 3}
            </div>
          )}
          {(!meeting.participants || meeting.participants.length === 0) && (
            <span className="text-sm text-slate-500 italic pl-3">No participants yet</span>
          )}
        </div>
        <button 
          onClick={handleJoin}
          className={`px-6 py-2 rounded-xl font-medium transition-colors shadow-lg ${(!isWithin5Mins && isUpcoming) ? 'bg-blue-600/50 text-white/70 hover:bg-blue-500/70 shadow-blue-600/10' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'}`}
        >
          Join
        </button>
      </div>
    </div>
  );
};

function Dashboard() {
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const { data: response, isLoading, isError, error } = useQuery({
    queryKey: ['meetings', 'upcoming'],
    queryFn: async () => {
      const { data } = await axios.get('/api/meetings?status=scheduled&limit=5');
      return data;
    }
  });

  if (isError) {
    toast.error((error as any)?.response?.data?.message || 'Failed to load meetings');
  }

  const meetings: Meeting[] = response?.meetings || [];

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-100 overflow-hidden font-sans selection:bg-blue-500/30">
      <Toaster theme="dark" position="bottom-right" />
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-20 lg:w-24 flex-shrink-0 flex-col items-center py-8 glass z-10 border-r border-white/5">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-12 shadow-lg shadow-blue-500/20">
          <MessageSquare className="text-white w-6 h-6" />
        </div>
        
        <nav className="flex flex-col gap-8 w-full items-center">
          <Link to="/dashboard" className="p-3 bg-white/10 rounded-xl text-blue-400 transition-all hover:bg-white/15">
            <Home className="w-6 h-6" />
          </Link>
          <Link to="/history" className="p-3 text-slate-400 hover:text-white transition-all hover:bg-white/5 rounded-xl" title="Meeting History">
            <MessageSquare className="w-6 h-6" />
          </Link>
          <Link to="/board" className="p-3 text-slate-400 hover:text-white transition-all hover:bg-white/5 rounded-xl" title="Task Board">
            <LayoutDashboard className="w-6 h-6" />
          </Link>
          <Link to="/analytics" className="p-3 text-slate-400 hover:text-white transition-all hover:bg-white/5 rounded-xl" title="Analytics">
            <BarChart3 className="w-6 h-6" />
          </Link>
          <Link to="/team" className="p-3 text-slate-400 hover:text-white transition-all hover:bg-white/5 rounded-xl" title="Team Workspace">
            <BookUser className="w-6 h-6" />
          </Link>
        </nav>
      </aside>

      {/* Mobile Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass z-50 border-t border-white/5 flex items-center justify-around px-2 pb-safe">
        <Link to="/dashboard" className="p-2 text-blue-400 flex flex-col items-center gap-1">
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link to="/history" className="p-2 text-slate-400 hover:text-white transition-colors flex flex-col items-center gap-1">
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-medium">History</span>
        </Link>
        <div className="-mt-6">
          <button onClick={() => navigate(`/lobby/${Math.random().toString(36).substring(2, 9)}`)} className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
            <Plus className="w-6 h-6" />
          </button>
        </div>
        <Link to="/board" className="p-2 text-slate-400 hover:text-white transition-colors flex flex-col items-center gap-1">
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Tasks</span>
        </Link>
        <Link to="/team" className="p-2 text-slate-400 hover:text-white transition-colors flex flex-col items-center gap-1">
          <BookUser className="w-5 h-5" />
          <span className="text-[10px] font-medium">Team</span>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative pb-20 md:pb-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[40%] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="p-6 md:p-8 lg:p-12 max-w-7xl mx-auto z-10 relative">
          <header className="flex justify-between items-center mb-8 md:mb-10">
            <h1 className="text-2xl font-semibold text-white tracking-tight">Home</h1>
            <div className="flex items-center gap-4">
              <NotificationPanel />
              <DropdownMenu trigger={
                <div className="w-10 h-10 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all bg-slate-700 overflow-hidden border-2 border-[#1e293b]">
                  <InitialsAvatar name={currentUser?.name || 'User'} url={currentUser?.avatarUrl} className="w-full h-full text-sm" />
                </div>
              }>
                <div className="px-4 py-3 border-b border-slate-700">
                  <p className="text-sm font-medium text-white truncate">{currentUser?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{currentUser?.email}</p>
                </div>
                <DropdownMenuItem icon={UserIcon} label="Edit profile" onClick={() => navigate('/settings/profile')} />
                <DropdownMenuItem icon={Settings} label="Preferences" onClick={() => navigate('/settings/preferences')} />
                <div className="border-t border-slate-700 my-1"></div>
                <DropdownMenuItem icon={LogOut} label="Sign out" onClick={handleLogout} textClass="text-red-400 hover:text-red-300" />
              </DropdownMenu>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Action Cards */}
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <button 
                onClick={() => navigate(`/lobby/${Math.random().toString(36).substring(2, 9)}`)}
                className="bg-blue-600 hover:bg-blue-500 transition-all duration-300 p-6 rounded-[2rem] flex flex-col justify-between h-48 group shadow-lg shadow-blue-900/20 text-left"
              >
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="text-white w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white mb-1">New meeting</h3>
                  <p className="text-blue-100/80 text-sm">Start a new meeting</p>
                </div>
              </button>

              <button 
                onClick={() => navigate('/history')}
                className="bg-[#e76e50] hover:bg-[#d85e40] transition-all duration-300 p-6 rounded-[2rem] flex flex-col justify-between h-48 group shadow-lg shadow-orange-900/20 text-left"
              >
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LinkIcon className="text-white w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white mb-1">Meeting History</h3>
                  <p className="text-orange-100/80 text-sm">view past meetings</p>
                </div>
              </button>

              <button 
                onClick={() => navigate('/board')}
                className="bg-[#e76e50] hover:bg-[#d85e40] transition-all duration-300 p-6 rounded-[2rem] flex flex-col justify-between h-48 group shadow-lg shadow-orange-900/20 text-left"
              >
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LayoutDashboard className="text-white w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white mb-1">Task Board</h3>
                  <p className="text-orange-100/80 text-sm">manage your tasks</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/analytics')}
                className="bg-[#e76e50] hover:bg-[#d85e40] transition-all duration-300 p-6 rounded-[2rem] flex flex-col justify-between h-48 group shadow-lg shadow-orange-900/20 text-left"
              >
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="text-white w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white mb-1">Analytics</h3>
                  <p className="text-orange-100/80 text-sm">insights & reports</p>
                </div>
              </button>
            </div>

            {/* Right Column - Info & Upcoming */}
            <div className="flex flex-col gap-6">
              {/* Clock Widget */}
              <div className="bg-[#fef7e6] text-slate-800 rounded-[2rem] p-8 relative overflow-hidden h-48 flex flex-col justify-center shadow-lg">
                <h2 className="text-5xl font-bold mb-2 z-10 tracking-tight">{formatTime(time)}</h2>
                <p className="text-slate-600 font-medium z-10">{formatDate(time)}</p>
                
                <div className="absolute right-[-10%] top-[20%] w-32 h-32 bg-yellow-400 rounded-full z-0 mix-blend-multiply" />
                <div className="absolute right-[5%] bottom-[-20%] w-40 h-40 bg-blue-600 rounded-lg transform rotate-12 z-0 mix-blend-multiply" />
                <div className="absolute right-[25%] top-[-10%] w-24 h-24 bg-[#e76e50] rounded-sm transform rotate-45 z-0 mix-blend-multiply" />
              </div>

              {/* Upcoming Meetings List */}
              <div className="flex flex-col gap-4 min-h-[300px]">
                {isLoading ? (
                  // Skeleton loader
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="glass-card rounded-[1.5rem] p-5 flex flex-col gap-4 animate-pulse">
                      <div className="flex justify-between items-start">
                        <div className="w-full">
                          <div className="h-6 bg-slate-700 rounded-md w-1/3 mb-2"></div>
                          <div className="h-4 bg-slate-700/50 rounded-md w-1/2"></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex -space-x-3">
                          <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                          <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                        </div>
                        <div className="w-24 h-10 bg-slate-700 rounded-xl"></div>
                      </div>
                    </div>
                  ))
                ) : meetings.length > 0 ? (
                  meetings.map((meeting) => (
                    <UpcomingMeetingCard 
                      key={meeting._id} 
                      meeting={meeting} 
                      currentUser={currentUser} 
                      navigate={navigate} 
                      queryClient={queryClient} 
                    />
                  ))
                ) : (
                  <div className="glass-card rounded-[1.5rem] flex-1 flex items-center justify-center">
                    <EmptyState 
                      icon={Calendar} 
                      title="No meetings scheduled" 
                      description="Your next meeting will appear here once you or a teammate creates one." 
                      ctaText="Schedule a meeting"
                      onCtaClick={() => navigate(`/lobby/${Math.random().toString(36).substring(2, 9)}`)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/lobby/:id" element={
          <ProtectedRoute>
            <MeetingLobby />
          </ProtectedRoute>
        } />
        <Route path="/room/:id" element={
          <ProtectedRoute>
            <MeetingRoom />
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <MeetingHistory />
          </ProtectedRoute>
        } />
        <Route path="/board" element={
          <ProtectedRoute>
            <KanbanBoard />
          </ProtectedRoute>
        } />
        <Route path="/team" element={
          <ProtectedRoute>
            <TeamWorkspace />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
