import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Camera, CameraOff, MonitorUp, PhoneOff,
  MessageSquare, Users, LayoutGrid, User, Sparkles, Send, X
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import axios from '../lib/axios';
import { InitialsAvatar, EmptyState } from '../App';

interface ChatMessage {
  _id?: string;
  senderId: any;
  senderName: string;
  text: string;
  timestamp: string;
}

interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: number;
}

type SidebarTab = 'chat' | 'people' | 'transcript';

export default function MeetingRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab | null>(null);
  const [chatInput, setChatInput] = useState('');
  
  // Real-time states
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [liveCaption, setLiveCaption] = useState('');
  
  // WebRTC / Layout state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'speaker'>('speaker');
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Fetch meeting details
  const { data: meetingData, isLoading: meetingLoading } = useQuery({
    queryKey: ['meeting', id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/meetings/${id}`);
      return data.meeting;
    }
  });

  // Fetch initial participants
  useQuery({
    queryKey: ['meeting-participants', id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/meetings/${id}/participants`);
      setParticipants(data.participants || []);
      return data.participants;
    }
  });

  // Fetch initial messages
  useQuery({
    queryKey: ['meeting-messages', id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/meetings/${id}/messages`);
      setMessages(data.messages || []);
      return data.messages;
    }
  });

  // Init local media
  useEffect(() => {
    async function setupLocalMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: isVideoOn, audio: isMicOn });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Failed to access media devices", err);
      }
    }
    setupLocalMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Update local stream tracks when toggled
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOn;
      });
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMicOn;
      });
    }
  }, [isVideoOn, isMicOn, localStream]);

  // Socket setup
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', { withCredentials: true });
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      newSocket.emit('join-room', id, user);
    });

    newSocket.on('participant:joined', (newUser) => {
      setParticipants(prev => {
        if (!prev.find(p => p.userId?._id === newUser._id || p.userId?._id === newUser.id)) {
          return [...prev, { userId: newUser, joinedAt: new Date() }];
        }
        return prev;
      });
    });

    newSocket.on('participant:left', (userId) => {
      setParticipants(prev => prev.filter(p => p.userId?._id !== userId && p.userId?.id !== userId));
    });

    newSocket.on('message:receive', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    newSocket.on('transcription:update', (entry: TranscriptEntry) => {
      setLiveCaption(`[${entry.speaker}] ${entry.text}`);
      setTimeout(() => {
        setTranscript(prev => [...prev, entry]);
        setLiveCaption('');
      }, 1500);
      setActiveSpeakerId(entry.speaker); // simplistic speaker detection based on name/id
    });

    return () => { newSocket.disconnect(); };
  }, [id, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const msgData = { text: chatInput };
    try {
      const { data } = await axios.post(`/api/meetings/${id}/messages`, msgData);
      const msg = data.message;
      setMessages(prev => [...prev, msg]);
      socket?.emit('send-message', id, msg);
      setChatInput('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const toggleSidebar = (tab: SidebarTab) => {
    setSidebarTab(prev => prev === tab ? null : tab);
  };

  const handleLeave = () => {
    setShowSummaryModal(true);
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
    }
  };

  const confirmLeave = () => {
    navigate('/history');
  };

  // Combine remote participants with local user for display
  const displayParticipants = [
    { id: user?._id || 'local', name: 'You', isLocal: true, videoOn: isVideoOn, stream: localStream, avatarUrl: user?.avatarUrl },
    ...participants.filter(p => (p.userId?._id || p.userId?.id) !== user?._id).map(p => ({
      id: p.userId?._id || p.userId?.id,
      name: p.userId?.name || 'Unknown',
      isLocal: false,
      videoOn: false, // Since true P2P WebRTC signaling isn't implemented, default to off for remote
      avatarUrl: p.userId?.avatarUrl
    }))
  ];

  const toggleLayout = () => {
    setLayoutMode(prev => prev === 'speaker' ? 'grid' : 'speaker');
  };

  const isSolo = displayParticipants.length <= 1;
  const currentLayout = isSolo ? 'grid' : layoutMode;

  return (
    <div className="h-screen w-full bg-[#0c1220] text-white flex flex-col overflow-hidden font-sans selection:bg-blue-500/30">

      {/* Top Bar */}
      <header className="h-14 border-b border-white/[0.06] flex items-center justify-between px-5 bg-slate-900/60 backdrop-blur z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-red-500/20 text-red-400 text-xs font-bold px-2.5 py-1 rounded-full border border-red-500/30">
            <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" /> LIVE
          </div>
          {meetingLoading ? (
            <div className="h-5 w-40 bg-slate-700 animate-pulse rounded"></div>
          ) : (
            <h2 className="font-medium text-sm tracking-tight text-slate-200">{meetingData?.title || 'Meeting'}</h2>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleLayout}
            disabled={isSolo}
            className={`p-2 transition-colors rounded-lg ${isSolo ? 'text-slate-600' : 'text-slate-400 hover:text-white bg-white/5'}`}
            title="Toggle Layout"
          >
            {currentLayout === 'speaker' ? <LayoutGrid size={18} /> : <User size={18} />}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Video Area */}
        <div className="flex-1 p-2 md:p-4 overflow-hidden transition-all duration-300 relative flex flex-col">
          {currentLayout === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 h-full auto-rows-fr">
              {displayParticipants.map((p) => (
                <div key={p.id} className="relative bg-slate-800/60 rounded-2xl border border-white/[0.07] overflow-hidden flex items-center justify-center group">
                  {p.isLocal && p.videoOn ? (
                    <video 
                      ref={localVideoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <InitialsAvatar name={p.name} url={p.avatarUrl} className="w-20 h-20 text-2xl shadow-xl" />
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 flex items-center justify-between">
                    <div className="bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5">
                      {p.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Speaker View
            <div className="flex flex-col h-full gap-2">
              {/* Active Speaker (Large) */}
              <div className="flex-1 relative bg-slate-800/60 rounded-2xl border border-white/[0.07] overflow-hidden flex items-center justify-center group">
                {/* Fallback to local user if no active speaker detected or active speaker is local */}
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full h-full object-cover ${(!activeSpeakerId || activeSpeakerId === user?.name || activeSpeakerId === 'You') && isVideoOn ? 'block' : 'hidden'}`} 
                />
                {((activeSpeakerId && activeSpeakerId !== user?.name && activeSpeakerId !== 'You') || !isVideoOn) && (
                  <InitialsAvatar name={activeSpeakerId || 'You'} className="w-32 h-32 text-4xl shadow-2xl" />
                )}
                <div className="absolute bottom-4 left-4">
                  <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
                    {activeSpeakerId || 'You'}
                  </div>
                </div>
              </div>
              
              {/* Thumbnails row */}
              <div className="h-32 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                {displayParticipants.map((p) => (
                  <div key={p.id} className="w-48 flex-shrink-0 relative bg-slate-800/60 rounded-xl border border-white/[0.07] overflow-hidden flex items-center justify-center">
                    {p.isLocal && p.videoOn ? (
                      <video 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover"
                        ref={(el) => { if (el && localStream) el.srcObject = localStream }}
                      />
                    ) : (
                      <InitialsAvatar name={p.name} url={p.avatarUrl} className="w-12 h-12 text-sm shadow-md" />
                    )}
                    <div className="absolute bottom-2 left-2">
                      <div className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                        {p.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Caption */}
          {liveCaption && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 max-w-2xl w-full px-4 z-10">
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
                  {messages.length === 0 ? (
                    <EmptyState 
                      icon={MessageSquare} 
                      title="No messages yet" 
                      description="Send a message to the group — it appears here in real time." 
                    />
                  ) : (
                    messages.map((msg, idx) => (
                      <div key={msg._id || idx} className={`flex gap-2 ${msg.senderId === user?.id || msg.senderId?._id === user?.id ? 'flex-row-reverse' : ''}`}>
                        <InitialsAvatar name={msg.senderName || msg.senderId?.name || 'User'} className="w-7 h-7 text-[10px] flex-shrink-0" />
                        <div className={`max-w-[75%] ${msg.senderId === user?.id || msg.senderId?._id === user?.id ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                          <div className={`px-3 py-2 rounded-2xl text-sm ${msg.senderId === user?.id || msg.senderId?._id === user?.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/[0.07] text-slate-200 rounded-tl-none'}`}>
                            {msg.text}
                          </div>
                          <span className="text-[10px] text-slate-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))
                  )}
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
                <p className="text-xs text-slate-500 mb-3">{displayParticipants.length} participants</p>
                {displayParticipants.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <InitialsAvatar name={p.name} url={p.avatarUrl} className="w-9 h-9 text-sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {p.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Transcript/Captions Tab */}
            {sidebarTab === 'transcript' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
                <div className="flex items-center gap-2 mb-4 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-300">AI is transcribing in real-time via Whisper</p>
                </div>
                
                {transcript.length === 0 && !liveCaption ? (
                  <div className="flex-1 flex">
                    <EmptyState 
                      icon={Mic} 
                      title="Transcription will appear here" 
                      description="Live speech will be captured automatically once participants start speaking." 
                    />
                  </div>
                ) : (
                  <>
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
                  </>
                )}
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
