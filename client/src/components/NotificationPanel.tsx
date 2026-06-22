import { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, Sparkles, Users, FileText, Calendar, BellOff, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from '../lib/axios';
import { useAuthStore } from '../store/authStore';
import { EmptyState } from '../App';
import { toast } from 'sonner';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  resourceId?: string;
  createdAt: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  'meeting-summary': <Sparkles className="w-4 h-4 text-amber-400" />,
  'ai_summary_ready': <Sparkles className="w-4 h-4 text-amber-400" />,
  'task-assigned': <FileText className="w-4 h-4 text-blue-400" />,
  'task_assigned': <FileText className="w-4 h-4 text-blue-400" />,
  'mention': <Users className="w-4 h-4 text-purple-400" />,
  'meeting-invite': <Calendar className="w-4 h-4 text-emerald-400" />,
  'meeting_starting': <Calendar className="w-4 h-4 text-emerald-400" />,
  'action-item': <Check className="w-4 h-4 text-orange-400" />,
};

const typeBg: Record<string, string> = {
  'meeting-summary': 'bg-amber-500/10',
  'ai_summary_ready': 'bg-amber-500/10',
  'task-assigned': 'bg-blue-500/10',
  'task_assigned': 'bg-blue-500/10',
  'mention': 'bg-purple-500/10',
  'meeting-invite': 'bg-emerald-500/10',
  'meeting_starting': 'bg-emerald-500/10',
  'action-item': 'bg-orange-500/10',
};

const getRouteForNotification = (type: string, resourceId?: string): string => {
  switch (type) {
    case 'ai_summary_ready':
    case 'meeting-summary':
      return resourceId ? `/meetings/${resourceId}#summary` : '/history';
    case 'task_assigned':
    case 'task-assigned':
    case 'action-item':
      return resourceId ? `/workspace?task=${resourceId}` : '/board';
    case 'meeting_starting':
    case 'meeting-invite':
      return resourceId ? `/meetings/${resourceId}/lobby` : '/dashboard';
    case 'mention':
      return resourceId ? `/meetings/${resourceId}#chat` : '/dashboard';
    default:
      return '/dashboard';
  }
};

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export default function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await axios.get('/api/notifications?limit=20');
      return data;
    },
    enabled: !!user,
  });

  const notifications: Notification[] = data?.notifications || [];
  const unreadCount: number = data?.unreadCount || 0;

  // Real-time: socket connection for notification:new events
  useEffect(() => {
    if (!user) return;
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', { withCredentials: true });
    socket.on('connect', () => {
      socket.emit('join-user-room', user.id);
    });
    socket.on('notification:new', (notif: Notification) => {
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          notifications: [notif, ...old.notifications],
          unreadCount: (old.unreadCount || 0) + 1,
        };
      });
      toast(notif.title, { description: notif.message });
    });
    return () => { socket.disconnect(); };
  }, [user, queryClient]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => axios.patch(`/api/notifications/${id}/read`),
    onMutate: async (id) => {
      // Optimistic update
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old;
        const wasUnread = old.notifications.find((n: Notification) => n._id === id && !n.read);
        return {
          ...old,
          notifications: old.notifications.map((n: Notification) =>
            n._id === id ? { ...n, read: true } : n
          ),
          unreadCount: wasUnread ? Math.max(0, old.unreadCount - 1) : old.unreadCount,
        };
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => axios.put('/api/notifications/read-all'),
    onSuccess: () => {
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((n: Notification) => ({ ...n, read: true })),
          unreadCount: 0,
        };
      });
    },
    onError: () => toast.error('Failed to mark all as read'),
  });

  const handleNotificationClick = (notif: Notification) => {
    markAsReadMutation.mutate(notif._id);
    const route = getRouteForNotification(notif.type, notif.resourceId);
    setIsOpen(false);
    navigate(route);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/5"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-[380px] md:w-[420px] glass-card rounded-2xl overflow-hidden shadow-2xl shadow-black/40 z-50 border border-white/10">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h3 className="font-semibold text-white text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="p-1 text-slate-500 hover:text-white rounded transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[420px] overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-4 flex gap-3 border-b border-white/[0.03] animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-slate-700 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-700/60 rounded w-full" />
                    <div className="h-3 bg-slate-700/40 rounded w-1/4" />
                  </div>
                </div>
              ))
            ) : notifications.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  icon={BellOff}
                  title="You're all caught up"
                  description="New activity — mentions, summaries, and task updates — will show here."
                />
              </div>
            ) : (
              notifications.map(notif => (
                <button
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left px-5 py-4 flex gap-3 transition-colors border-b border-white/[0.03] ${
                    notif.read ? 'hover:bg-white/[0.02]' : 'bg-white/[0.03] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${typeBg[notif.type] || 'bg-slate-700/40'}`}>
                    {typeIcons[notif.type] || <Bell className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-white truncate">{notif.title}</p>
                      {!notif.read && <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
