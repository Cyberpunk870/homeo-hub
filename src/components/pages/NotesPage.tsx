import { useEffect, useMemo, useState } from 'react';
import { FileText, Plus, Search } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import type { NotesLibrary } from '@/entities';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useClinicLocation } from '@/hooks/use-clinic-location';
import { useToast } from '@/hooks/use-toast';

export default function NotesPage() {
  const clinicLocation = useClinicLocation();
  const { toast } = useToast();
  const [notes, setNotes] = useState<NotesLibrary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState({ title: '', category: '', keywords: '', content: '' });

  useEffect(() => {
    void loadData();
  }, [clinicLocation]);

  const loadData = async () => {
    const results = await BaseCrudService.getAllItems<NotesLibrary>('noteslibrary');
    setNotes(results);
  };

  const visibleNotes = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return notes.filter((note) =>
      (note.clinicLocation || 'Noida') === clinicLocation &&
      !note.isArchived &&
      (
        note.title?.toLowerCase().includes(query) ||
        note.category?.toLowerCase().includes(query) ||
        note.keywords?.toLowerCase().includes(query) ||
        note.content?.toLowerCase().includes(query)
      )
    );
  }, [notes, clinicLocation, searchQuery]);

  const handleSave = async () => {
    await BaseCrudService.create<NotesLibrary>('noteslibrary', {
      _id: crypto.randomUUID(),
      clinicLocation,
      title: draft.title.trim(),
      category: draft.category.trim(),
      keywords: draft.keywords.trim(),
      content: draft.content.trim(),
      isArchived: false,
    });
    toast({ title: 'Note Saved', description: 'Knowledge base note added successfully.' });
    setDraft({ title: '', category: '', keywords: '', content: '' });
    setIsOpen(false);
    await loadData();
  };

  return (
    <DashboardShell
      title="Notes Library"
      description={`Searchable disease notes, treatment references, and operator guidance for ${clinicLocation}.`}
      actions={(
        <Button onClick={() => setIsOpen(true)} className="h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 px-6 text-base font-semibold text-white">
          <Plus className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      )}
    >
      <div className="mb-8 rounded-[24px] border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search title, condition, or keywords..." className="pl-9" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {visibleNotes.map((note) => (
          <div key={note._id} className="rounded-[24px] border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-100 to-lime-50 p-3">
                <FileText className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-heading text-xl text-slate-800">{note.title}</h3>
                <p className="text-sm text-slate-500">{note.category || 'General note'}</p>
              </div>
            </div>
            <p className="mb-3 text-sm text-slate-500">{note.keywords || 'No keywords added'}</p>
            <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-800 whitespace-pre-wrap">{note.content}</div>
          </div>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Add Knowledge Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="note-title">Title</Label>
                <Input id="note-title" value={draft.title} onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-category">Category</Label>
                <Input id="note-category" value={draft.category} onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-keywords">Keywords</Label>
              <Input id="note-keywords" value={draft.keywords} onChange={(event) => setDraft((prev) => ({ ...prev, keywords: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-content">Content</Label>
              <Textarea id="note-content" rows={10} value={draft.content} onChange={(event) => setDraft((prev) => ({ ...prev, content: event.target.value }))} />
            </div>
            <Button onClick={handleSave} className="w-full">Save Note</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

