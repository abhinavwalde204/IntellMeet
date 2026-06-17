import { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Sparkles, Users, FileText, Calendar } from 'lucide-react';

interface Notification {
  id: string;
  type: 'mention' | 'action-item' | 'meeting-invite' | 'task-assigned' | 'meeting-summary';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'meeting-summary',
    title: 'AI Summary Ready',
    message: 'Sprint Review meeting summary and 4 action items have been generated.',
    read: false,
    createdAt: new Date(Date.now() - 300000).toISOString(),
    link: '/history'
  },
  {
    id: '2',
    type: 'task-assigned',
    title: 'New Task Assigned',
    message: 'You were assigned "Set up GitHub Actions CI/CD" from Sprint Review.',
    read: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    link: '/board'
  },
  {
    id: '3',
    type: 'mention',
    title: '@mention in Sprint Review',
    message: 'Alex mentioned you: "...we need Mike to handle the CI/CD pipeline"',
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    link: '/history'
  },
  {
    id: '4',
    type: 'meeting-invite',
    title: 'Meeting Invitation',
    message: 'Sarah invited you to "Design Sync" tomorrow at 10:00 AM.',
    read: true,
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: '5',
    type: 'action-item',
    title: 'Action Item Due Tomorrow',
    message: '"Complete WebRTC signaling server" is due Thursday.',
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    link: '/board'
  },
  {
    id: '6',
    type: 'meeting-summary',
    title: 'AI Summary Ready',
    message: 'Design Sync meeting summary and 2 action items have been generated.',
    read: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    link: '/history'
  }
];

const typeIcons: Record<string, React.ReactNode> = {
  'meeting-summary': <Sparkles className="w-4 h-4 text-amber-400" />,
  'task-assigned': <FileText className="w-4 h-4 text-blue-400" />,
  'mention': <Users className="w-4 h-4 text-purple-400" />,
  'meeting-invite': <Calendar className="w-4 h-4 text-emerald-400" />,
  'action-item': <Check className="w-4 h-4 text-orange-400" />
};

const typeBg: Record<string, string> = {
  'meeting-summary': 'bg-amber-500/10',
  'task-assigned': 'bg-blue-500/10',
  'mention': 'bg-purple-500/10',
  'meeting-invite': 'bg-emerald-500/10',
  'action-item': 'bg-orange-500/10'
};

export default function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isOpen && !target.closest('[data-notification-panel]')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div className="relative" data-notification-panel>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/5"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-[400px] glass-card rounded-2xl overflow-hidden shadow-2xl shadow-black/40 z-50 border border-white/10">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h3 className="font-semibold text-white text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
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
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">No notifications</div>
            ) : (
              notifications.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`w-full text-left px-5 py-4 flex gap-3 transition-colors border-b border-white/[0.03] ${
                    notif.read ? 'hover:bg-white/[0.02]' : 'bg-white/[0.03] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${typeBg[notif.type]}`}>
                    {typeIcons[notif.type]}
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
