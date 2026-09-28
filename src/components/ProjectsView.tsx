import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  QrCode,
  Radio,
  Barcode,
  Layers,
  Search,
  ExternalLink
} from 'lucide-react';
import { CodeItem, ProjectItem } from '../types.ts';

interface ProjectsViewProps {
  projects: ProjectItem[];
  codes: CodeItem[];
  onCreateProject: (project: { name: string; description?: string; color: string }) => void;
  onUpdateProject: (id: string, updates: Partial<ProjectItem>) => void;
  onDeleteProject: (id: string) => void;
  onOpenCodeDetail: (code: CodeItem) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  codes,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onOpenCodeDetail
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0] ? projects[0].id : ''
  );

  const colors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ec4899', // pink
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#ef4444'  // rose
  ];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateProject({
      name: name.trim(),
      description: description.trim(),
      color
    });
    setName('');
    setDescription('');
    setIsCreating(false);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !name.trim()) return;
    onUpdateProject(editingId, {
      name: name.trim(),
      description: description.trim(),
      color
    });
    setEditingId(null);
    setName('');
    setDescription('');
  };

  const startEdit = (p: ProjectItem) => {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description || '');
    setColor(p.color || '#3b82f6');
    setIsCreating(false);
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const projectCodes = codes.filter((c) => c.projectId === activeProject?.id);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-400" />
            Project Management
          </h2>
          <p className="text-xs text-slate-400">
            Group related QR codes, NFC tags, and barcodes by campaign, venue, or product line.
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreating(true);
            setEditingId(null);
            setName('');
            setDescription('');
          }}
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Create / Edit Form Drawer */}
      {(isCreating || editingId) && (
        <form
          onSubmit={isCreating ? handleCreate : handleUpdate}
          className="p-5 bg-slate-900 rounded-xl border border-slate-700/80 space-y-4 max-w-xl animate-in fade-in"
        >
          <h3 className="text-sm font-bold text-white">
            {isCreating ? 'Create New Project' : 'Edit Project Details'}
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Project Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer Festival 2026, Retail Shelf Tags"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short note about the scope or team assignees..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Accent Color
              </label>
              <div className="flex items-center gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingId(null);
              }}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
            >
              {isCreating ? 'Create Project' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Main Grid: Projects List + Codes Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Project Cards (5 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Projects ({projects.length})
          </div>

          {projects.map((p) => {
            const count = codes.filter((c) => c.projectId === p.id).length;
            const isSelected = activeProject?.id === p.id;

            return (
              <div
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-500/5'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: p.color || '#3b82f6' }}
                    />
                    <div className="font-semibold text-sm text-slate-100 truncate">
                      {p.name}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => startEdit(p)}
                      className="p-1 text-slate-500 hover:text-slate-300 rounded"
                      title="Edit project"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteProject(p.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {p.description && (
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {p.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-3 pt-3 border-t border-slate-800/80">
                  <span>{count} codes assigned</span>
                  <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Assigned Codes in Selected Project (8 cols) */}
        <div className="lg:col-span-8 p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
          {activeProject ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: activeProject.color }}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {activeProject.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {activeProject.description || 'Codes grouped inside this project container.'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {projectCodes.length} items
                </span>
              </div>

              {projectCodes.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No codes currently assigned to this project. When creating a code, select this project or move existing codes here.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/70">
                  {projectCodes.map((code) => (
                    <div
                      key={code.id}
                      className="py-3 flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            code.codeType === 'qr'
                              ? 'bg-indigo-500/15 text-indigo-400'
                              : code.codeType === 'nfc'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {code.codeType === 'qr' ? (
                            <QrCode className="w-4 h-4" />
                          ) : code.codeType === 'nfc' ? (
                            <Radio className="w-4 h-4" />
                          ) : (
                            <Barcode className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => onOpenCodeDetail(code)}
                            className="text-xs font-medium text-slate-200 hover:text-indigo-400 truncate block text-left"
                          >
                            {code.name}
                          </button>
                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            ID: {code.uniqueId} · {code.destinationUrl}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono tabular-nums text-slate-300">
                          {code.scanCount} scans
                        </span>
                        <button
                          onClick={() => onOpenCodeDetail(code)}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800 rounded transition-colors"
                        >
                          Inspect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Select or create a project to see assigned codes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
