import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Search, Plus, Bell, Settings, ChevronDown, MoreHorizontal, Filter,
  CalendarDays, MessageSquare, Paperclip, CheckCircle2,
  LayoutDashboard, Layers3, Users, Archive, Sparkles, SlidersHorizontal,
  X, Clock3, Zap, Menu, Share2, Copy, Check, BellRing
} from 'lucide-react'
import {
  DndContext, DragOverlay, PointerSensor, closestCorners,
  useDroppable, useSensor, useSensors
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const API_BASE = 'http://localhost:5000/api'

const initialTasks = {
  todo: [
    { id: 't1', title: 'Research competitor onboarding flows', tag: 'Research', priority: 'High', due: 'Today', avatar: 'AS', comments: 4, files: 2 },
    { id: 't2', title: 'Create mobile navigation concepts', tag: 'Design', priority: 'Medium', due: 'Sep 15', avatar: 'MK', comments: 2, files: 1 },
    { id: 't3', title: 'Define workspace permissions', tag: 'Product', priority: 'Low', due: 'Sep 17', avatar: 'RJ', comments: 6, files: 0 }
  ],
  progress: [
    { id: 't4', title: 'Build authentication screens', tag: 'Frontend', priority: 'High', due: 'Tomorrow', avatar: 'SK', comments: 8, files: 3 },
    { id: 't5', title: 'Set up API error states', tag: 'Backend', priority: 'Medium', due: 'Sep 16', avatar: 'NP', comments: 3, files: 1 },
    { id: 't6', title: 'Polish empty states', tag: 'Design', priority: 'Low', due: 'Sep 18', avatar: 'AS', comments: 1, files: 0 }
  ],
  review: [
    { id: 't7', title: 'Kanban board interaction spec', tag: 'Product', priority: 'High', due: 'Today', avatar: 'MK', comments: 9, files: 4 },
    { id: 't8', title: 'Responsive dashboard layout', tag: 'Frontend', priority: 'Medium', due: 'Sep 14', avatar: 'RJ', comments: 5, files: 2 }
  ],
  done: [
    { id: 't9', title: 'Create project workspace', tag: 'Setup', priority: 'Done', due: 'Completed', avatar: 'SK', comments: 3, files: 1 },
    { id: 't10', title: 'Set up design system', tag: 'Design', priority: 'Done', due: 'Completed', avatar: 'NP', comments: 7, files: 5 }
  ]
}

const columns = [
  { id: 'todo', title: 'To Do', color: 'violet' },
  { id: 'progress', title: 'In Progress', color: 'blue' },
  { id: 'review', title: 'Review', color: 'amber' },
  { id: 'done', title: 'Done', color: 'green' }
]

function Avatar({ text, small = false }) {
  return <span className={`avatar ${small ? 'small' : ''}`}>{text || 'ME'}</span>
}

function taskFromApi(task) {
  const avatar = task.assignee?.trim() || 'ME'
  return {
    ...task,
    id: task._id,
    avatar,
    comments: task.comments || 0,
    files: task.files || 0,
    statusLabel: columns.find(c => c.id === task.status)?.title || task.status
  }
}

function taskToCreatePayload(task, status) {
  return {
    title: task.title,
    description: task.description || '',
    status,
    priority: task.priority || 'Medium',
    tag: task.tag || 'Product',
    due: task.due || 'No due date',
    assignee: task.avatar || ''
  }
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`)
  }
  return data
}

async function createDemoTasks(boardId) {
  const created = []
  for (const column of columns) {
    for (const task of initialTasks[column.id]) {
      const response = await apiRequest(`/tasks/board/${boardId}`, {
        method: 'POST',
        body: JSON.stringify(taskToCreatePayload(task, column.id))
      })
      created.push(taskFromApi(response.data))
    }
  }
  return created
}

function tasksToState(taskList) {
  const next = { todo: [], progress: [], review: [], done: [] }
  for (const task of [...taskList].sort((a, b) => a.position - b.position)) {
    if (next[task.status]) next[task.status].push(task)
  }
  return next
}

function TaskCard({ task, onOpen, onMenu }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task)}
    >
      <div className="task-top">
        <span className={`tag ${(task.tag || 'Product').toLowerCase()}`}>{task.tag || 'Product'}</span>
        <button
          className="icon-btn ghost"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onMenu(task) }}
        >
          <MoreHorizontal size={17}/>
        </button>
      </div>
      <h3>{task.title}</h3>
      <div className="task-meta">
        <span className={`priority ${(task.priority || 'Medium').toLowerCase()}`}><span/> {task.priority || 'Medium'}</span>
        <span><Clock3 size={14}/> {task.due || 'No due date'}</span>
      </div>
      <div className="task-footer">
        <Avatar text={task.avatar} small/>
        <div className="task-stats">
          <span><MessageSquare size={14}/> {task.comments || 0}</span>
          <span><Paperclip size={14}/> {task.files || 0}</span>
        </div>
      </div>
    </article>
  )
}

function Column({ column, tasks, onAdd, onOpen, onColumnMenu, onTaskMenu }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  return (
    <section ref={setNodeRef} className={`kanban-column ${isOver ? 'over' : ''}`}>
      <div className="column-head">
        <div className="column-title">
          <span className={`status-dot ${column.color}`}/>
          <h2>{column.title}</h2>
          <span className="count">{tasks.length}</span>
        </div>
        <button className="icon-btn ghost" onClick={() => onColumnMenu(column)}><MoreHorizontal size={18}/></button>
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="cards">
          {tasks.map(task => <TaskCard key={task.id} task={task} onOpen={onOpen} onMenu={onTaskMenu}/>) }
        </div>
      </SortableContext>
      <button className="add-card" onClick={() => onAdd(column.id)}><Plus size={17}/> Add task</button>
    </section>
  )
}

function Modal({ task, onClose, onSave, onDelete, saving }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('todo')
  const [priority, setPriority] = useState('Medium')
  const [tag, setTag] = useState('Product')
  const [due, setDue] = useState('No due date')
  const [assignee, setAssignee] = useState('ME')

  useEffect(() => {
    setTitle(task?.title || '')
    setDescription(task?.description || '')
    setStatus(task?.status || 'todo')
    setPriority(task?.priority || 'Medium')
    setTag(task?.tag || 'Product')
    setDue(task?.due || 'No due date')
    setAssignee(task?.avatar || task?.assignee || 'ME')
  }, [task])

  if (!task) return null

  const selectedColumn = columns.find(column => column.id === status)

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">TASK DETAILS</span>
            <h2>{task.isNew ? 'Add task' : 'Edit task'}</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={20}/></button>
        </div>

        <label>
          Title
          <input value={title} onChange={e => setTitle(e.target.value)} autoFocus placeholder="Enter task title"/>
        </label>

        <label>
          Description
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add context, links, acceptance criteria..."/>
        </label>

        <div className="modal-grid">
          <label>
            <span className="field-label">Status</span>
            <select className="fake-select-input" value={status} onChange={e => setStatus(e.target.value)}>
              {columns.map(column => (
                <option key={column.id} value={column.id}>{column.title}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="field-label">Priority</span>
            <select className="fake-select-input" value={priority} onChange={e => setPriority(e.target.value)}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Done</option>
            </select>
          </label>

          <label>
            <span className="field-label">Tag</span>
            <select className="fake-select-input" value={tag} onChange={e => setTag(e.target.value)}>
              <option>Product</option>
              <option>Research</option>
              <option>Design</option>
              <option>Frontend</option>
              <option>Backend</option>
              <option>Setup</option>
            </select>
          </label>

          <label>
            <span className="field-label">Due</span>
            <select className="fake-select-input" value={due} onChange={e => setDue(e.target.value)}>
              <option>No due date</option>
              <option>Today</option>
              <option>Tomorrow</option>
              <option>Sep 14</option>
              <option>Sep 15</option>
              <option>Sep 16</option>
              <option>Sep 17</option>
              <option>Sep 18</option>
            </select>
          </label>

          <label>
            <span className="field-label">Assignee</span>
            <input value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="Initials"/>
          </label>
        </div>

        <div style={{fontSize:11, color:'#777b8d', marginTop:4}}>
          This task will be saved to <strong>{selectedColumn?.title || 'To Do'}</strong> and then appear on the board.
        </div>

        <div className="modal-actions">
          {!task.isNew && (
            <button className="btn secondary danger" onClick={() => onDelete(task.id)} disabled={saving}>Delete</button>
          )}
          <div>
            <button className="btn secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button
              className="btn primary"
              onClick={() => onSave({
                ...task,
                title,
                description,
                status,
                statusLabel: selectedColumn?.title || 'To Do',
                priority,
                tag,
                due,
                avatar: assignee,
                assignee
              })}
              disabled={saving || !title.trim()}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Panel({ title, icon: Icon, children, onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{display:'flex', gap:10, alignItems:'center'}}><Icon size={20}/><h2 style={{margin:0}}>{title}</h2></div>
          <button className="icon-btn" onClick={onClose}><X size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function App() {
  const [tasks, setTasks] = useState({ todo: [], progress: [], review: [], done: [] })
  const tasksRef = useRef(tasks)
  const [activeId, setActiveId] = useState(null)
  const [search, setSearch] = useState('')
  const [modalTask, setModalTask] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filter, setFilter] = useState('All tasks')
  const [workspace, setWorkspace] = useState(null)
  const [board, setBoard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState('board')
  const [panel, setPanel] = useState(null)
  const [taskMenu, setTaskMenu] = useState(null)
  const [columnMenu, setColumnMenu] = useState(null)
  const [copied, setCopied] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function replaceTasks(next) {
    tasksRef.current = next
    setTasks(next)
  }

  useEffect(() => {
  let cancelled = false

  async function loadBoard() {
    try {
      setLoading(true)
      setError('')

      // 1. Get workspace
      const workspaceResponse = await apiRequest('/workspaces')

      let activeWorkspace = workspaceResponse.data?.[0]

      if (!activeWorkspace) {
        const createdWorkspace = await apiRequest('/workspaces', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Acme Studio',
            description: 'Collaborative Kanban workspace'
          })
        })

        activeWorkspace = createdWorkspace.data
      }

      // 2. Get board
      const boardResponse = await apiRequest(
        `/boards/workspace/${activeWorkspace._id}`
      )

      let activeBoard = boardResponse.data?.[0]

      if (!activeBoard) {
        const createdBoard = await apiRequest(
          `/boards/workspace/${activeWorkspace._id}`,
          {
            method: 'POST',
            body: JSON.stringify({
              name: 'Product launch',
              description: 'Product launch planning board',
              columns
            })
          }
        )

        activeBoard = createdBoard.data
      }

      // IMPORTANT: store board BEFORE anything else
      if (cancelled) return

      setWorkspace(activeWorkspace)
      setBoard(activeBoard)

      // 3. Get tasks directly
      const taskResponse = await apiRequest(
        `/tasks/board/${activeBoard._id}`
      )

      let apiTasks = (taskResponse.data || []).map(taskFromApi)

      // 4. Only create demo tasks if board is genuinely empty
      if (apiTasks.length === 0) {
        try {
          apiTasks = await createDemoTasks(activeBoard._id)
        } catch (demoError) {
          console.error('Demo task creation failed:', demoError)
          apiTasks = []
        }
      }

      if (cancelled) return

      replaceTasks(tasksToState(apiTasks))

    } catch (err) {
      console.error('BOARD LOAD ERROR:', err)
      if (!cancelled) {
        setError(err.message || 'Failed to load the Kanban board')
      }
    } finally {
      if (!cancelled) {
        setLoading(false)
      }
    }
  }

  loadBoard()

  return () => {
    cancelled = true
  }
}, [])
  const allTasks = useMemo(() => Object.values(tasks).flat(), [tasks])
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const out = {}
    for (const c of columns) {
      out[c.id] = tasks[c.id].filter(t =>
        (!q || t.title.toLowerCase().includes(q) || (t.tag || '').toLowerCase().includes(q)) &&
        (filter === 'All tasks' || t.priority === filter || t.tag === filter)
      )
    }
    return out
  }, [tasks, search, filter])

  function handleDragStart(e) { setActiveId(e.active.id) }

  function handleDragOver(e) {
    const { active, over } = e
    if (!over) return
    const current = tasksRef.current
    const from = columns.find(c => current[c.id].some(t => t.id === active.id))?.id
    const to = current[over.id] ? over.id : columns.find(c => current[c.id].some(t => t.id === over.id))?.id
    if (!from || !to || from === to) return
    const activeTask = current[from].find(t => t.id === active.id)
    if (!activeTask) return
    const fromList = current[from].filter(t => t.id !== active.id)
    const toList = [...current[to]]
    const overIndex = toList.findIndex(t => t.id === over.id)
    toList.splice(overIndex < 0 ? toList.length : overIndex, 0, { ...activeTask, status: to, statusLabel: columns.find(c => c.id === to)?.title })
    replaceTasks({ ...current, [from]: fromList, [to]: toList })
  }

  async function handleDragEnd(e) {
    const { active, over } = e
    setActiveId(null)
    if (!over) return
    const current = tasksRef.current
    const container = columns.find(c => current[c.id].some(t => t.id === active.id))?.id
    const overContainer = current[over.id] ? over.id : columns.find(c => current[c.id].some(t => t.id === over.id))?.id
    if (!container || !overContainer) return
    let next = current
    if (container === overContainer) {
      const list = current[container]
      const oldIndex = list.findIndex(t => t.id === active.id)
      const newIndex = list.findIndex(t => t.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        next = { ...current, [container]: arrayMove(list, oldIndex, newIndex) }
        replaceTasks(next)
      }
    }
    const finalList = next[overContainer] || []
    const position = Math.max(0, finalList.findIndex(t => t.id === active.id))
    const movedTask = finalList.find(t => t.id === active.id)
    if (!movedTask) return
    try {
      await apiRequest(`/tasks/${movedTask.id}/move`, { method: 'PATCH', body: JSON.stringify({ status: overContainer, position }) })
    } catch (err) {
      setError(err.message || 'Could not save task position')
    }
  }

  function addTask(columnId) {
    setError('')
    setModalTask({
      id: null,
      isNew: true,
      title: '',
      description: '',
      status: columnId,
      statusLabel: columns.find(c => c.id === columnId)?.title || 'To Do',
      priority: 'Medium',
      tag: 'Product',
      due: 'No due date',
      avatar: 'ME',
      comments: 0,
      files: 0
    })
  }

  async function saveTask(updated) {
  const title = (updated.title || '').trim();

  if (!title) {
    setError('Task title is required');
    return;
  }

if (!board?._id) {
  setError('Board ID missing. Refresh the page once.')
  return
}

  try {
    setSaving(true);
    setError('');

    if (updated.isNew) {
      await apiRequest(`/tasks/board/${board._id}`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: updated.description || '',
          status: updated.status || 'todo',
          priority: updated.priority || 'Medium',
          tag: updated.tag || 'Product',
          due: updated.due || 'No due date',
          assignee: updated.assignee || updated.avatar || ''
        })
      });
    } else {
      const oldColumn = columns.find(column =>
        tasksRef.current[column.id].some(task => task.id === updated.id)
      )?.id;

      const newColumn = updated.status || oldColumn || 'todo';

      await apiRequest(`/tasks/${updated.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title,
          description: updated.description || '',
          priority: updated.priority || 'Medium',
          tag: updated.tag || 'Product',
          due: updated.due || 'No due date',
          assignee: updated.assignee || updated.avatar || ''
        })
      });

      if (oldColumn && oldColumn !== newColumn) {
        await apiRequest(`/tasks/${updated.id}/move`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: newColumn,
            position: tasksRef.current[newColumn].length
          })
        });
      }
    }

    // IMPORTANT:
    // Reload the actual data from MongoDB after save.
    const response = await apiRequest(`/boards/${board._id}`);
    const serverTasks = (response.data?.tasks || []).map(taskFromApi);

    replaceTasks(tasksToState(serverTasks));
    setModalTask(null);

  } catch (err) {
    setError(err.message || 'Could not save task');
  } finally {
    setSaving(false);
  }
}

  async function deleteTask(taskId) {
    if (!taskId) {
      setModalTask(null)
      return
    }
    try {
      setSaving(true)
      await apiRequest(`/tasks/${taskId}`, { method: 'DELETE' })
      const current = tasksRef.current
      const next = {}
      for (const c of columns) next[c.id] = current[c.id].filter(t => t.id !== taskId)
      replaceTasks(next)
      setModalTask(null)
      setTaskMenu(null)
    } catch (err) {
      setError(err.message || 'Could not delete task')
    } finally {
      setSaving(false)
    }
  }

  function duplicateTask(task) {
    setTaskMenu(null)
    setModalTask({
      ...task,
      id: null,
      isNew: true,
      title: `${task.title} (copy)`,
      status: task.status || 'todo',
      statusLabel: columns.find(column => column.id === (task.status || 'todo'))?.title || 'To Do'
    })
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const activeTask = activeId ? allTasks.find(t => t.id === activeId) : null
  const done = tasks.done.length
  const total = allTasks.length
  const completion = total ? Math.round(done / total * 100) : 0

  if (loading) {
    return <div className="app-shell" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}><div><strong>Loading your board...</strong></div></div>
  }

  const listItems = columns.flatMap(c => filtered[c.id].map(task => ({ ...task, columnTitle: c.title })))

  return (
    <div className="app-shell" onClick={() => { setTaskMenu(null); setColumnMenu(null) }}>
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="brand"><div className="brand-mark"><Layers3 size={19}/></div><span>flowboard</span><button className="mobile-close" onClick={() => setSidebarOpen(false)}><X size={18}/></button></div>
        <button className="workspace-switch" onClick={() => setPanel('workspace')}><div className="workspace-icon">{(workspace?.name || 'A').slice(0, 1).toUpperCase()}</div><div><small>Workspace</small><strong>{workspace?.name || 'Acme Studio'}</strong></div><ChevronDown size={16}/></button>
        <nav>
          <div className="nav-label">Workspace</div>
          <button className={`nav-button ${panel === null && view === 'board' ? 'active' : ''}`} onClick={() => { setView('board'); setPanel(null); setSidebarOpen(false) }}><LayoutDashboard size={18}/> Overview</button>
          <button className="nav-button" onClick={() => setPanel('boards')}><Layers3 size={18}/> My boards <span className="nav-count">1</span></button>
          <button className="nav-button" onClick={() => setPanel('members')}><Users size={18}/> Members <span className="nav-count">12</span></button>
          <button className="nav-button" onClick={() => setPanel('archive')}><Archive size={18}/> Archive</button>
          <div className="nav-label second">Your boards</div>
          <button className="nav-button" onClick={() => { setView('board'); setPanel(null); setSidebarOpen(false) }}><span className="mini-dot purple"/> {board?.name || 'Product launch'}</button>
          <button className="nav-button" onClick={() => setPanel('boards')}><span className="mini-dot blue"/> Mobile app</button>
          <button className="nav-button" onClick={() => setPanel('boards')}><span className="mini-dot orange"/> Marketing site</button>
        </nav>
        <div className="sidebar-bottom"><button className="pro-card" onClick={() => setPanel('settings')}><Sparkles size={17}/><div><strong>Pro workspace</strong><span>Unlock advanced features</span></div><ChevronDown size={15}/></button><button className="user-row" onClick={() => setPanel('account')}><Avatar text="MS"/><div><strong>My account</strong><span>shreya@example.com</span></div><MoreHorizontal size={18}/></button></div>
      </aside>

      <main className="main" onClick={e => e.stopPropagation()}>
        <header className="topbar">
          <button className="icon-btn mobile-menu" onClick={() => setSidebarOpen(true)}><Menu size={21}/></button>
          <div className="breadcrumbs"><button onClick={() => setPanel('boards')}><span>My boards</span></button><span>/</span><strong>{board?.name || 'Product launch'}</strong></div>
          <div className="top-actions">
            <div className="search"><Search size={17}/><input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}/><kbd>⌘ K</kbd></div>
            <button className="icon-btn" onClick={() => setPanel('notifications')}><Bell size={18}/><i/></button>
            <button className="icon-btn" onClick={() => setPanel('settings')}><Settings size={18}/></button>
            <button className="icon-btn" onClick={() => setPanel('account')}><Avatar text="MS"/></button>
          </div>
        </header>

        <div className="content">
          {error && <div className="error-banner"><span>{error}</span><button onClick={() => setError('')}><X size={16}/></button></div>}
          <div className="hero">
            <div>
              <div className="eyebrow"><span className="live-dot"/> PRODUCT LAUNCH</div>
              <h1>Build something people love.</h1>
              <p>Plan, prioritize and ship your next big thing with the team.</p>
            </div>
            <div className="hero-actions"><button className="btn secondary" onClick={() => setPanel('share')}><Share2 size={16}/> Share</button><button className="btn primary" onClick={() => addTask('todo')} disabled={saving}><Plus size={17}/> Add task</button></div>
          </div>

          <div className="stats-row">
            <button className="stat" onClick={() => setFilter('Done')}><span className="stat-icon purple"><CheckCircle2 size={18}/></span><div><span>Completed</span><strong>{done} <em>of {total}</em></strong></div></button>
            <button className="stat" onClick={() => { setFilter('All tasks'); setView('board'); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }) }}><span className="stat-icon blue"><Zap size={18}/></span><div><span>In progress</span><strong>{tasks.progress.length}</strong></div></button>
            <button className="stat" onClick={() => setFilter('All tasks')}><span className="stat-icon orange"><CalendarDays size={18}/></span><div><span>Due today</span><strong>{allTasks.filter(t => t.due === 'Today').length}</strong></div></button>
            <div className="progress-stat"><div><span>Board progress</span><strong>{completion}%</strong></div><div className="progress-bar"><i style={{ width: `${completion}%` }}/></div></div>
          </div>

          <div className="toolbar">
            <div className="view-tabs">
              <button className={view === 'board' ? 'selected' : ''} onClick={() => setView('board')}>Board</button>
              <button className={view === 'list' ? 'selected' : ''} onClick={() => setView('list')}>List</button>
              <button className={view === 'timeline' ? 'selected' : ''} onClick={() => setView('timeline')}>Timeline</button>
            </div>
            <div className="filters">
              <button className="filter-btn" onClick={() => setPanel('filters')}><Filter size={15}/> Filters</button>
              <div className="filter-wrap"><SlidersHorizontal size={15}/><select value={filter} onChange={e => setFilter(e.target.value)}><option>All tasks</option><option>High</option><option>Medium</option><option>Low</option><option>Design</option><option>Frontend</option><option>Done</option></select></div>
              <button className="member-stack" onClick={() => setPanel('members')}><Avatar text="AS" small/><Avatar text="MK" small/><Avatar text="RJ" small/><span>+3</span></button>
            </div>
          </div>

          {view === 'board' && (
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
              <div className="board">
                {columns.map(c => <Column key={c.id} column={c} tasks={filtered[c.id]} onAdd={addTask} onOpen={setModalTask} onColumnMenu={setColumnMenu} onTaskMenu={setTaskMenu}/>) }
              </div>
              <DragOverlay>{activeTask ? <TaskCard task={activeTask} onOpen={() => setModalTask(activeTask)} onMenu={() => {}}/> : null}</DragOverlay>
            </DndContext>
          )}

          {view === 'list' && (
            <div className="board" style={{ display: 'block' }}>
              {listItems.map(task => (
                <button key={task.id} onClick={() => setModalTask(task)} style={{ width:'100%', display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr auto', gap:12, alignItems:'center', padding:'16px 18px', marginBottom:10, border:'1px solid #e6e8ef', borderRadius:14, background:'#fff', textAlign:'left', cursor:'pointer' }}>
                  <span><strong>{task.title}</strong><small style={{display:'block', marginTop:4, opacity:.65}}>{task.tag || 'Product'}</small></span>
                  <span>{task.columnTitle}</span><span>{task.priority}</span><span>{task.due}</span><Avatar text={task.avatar} small/>
                </button>
              ))}
              {!listItems.length && <div style={{padding:40, textAlign:'center'}}>No tasks match your search/filter.</div>}
            </div>
          )}

          {view === 'timeline' && (
            <div className="board" style={{ display:'block' }}>
              {listItems.map((task, index) => (
                <button key={task.id} onClick={() => setModalTask(task)} style={{ width:'100%', display:'grid', gridTemplateColumns:'150px 1fr 120px', gap:16, alignItems:'center', padding:'16px 18px', marginBottom:10, border:'1px solid #e6e8ef', borderRadius:14, background:'#fff', textAlign:'left', cursor:'pointer' }}>
                  <span><small style={{opacity:.65}}>{task.columnTitle}</small><strong style={{display:'block', marginTop:5}}>{task.due}</strong></span>
                  <span><strong>{task.title}</strong><small style={{display:'block', marginTop:4, opacity:.65}}>{task.tag || 'Product'} · {task.priority}</small></span>
                  <span style={{textAlign:'right'}}><Avatar text={task.avatar} small/></span>
                </button>
              ))}
              {!listItems.length && <div style={{padding:40, textAlign:'center'}}>No tasks match your search/filter.</div>}
            </div>
          )}
        </div>
      </main>

      {taskMenu && (
        <div style={{position:'fixed', zIndex:50, right:24, top:120, width:190, background:'#fff', border:'1px solid #e8eaf0', borderRadius:14, boxShadow:'0 18px 50px rgba(15,23,42,.14)', padding:8}} onClick={e => e.stopPropagation()}>
          <button style={menuButtonStyle} onClick={() => { setModalTask(taskMenu); setTaskMenu(null) }}>Edit task</button>
          <button style={menuButtonStyle} onClick={() => duplicateTask(taskMenu)}>Duplicate</button>
          <button style={{...menuButtonStyle, color:'#dc2626'}} onClick={() => deleteTask(taskMenu.id)}>Delete</button>
        </div>
      )}

      {columnMenu && (
        <div style={{position:'fixed', zIndex:50, right:24, top:120, width:190, background:'#fff', border:'1px solid #e8eaf0', borderRadius:14, boxShadow:'0 18px 50px rgba(15,23,42,.14)', padding:8}} onClick={e => e.stopPropagation()}>
          <button style={menuButtonStyle} onClick={() => { addTask(columnMenu.id); setColumnMenu(null) }}>Add task</button>
          <button style={menuButtonStyle} onClick={() => { setFilter(columnMenu.id === 'done' ? 'Done' : 'All tasks'); setColumnMenu(null) }}>Focus column</button>
        </div>
      )}

      <Modal task={modalTask} onClose={() => setModalTask(null)} onSave={saveTask} onDelete={deleteTask} saving={saving}/>

      {panel === 'share' && <Panel title="Share board" icon={Share2} onClose={() => setPanel(null)}><p style={{opacity:.75}}>Share this board with teammates.</p><div style={{display:'flex', gap:8}}><input readOnly value={window.location.href} style={{flex:1}}/><button className="btn primary" onClick={copyShareLink}>{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? 'Copied' : 'Copy link'}</button></div></Panel>}
      {panel === 'notifications' && <Panel title="Notifications" icon={BellRing} onClose={() => setPanel(null)}><div style={{padding:'10px 0'}}><strong>All caught up</strong><p style={{opacity:.65}}>No new notifications for this workspace.</p></div></Panel>}
      {panel === 'settings' && <Panel title="Settings" icon={Settings} onClose={() => setPanel(null)}><label>Workspace name<input value={workspace?.name || ''} readOnly/></label><label style={{marginTop:12}}>Board name<input value={board?.name || ''} readOnly/></label><p style={{opacity:.65, marginTop:16}}>Backend and MongoDB are connected. Configuration can be expanded here later.</p></Panel>}
      {panel === 'boards' && <Panel title="My boards" icon={Layers3} onClose={() => setPanel(null)}><button style={boardPanelButton} onClick={() => setPanel(null)}><span className="mini-dot purple"/> {board?.name || 'Product launch'} <span style={{marginLeft:'auto'}}>Current</span></button><button style={boardPanelButton} onClick={() => setPanel(null)}><span className="mini-dot blue"/> Mobile app</button><button style={boardPanelButton} onClick={() => setPanel(null)}><span className="mini-dot orange"/> Marketing site</button></Panel>}
      {panel === 'members' && <Panel title="Members" icon={Users} onClose={() => setPanel(null)}>{['AS','MK','RJ','SK','NP'].map((person, i) => <div key={person} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0'}}><Avatar text={person}/><div><strong>{person}</strong><div style={{opacity:.6,fontSize:13}}>{i === 0 ? 'Owner' : 'Member'}</div></div></div>)}</Panel>}
      {panel === 'archive' && <Panel title="Archive" icon={Archive} onClose={() => setPanel(null)}><p style={{opacity:.7}}>No archived tasks on this board.</p></Panel>}
      {panel === 'account' && <Panel title="My account" icon={Users} onClose={() => setPanel(null)}><div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}><Avatar text="MS"/><div><strong>shreya@example.com</strong><div style={{opacity:.65}}>Workspace member</div></div></div><button className="btn secondary" onClick={() => setPanel(null)}>Close</button></Panel>}
      {panel === 'workspace' && <Panel title="Workspace" icon={Layers3} onClose={() => setPanel(null)}><p><strong>{workspace?.name || 'Acme Studio'}</strong></p><p style={{opacity:.65}}>Collaborative Kanban workspace connected to MongoDB.</p><button className="btn secondary" onClick={() => setPanel(null)}>Done</button></Panel>}
      {panel === 'filters' && <Panel title="Filters" icon={Filter} onClose={() => setPanel(null)}><p style={{opacity:.7}}>Choose a filter:</p><div style={{display:'grid',gap:8}}>{['All tasks','High','Medium','Low','Design','Frontend','Done'].map(value => <button key={value} style={{...menuButtonStyle, border:'1px solid #e8eaf0', borderRadius:10}} onClick={() => { setFilter(value); setPanel(null) }}>{value}{filter === value ? ' ✓' : ''}</button>)}</div></Panel>}
    </div>
  )
}

const menuButtonStyle = { width:'100%', textAlign:'left', background:'transparent', border:0, padding:'10px 12px', borderRadius:9, cursor:'pointer', fontSize:14 }
const boardPanelButton = { width:'100%', display:'flex', alignItems:'center', gap:10, padding:'12px 10px', marginBottom:8, border:'1px solid #e8eaf0', background:'#fff', borderRadius:10, cursor:'pointer', textAlign:'left' }
