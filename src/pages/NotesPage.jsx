import React, { useEffect, useState } from 'react';
import { 
  NotebookText, 
  Star, 
  MoreVertical,
  Plus,
  Search,
  Folder,
  Tag,
  Clock,
  Lightbulb
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import backendService from '../services/backendService';

const NotesPage = () => {
  const navigate = useNavigate();
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/dashboard');
  };
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: 'work',
    isPinned: false
  });

  const categories = [
    { id: 'all', label: 'All Notes', icon: NotebookText },
    { id: 'work', label: 'Work', icon: Folder },
    { id: 'personal', label: 'Personal', icon: Star },
    { id: 'ideas', label: 'Ideas', icon: Lightbulb }
  ];

  const noteColors = {
    work: 'bg-blue-50',
    personal: 'bg-green-50',
    ideas: 'bg-purple-50',
    study: 'bg-amber-50',
    general: 'bg-slate-50',
    other: 'bg-gray-50',
  };

  const normalizeNote = (note) => ({
    id: note._id || note.id || `note-${Date.now()}`,
    title: note.title || 'Untitled note',
    content: note.content || '',
    category: note.category || 'work',
    isPinned: Boolean(note.isPinned),
    createdAt: note.createdAt
      ? new Date(note.createdAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    color: noteColors[note.category] || 'bg-gray-50',
  });

  useEffect(() => {
    let isCancelled = false;

    const loadNotes = async () => {
      try {
        const payload = await backendService.getNotes();
        if (!isCancelled) {
          const normalizedNotes = Array.isArray(payload) ? payload.map(normalizeNote) : [];
          setNotes(normalizedNotes);
        }
      } catch (error) {
        console.error('Failed to load notes from backend:', error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadNotes();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleCreateNote = async () => {
    const trimmedTitle = newNote.title.trim();
    const trimmedContent = newNote.content.trim();

    if (!trimmedTitle || !trimmedContent) return;

    try {
      const created = await backendService.createNote({
        title: trimmedTitle,
        content: trimmedContent,
        category: newNote.category,
        isPinned: Boolean(newNote.isPinned),
      });
      setNotes((prev) => [normalizeNote(created), ...prev]);
      setShowNewNoteModal(false);
      setNewNote({ title: '', content: '', category: 'work', isPinned: false });
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleDeleteNote = async (id) => {
    const snapshot = notes.find((note) => String(note.id) === String(id));
    setNotes((prev) => prev.filter((note) => String(note.id) !== String(id)));

    try {
      await backendService.deleteNote(id);
    } catch (error) {
      console.error('Failed to delete note:', error);
      if (snapshot) {
        setNotes((prev) => [snapshot, ...prev]);
      }
    }
  };

  const handleTogglePin = async (id) => {
    const current = notes.find((note) => String(note.id) === String(id));
    if (!current) return;

    const nextPinned = !current.isPinned;
    setNotes((prev) =>
      prev.map((note) =>
        String(note.id) === String(id) ? { ...note, isPinned: nextPinned } : note
      )
    );

    try {
      const updated = await backendService.updateNote(id, { isPinned: nextPinned });
      const normalized = normalizeNote(updated);
      setNotes((prev) =>
        prev.map((note) => (String(note.id) === String(id) ? normalized : note))
      );
    } catch (error) {
      console.error('Failed to update note pin state:', error);
      setNotes((prev) =>
        prev.map((note) =>
          String(note.id) === String(id) ? { ...note, isPinned: current.isPinned } : note
        )
      );
    }
  };

  const filteredNotes = notes.filter(note => {
    const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          note.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const pinnedNotes = filteredNotes.filter(note => note.isPinned);
  const regularNotes = filteredNotes.filter(note => !note.isPinned);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300">Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back to Previous</span>
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Notes</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Organize your thoughts and ideas</p>
          </div>
          <button
            onClick={() => setShowNewNoteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#3D9B9B] text-white rounded-xl hover:bg-[#2d7b7b] transition-colors"
          >
            <Plus size={20} />
            <span>New Note</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D9B9B]"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#3D9B9B] text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={18} />
                <span className="font-medium">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Notes Grid */}
        <div className="space-y-6">
          {/* Pinned Notes */}
          {pinnedNotes.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <Star size={18} className="text-yellow-500" />
                Pinned Notes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinnedNotes.map(note => (
                  <div
                    key={note.id}
                    className={`${note.color} dark:bg-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100 dark:border-gray-700`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 dark:text-white">{note.title}</h3>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(note.id)}
                          className="text-yellow-500 hover:text-yellow-600"
                          title="Unpin note"
                        >
                          <Star size={16} className="fill-current" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-gray-400 hover:text-red-500"
                          title="Delete note"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">{note.content}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {note.createdAt}
                      </span>
                      <span className="px-2 py-1 bg-white dark:bg-gray-700 rounded-full capitalize">{note.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Notes */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
              {pinnedNotes.length > 0 ? 'All Notes' : 'Notes'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regularNotes.map(note => (
                <div
                  key={note.id}
                  className={`${note.color} dark:bg-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100 dark:border-gray-700`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-800 dark:text-white">{note.title}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTogglePin(note.id)}
                        className="text-gray-400 hover:text-yellow-500"
                        title="Pin note"
                      >
                        <Star size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-gray-400 hover:text-red-500"
                        title="Delete note"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">{note.content}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {note.createdAt}
                    </span>
                    <span className="px-2 py-1 bg-white dark:bg-gray-700 rounded-full capitalize">{note.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Empty State */}
          {filteredNotes.length === 0 && (
            <div className="text-center py-12">
              <NotebookText size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No notes found</h3>
              <p className="text-gray-500 dark:text-gray-500">Create your first note to get started</p>
            </div>
          )}
        </div>
      </div>

      {showNewNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">New Note</h2>
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D9B9B]"
                  placeholder="Enter note title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote((prev) => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 min-h-[110px] bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D9B9B]"
                  placeholder="Write your note..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <div className="relative">
                    <Tag size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
                    <select
                      value={newNote.category}
                      onChange={(e) => setNewNote((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full pl-8 pr-2 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D9B9B]"
                    >
                      <option value="work">Work</option>
                      <option value="personal">Personal</option>
                      <option value="ideas">Ideas</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-end gap-2 pb-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={newNote.isPinned}
                    onChange={(e) => setNewNote((prev) => ({ ...prev, isPinned: e.target.checked }))}
                    className="accent-[#3D9B9B]"
                  />
                  Pin this note
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewNoteModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNote}
                className="px-4 py-2 rounded-lg bg-[#3D9B9B] text-white hover:bg-[#2d7b7b] transition-colors"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPage;
