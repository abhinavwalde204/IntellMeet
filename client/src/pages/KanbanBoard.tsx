import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, GripVertical, MoreHorizontal, Calendar, ArrowLeft, Tag, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import api from '../lib/axios';
import socket from '../lib/socket';
import { useAuthStore } from '../store/authStore';

interface TaskItem {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeName: string;
  dueDate: string;
  meetingId?: { title: string; roomId: string } | null;
}

interface Workspace {
  _id: string;
  name: string;
}

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'bg-slate-500' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'in-review', title: 'In Review', color: 'bg-amber-500' },
  { id: 'done', title: 'Done', color: 'bg-emerald-500' },
];

const priorityColors: Record<string, string> = {
  low: 'text-slate-400 bg-slate-500/10',
  medium: 'text-amber-400 bg-amber-500/10',
  high: 'text-red-400 bg-red-500/10',
  urgent: 'text-rose-400 bg-rose-500/10',
};

export default function KanbanBoard() {
  const user = useAuthStore(state => state.user);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [newTaskBanner, setNewTaskBanner] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskColumn, setNewTaskColumn] = useState('backlog');
  const [newTitle, setNewTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch workspaces on mount
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await api.get('/workspaces');
        const ws: Workspace[] = res.data.workspaces;
        setWorkspaces(ws);
        if (ws.length > 0) setSelectedWorkspace(ws[0]._id);
      } catch {
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, []);

  // Fetch tasks whenever workspace selection changes
  const fetchTasks = useCallback(async () => {
    if (!selectedWorkspace) return;
    try {
      setLoading(true);
      const res = await api.get(`/tasks?workspaceId=${selectedWorkspace}`);
      setTasks(res.data.tasks);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Connect Socket.io and join workspace room for real-time task injection
  useEffect(() => {
    if (!selectedWorkspace) return;

    socket.connect();
    socket.emit('join-workspace', selectedWorkspace);

    const handleTasksCreated = (newTasks: TaskItem[]) => {
      setTasks(prev => {
        const existingIds = new Set(prev.map(t => t._id));
        const incoming = newTasks.filter(t => !existingIds.has(t._id));
        return incoming.length > 0 ? [...prev, ...incoming] : prev;
      });
      setNewTaskBanner(
        `✨ ${newTasks.length} action item${newTasks.length > 1 ? 's were' : ' was'} auto-extracted from a meeting and added to Backlog!`
      );
      setTimeout(() => setNewTaskBanner(null), 6000);
    };

    socket.on('tasks-created', handleTasksCreated);

    return () => {
      socket.off('tasks-created', handleTasksCreated);
      socket.disconnect();
    };
  }, [selectedWorkspace]);

  useEffect(() => {
    if (showNewTask && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showNewTask]);

  const handleDragStart = (taskId: string) => setDraggedTask(taskId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (columnId: string) => {
    if (!draggedTask) return;
    const prev = tasks;
    // Optimistic update
    setTasks(t => t.map(task => task._id === draggedTask ? { ...task, status: columnId } : task));
    setDraggedTask(null);
    try {
      await api.put(`/tasks/${draggedTask}`, { status: columnId });
    } catch {
      setTasks(prev); // rollback on failure
    }
  };

  const openNewTask = (columnId: string) => {
    setNewTaskColumn(columnId);
    setShowNewTask(true);
    setNewTitle('');
  };

  const addTask = async () => {
    if (!newTitle.trim() || !selectedWorkspace) return;
    try {
      const res = await api.post('/tasks', {
        title: newTitle,
        description: '',
        status: newTaskColumn,
        priority: 'medium',
        assigneeName: user?.name || '',
        workspaceId: selectedWorkspace,
      });
      setTasks(prev => [...prev, res.data.task]);
    } catch {
      // silently fail
    }
    setShowNewTask(false);
    setNewTitle('');
  };

  const getColumnTasks = (columnId: string) => tasks.filter(t => t.status === columnId);

  return (
    <div className="h-screen bg-[#0f172a] text-slate-100 flex flex-col overflow-hidden">
      {/* Ambient background */}
      <div className="absolute top-[-10%] left-[20%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* AI Action Items Banner */}
      {newTaskBanner && (
        <div className="relative z-50 bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-b border-amber-500/30 px-8 py-3 flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-200 font-medium">{newTaskBanner}</p>
          <button
            onClick={() => setNewTaskBanner(null)}
            className="ml-auto text-amber-400/60 hover:text-amber-400 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <header className="h-14 md:h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-slate-900/50 backdrop-blur z-20 flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/dashboard" className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base md:text-lg font-semibold tracking-tight">Task Board</h1>
          {workspaces.length > 1 && (
            <select
              value={selectedWorkspace}
              onChange={e => setSelectedWorkspace(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 md:px-3 py-1.5 text-xs md:text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[120px] md:max-w-none"
            >
              {workspaces.map(w => (
                <option key={w._id} value={w._id}>{w.name}</option>
              ))}
            </select>
          )}
          {workspaces.length === 1 && (
            <span className="text-xs md:text-sm text-slate-500 hidden sm:block">{workspaces[0]?.name}</span>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={fetchTasks}
            className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            title="Refresh tasks"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => openNewTask('backlog')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-medium flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Task</span>
          </button>
        </div>
      </header>

      {/* Board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading tasks...</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto p-3 md:p-6 pb-20 md:pb-6 relative z-10">
          <div className="flex gap-3 md:gap-6 h-full" style={{ minWidth: `${COLUMNS.length * 280}px` }}>
            {COLUMNS.map(column => {
              const columnTasks = getColumnTasks(column.id);
              return (
                <div
                  key={column.id}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(column.id)}
                  className="w-[260px] md:w-[300px] lg:w-[320px] flex flex-col flex-shrink-0"
                >
                  {/* Column Header */}
                  <div className="flex items-center gap-3 mb-4 px-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <h2 className="text-sm font-semibold text-slate-300">{column.title}</h2>
                    <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                      {columnTasks.length}
                    </span>
                    <button
                      onClick={() => openNewTask(column.id)}
                      className="ml-auto p-1 text-slate-500 hover:text-white transition-colors rounded"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Cards Container */}
                  <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                    {columnTasks.length === 0 && (
                      <div className="border-2 border-dashed border-white/5 rounded-xl p-6 text-center text-slate-600 text-xs">
                        Drop tasks here
                      </div>
                    )}
                    {columnTasks.map(task => (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={() => handleDragStart(task._id)}
                        className={`glass-card rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all hover:ring-1 hover:ring-white/10 group ${
                          draggedTask === task._id ? 'opacity-50 scale-95' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <GripVertical className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <p className="text-sm font-medium text-white flex-1 mx-2">{task.title}</p>
                          <button className="p-1 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity rounded">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>

                        {task.description && (
                          <p className="text-xs text-slate-400 mb-3 pl-6 line-clamp-2">{task.description}</p>
                        )}

                        <div className="flex items-center justify-between pl-6">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${priorityColors[task.priority]}`}>
                              {task.priority}
                            </span>
                            {task.meetingId?.title && (
                              <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5" />
                                {task.meetingId.title}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pl-6">
                          {task.dueDate && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                          {task.assigneeName && (
                            <div className="flex items-center gap-1.5 ml-auto">
                              <div
                                className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold"
                                title={task.assigneeName}
                              >
                                {task.assigneeName[0]}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Inline New Task Form */}
                    {showNewTask && newTaskColumn === column.id && (
                      <div className="glass-card rounded-xl p-4">
                        <input
                          ref={inputRef}
                          type="text"
                          value={newTitle}
                          onChange={e => setNewTitle(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addTask()}
                          placeholder="Task title..."
                          className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none mb-3"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={addTask}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setShowNewTask(false)}
                            className="text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state when no workspace */}
      {!loading && workspaces.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-500">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
            <Tag className="w-8 h-8" />
          </div>
          <div className="text-center">
            <p className="font-medium text-slate-300 mb-1">No Workspace Found</p>
            <p className="text-sm">Create a workspace from the Team page to start managing tasks.</p>
          </div>
          <Link
            to="/team"
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Go to Team Workspace
          </Link>
        </div>
      )}
    </div>
  );
}
