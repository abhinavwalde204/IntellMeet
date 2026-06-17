import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Mic, MicOff, CameraOff, Settings, ChevronRight } from 'lucide-react';

export default function MeetingLobby() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [name, setName] = useState('');

  useEffect(() => {
    // Attempt to get user media
    const initMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error("Error accessing media devices", error);
        setIsVideoOn(false);
        setIsMicOn(false);
      }
    };
    initMedia();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOn;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isMicOn;
      });
      setIsMicOn(!isMicOn);
    }
  };

  const handleJoin = () => {
    // In a real app, we'd pass the stream or constraints to the next room
    navigate(`/room/${id}`, { state: { isMicOn, isVideoOn, name } });
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-card max-w-5xl w-full rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 lg:p-12 z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
        
        {/* Left: Video Preview */}
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/5 flex items-center justify-center">
            {isVideoOn ? (
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            ) : (
              <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700">
                <CameraOff className="w-7 h-7 md:w-10 md:h-10 text-slate-500" />
              </div>
            )}
            
            {/* Quick Controls overlay */}
            <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 md:gap-4 bg-slate-900/80 backdrop-blur px-4 md:px-6 py-2 md:py-3 rounded-2xl border border-white/10">
              <button 
                onClick={toggleAudio}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all ${isMicOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500 text-white hover:bg-red-600'}`}
              >
                {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              <button 
                onClick={toggleVideo}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all ${isVideoOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500 text-white hover:bg-red-600'}`}
              >
                {isVideoOn ? <Camera size={18} /> : <CameraOff size={18} />}
              </button>
              <button className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-all">
                <Settings size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Meeting Info & Join */}
        <div className="flex flex-col justify-center">
          <div className="mb-5 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">Ready to join?</h1>
            <p className="text-slate-400 text-sm md:text-base">Meeting ID: <span className="text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded-md ml-1 text-xs md:text-sm">{id || '123-456-789'}</span></p>
          </div>

          <div className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Your Display Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 md:py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-500 text-sm md:text-base"
              />
            </div>

            <button 
              onClick={handleJoin}
              disabled={!name.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-semibold py-3 md:py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group text-sm md:text-base"
            >
              Join Meeting
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
