import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Home, MessageSquare, BookUser, Plus, Link as LinkIcon, MoreHorizontal, LayoutDashboard, BarChart3 } from 'lucide-react';
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

function Dashboard() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const navigate = useNavigate();
  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-100 overflow-hidden font-sans selection:bg-blue-500/30">
      
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
        {/* Ambient background glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[40%] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="p-6 md:p-8 lg:p-12 max-w-7xl mx-auto z-10 relative">
          <header className="flex justify-between items-center mb-8 md:mb-10">
            <h1 className="text-2xl font-semibold text-white tracking-tight">Home</h1>
            <div className="flex items-center gap-3">
              <NotificationPanel />
              <button onClick={handleLogout} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                Logout
              </button>
              <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border-2 border-white/10">
                <img src="https://i.pravatar.cc/150?img=47" alt="Profile" className="w-full h-full object-cover" />
              </div>
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
                
                {/* Decorative shapes */}
                <div className="absolute right-[-10%] top-[20%] w-32 h-32 bg-yellow-400 rounded-full z-0 mix-blend-multiply" />
                <div className="absolute right-[5%] bottom-[-20%] w-40 h-40 bg-blue-600 rounded-lg transform rotate-12 z-0 mix-blend-multiply" />
                <div className="absolute right-[25%] top-[-10%] w-24 h-24 bg-[#e76e50] rounded-sm transform rotate-45 z-0 mix-blend-multiply" />
              </div>

              {/* Meeting Items */}
              <div className="glass-card rounded-[1.5rem] p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Icebreaker</h3>
                    <p className="text-sm text-slate-400">10:00 - 11:30 • starts in 18 hours</p>
                  </div>
                  <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <div className="flex -space-x-3">
                    <img className="w-10 h-10 rounded-full border-2 border-[#1e293b]" src="https://i.pravatar.cc/150?img=32" alt="Avatar 1" />
                    <img className="w-10 h-10 rounded-full border-2 border-[#1e293b]" src="https://i.pravatar.cc/150?img=12" alt="Avatar 2" />
                    <img className="w-10 h-10 rounded-full border-2 border-[#1e293b]" src="https://i.pravatar.cc/150?img=5" alt="Avatar 3" />
                    <div className="w-10 h-10 rounded-full border-2 border-[#1e293b] bg-slate-700 flex items-center justify-center text-xs font-medium">+6</div>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20">
                    Join
                  </button>
                </div>
              </div>

              <div className="glass-card rounded-[1.5rem] p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Daily Standup</h3>
                    <p className="text-sm text-slate-400">11:30 - 12:00 • starts in 20 hours</p>
                  </div>
                  <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <div className="flex -space-x-3">
                    <img className="w-10 h-10 rounded-full border-2 border-[#1e293b]" src="https://i.pravatar.cc/150?img=68" alt="Avatar 1" />
                    <img className="w-10 h-10 rounded-full border-2 border-[#1e293b]" src="https://i.pravatar.cc/150?img=59" alt="Avatar 2" />
                    <img className="w-10 h-10 rounded-full border-2 border-[#1e293b]" src="https://i.pravatar.cc/150?img=11" alt="Avatar 3" />
                    <div className="w-10 h-10 rounded-full border-2 border-[#1e293b] bg-slate-700 flex items-center justify-center text-xs font-medium">+3</div>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20">
                    Join
                  </button>
                </div>
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
