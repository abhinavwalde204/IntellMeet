import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Plus, Mail, Shield, Copy, Check, Crown } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Member';
  avatar: string;
}

interface Workspace {
  id: string;
  name: string;
  description: string;
  members: Member[];
}

const DEMO_WORKSPACE: Workspace = {
  id: '1',
  name: 'IntellMeet Engineering',
  description: 'Core engineering team workspace for the IntellMeet platform.',
  members: [
    { id: '1', name: 'You (Demo User)', email: 'demo@intellmeet.com', role: 'Admin', avatar: '' },
    { id: '2', name: 'Sarah Miller', email: 'sarah@intellmeet.com', role: 'Member', avatar: '' },
    { id: '3', name: 'Mike Johnson', email: 'mike@intellmeet.com', role: 'Member', avatar: '' },
    { id: '4', name: 'Alex Chen', email: 'alex@intellmeet.com', role: 'Member', avatar: '' },
  ]
};

export default function TeamWorkspace() {
  const [workspace] = useState<Workspace>(DEMO_WORKSPACE);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setShowInvite(false);
      setInviteEmail('');
    }, 2000);
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/demo-token-xyz`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roleColors: Record<string, string> = {
    Admin: 'text-amber-400 bg-amber-500/10',
    Member: 'text-blue-400 bg-blue-500/10'
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute top-[-10%] left-[-5%] w-[30%] h-[30%] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="h-14 md:h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-slate-900/50 backdrop-blur z-20 sticky top-0">
        <div className="flex items-center gap-3 md:gap-4">
          <Link to="/dashboard" className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base md:text-lg font-semibold tracking-tight">Team Workspace</h1>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-3 md:px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Invite Member</span>
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-8 pb-28 md:pb-8 relative z-10">
        {/* Workspace Info */}
        <div className="glass-card rounded-2xl p-5 md:p-8 mb-6 md:mb-8">
          <div className="flex items-start gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-xl md:text-2xl font-bold flex-shrink-0 shadow-lg">
              {workspace.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1 truncate">{workspace.name}</h2>
              <p className="text-slate-400 text-sm mb-3 md:mb-4">{workspace.description}</p>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{workspace.members.length} members</span>
                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" />{workspace.members.filter(m => m.role === 'Admin').length} admin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Invite Link Card */}
        <div className="glass-card rounded-2xl p-4 md:p-6 mb-6 md:mb-8">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-400" /> Shareable Invite Link
          </h3>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/invite/demo-token-xyz`}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-slate-300 font-mono min-w-0"
            />
            <button
              onClick={copyInviteLink}
              className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors flex-shrink-0"
            >
              {copied ? <><Check className="w-4 h-4 text-emerald-400" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
            </button>
          </div>
        </div>

        {/* Members List */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" /> Team Members
            </h3>
          </div>
          <div className="divide-y divide-white/5">
            {workspace.members.map(member => (
              <div key={member.id} className="px-4 md:px-6 py-3 md:py-4 flex items-center gap-3 md:gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {member.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white flex items-center gap-2">
                    {member.name}
                    {member.role === 'Admin' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{member.email}</p>
                </div>
                <span className={`text-xs px-2 md:px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${roleColors[member.role]}`}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card rounded-2xl p-8 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-2">Invite Team Member</h2>
            <p className="text-sm text-slate-400 mb-6">Send an invitation to join the workspace.</p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || inviteSent}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all"
              >
                {inviteSent ? '✓ Invitation Sent!' : 'Send Invite'}
              </button>
              <button
                onClick={() => { setShowInvite(false); setInviteEmail(''); }}
                className="px-4 py-3 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
