import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Camera, CameraOff, MonitorUp, PhoneOff,
  MessageSquare, Users, LayoutGrid, Sparkles, Send, X
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
}

interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: number;
}

type SidebarTab = 'chat' | 'people' | 'transcript';

const MOCK_TRANSCRIPT: TranscriptEntry[] = [
  { speaker: 'Host', text: "Good morning everyone. Let's get started with the sprint review.", timestamp: 0 },
  { speaker: 'Sarah', text: "I've completed the authentication flow and dashboard layout.", timestamp: 12 },
  { speaker: 'Mike', text: "Backend API endpoints are all done. Working on WebRTC now.", timestamp: 28 },
  { speaker: 'Alex', text: "Whisper integration is set up. I suggest 5-second audio chunks.", timestamp: 44 },
];

const MOCK_PARTICIPANTS = [
  { id: '1', name: 'You', muted: false, videoOff: false, isHost: true },
  { id: '2', name: 'Sarah Miller', muted: false, videoOff: false },
  { id: '3', name: 'Mike Johnson', muted: true, videoOff: false },
  { id: '4', name: 'Alex Chen', muted: false, videoOff: true },
];

export default function MeetingRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'Alex Chen', text: "Let's review the AI transcription accuracy later.", time: '10:42' },
    { id: '2', sender: 'Sarah Miller', text: "Agreed! The glassmorphism UI looks 🔥", time: '10:43' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [liveCaption, setLiveCaption] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Simulate live transcript streaming
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < MOCK_TRANSCRIPT.length) {
        const entry = MOCK_TRANSCRIPT[idx];
        setLiveCaption(`[${entry.speaker}] ${entry.text}`);
        setTimeout(() => {
          setTranscript(prev => [...prev, entry]);
          setLiveCaption('');
        }, 2500);
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const newSocket = io('http://localhost:5000', { withCredentials: true });
    setSocket(newSocket);
    newSocket.on('connect', () => {
      newSocket.emit('join-room', id, user?.id || 'guest');
    });
    newSocket.on('receive-message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => { newSocket.disconnect(); };
  }, [id, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: user?.name || 'You',
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, msg]);
    socket?.emit('send-message', id, msg);
    setChatInput('');
  };

  const toggleSidebar = (tab: SidebarTab) => {
    setSidebarTab(prev => prev === tab ? null : tab);
  };

  const handleLeave = () => {
    setShowSummaryModal(true);
  };

  const confirmLeave = () => {
    navigate('/history');
  };

  return (
    <div className="h-screen w-full bg-[#0c1220] text-white flex flex-col overflow-hidden">

      {/* Top Bar */}
      <header className="h-14 border-b border-white/[0.06] flex items-center justify-between px-5 bg-slate-900/60 backdrop-blur z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-red-500/20 text-red-400 text-xs font-bold px-2.5 py-1 rounded-full border border-red-500/30">
            <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" /> LIVE
          </div>
          <h2 className="font-medium text-sm tracking-tight text-slate-200">Weekly Sync · {id}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg font-medium">00:24:15</span>
          <button className="p-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-lg">
            <LayoutGrid size={18} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Video Grid */}
        <div className={`flex-1 p-2 md:p-4 overflow-hidden transition-all duration-300 relative`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 h-full">
            {MOCK_PARTICIPANTS.map((p, i) => (
              <div key={p.id} className="relative bg-slate-800/60 rounded-2xl border border-white/[0.07] overflow-hidden flex items-center justify-center group">
                {p.videoOff ? (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold shadow-xl">
                    {p.name[0]}
                  </div>
                ) : (
                  <img
                    src={`https://images.unsplash.com/photo-${['1573496359142-b8d87734a5a2', '1507003211169-0a1dd7228f2d', '1573497019940-1c28c88b4f3e', '1506794778202-cad84cf45f1d'][i]}?auto=format&fit=crop&q=80&w=600`}
                    className="w-full h-full object-cover opacity-70"
                    alt={p.name}
                  />
                )}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div className="bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5">
                    {p.muted && <MicOff className="w-3 h-3 text-red-400" />}
                    {p.name}{p.isHost && <span className="text-blue-400 text-[10px] font-semibold ml-1">HOST</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Live Caption */}
          {liveCaption && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 max-w-2xl w-full px-4">
              <div className="bg-black/75 backdrop-blur text-white text-center py-3 px-6 rounded-2xl text-sm font-medium border border-white/10 animate-fade-in shadow-xl">
                {liveCaption}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {sidebarTab && (
          <div className="absolute inset-0 md:relative w-full md:w-[320px] border-l border-white/[0.06] bg-slate-900/95 md:bg-slate-900/80 flex flex-col flex-shrink-0 z-40">
            {/* Sidebar Header */}
            <div className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-1">
              {(['chat', 'people', 'transcript'] as SidebarTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSidebarTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${sidebarTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {tab === 'transcript' ? 'AI Captions' : tab}
                </button>
              ))}
              <button onClick={() => setSidebarTab(null)} className="ml-auto text-slate-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Chat Tab */}
            {sidebarTab === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-2 ${msg.sender === (user?.name || 'You') ? 'flex-row-reverse' : ''}`}>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {msg.sender[0]}
                      </div>
                      <div className={`max-w-[75%] ${msg.sender === (user?.name || 'You') ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div className={`px-3 py-2 rounded-2xl text-sm ${msg.sender === (user?.name || 'You') ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/[0.07] text-slate-200 rounded-tl-none'}`}>
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-slate-500">{msg.sender !== (user?.name || 'You') && `${msg.sender} · `}{msg.time}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-white/[0.06]">
                  <div className="flex gap-2 bg-white/[0.05] rounded-xl px-3 py-2 border border-white/[0.07]">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      placeholder="Send a message..."
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                    />
                    <button onClick={sendMessage} className="text-blue-400 hover:text-blue-300 transition-colors">
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* People Tab */}
            {sidebarTab === 'people' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <p className="text-xs text-slate-500 mb-3">{MOCK_PARTICIPANTS.length} participants</p>
                {MOCK_PARTICIPANTS.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                      {p.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {p.name}
                        {p.isHost && <span className="ml-2 text-[10px] text-blue-400 font-semibold">HOST</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {p.muted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-slate-400" />}
                      {p.videoOff ? <CameraOff className="w-4 h-4 text-red-400" /> : <Camera className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Transcript/Captions Tab */}
            {sidebarTab === 'transcript' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex items-center gap-2 mb-4 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-300">AI is transcribing in real-time via Whisper</p>
                </div>
                {transcript.map((entry, i) => (
                  <div key={i} className="bg-white/[0.04] rounded-xl p-3">
                    <p className="text-[11px] font-semibold text-blue-400 mb-1">{entry.speaker}</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{entry.text}</p>
                  </div>
                ))}
                {liveCaption && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 animate-pulse">
                    <p className="text-[11px] font-semibold text-blue-400 mb-1">Live</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{liveCaption.replace(/^\[.*?\] /, '')}</p>
                  </div>
                )}
                <div ref={transcriptEndRef} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <footer className="h-20 border-t border-white/[0.06] bg-slate-900/80 backdrop-blur flex items-center justify-between px-4 md:px-8 z-20 flex-shrink-0 pb-safe">
        <div className="flex items-center gap-1.5">
          <button onClick={() => setIsMicOn(!isMicOn)} className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center transition-all ${isMicOn ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'}`}>
            {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
          <button onClick={() => setIsVideoOn(!isVideoOn)} className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center transition-all ${isVideoOn ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'}`}>
            {isVideoOn ? <Camera size={18} /> : <CameraOff size={18} />}
          </button>
          <button onClick={() => setIsScreenSharing(!isScreenSharing)} className={`px-3 md:px-4 h-10 md:h-11 rounded-2xl flex items-center gap-2 text-sm font-medium transition-all ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-white/10 hover:bg-white/15 text-slate-300'}`}>
            <MonitorUp size={18} /><span className="hidden md:inline">Share</span>
          </button>
        </div>

        <button onClick={handleLeave} className="px-4 md:px-6 h-10 md:h-11 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all">
          <PhoneOff size={18} /><span className="hidden sm:inline">End</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button onClick={() => toggleSidebar('chat')} className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center transition-all ${sidebarTab === 'chat' ? 'bg-blue-600 text-white' : 'bg-white/10 hover:bg-white/15 text-slate-300'}`}>
            <MessageSquare size={18} />
          </button>
          <button onClick={() => toggleSidebar('people')} className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center transition-all ${sidebarTab === 'people' ? 'bg-blue-600 text-white' : 'bg-white/10 hover:bg-white/15 text-slate-300'}`}>
            <Users size={18} />
          </button>
          <button onClick={() => toggleSidebar('transcript')} className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center transition-all ${sidebarTab === 'transcript' ? 'bg-amber-500 text-white' : 'bg-white/10 hover:bg-white/15 text-slate-300'}`}>
            <Sparkles size={18} />
          </button>
        </div>
      </footer>

      {/* End Meeting / Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card rounded-2xl p-8 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Meeting Ended</h2>
            </div>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Your AI summary, decision list, and action items are being generated. They will be ready in your Meeting History within 60 seconds.
            </p>
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <p className="text-xs text-slate-400 mb-2">AI detected <span className="text-white font-medium">{transcript.length} transcript entries</span></p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-[60%] bg-gradient-to-r from-amber-400 to-orange-500 rounded-full animate-pulse" />
                </div>
                <span className="text-xs text-amber-400">Processing...</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={confirmLeave} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all">
                View Summary
              </button>
              <button onClick={() => setShowSummaryModal(false)} className="px-4 py-3 text-slate-400 hover:text-white transition-colors">
                Stay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
