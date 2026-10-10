"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NoteExport } from "@/components/note-export";
import { useI18n } from "@/components/i18n-provider";
import type { PdfNote } from "@/lib/notes/pdf";

export function NoteExportDialog({ note, open, onOpenChange }: {
  note: PdfNote;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="entry-dialog" aria-describedby={undefined}>
      <DialogHeader><DialogTitle>{t("notes.export")}</DialogTitle></DialogHeader>
      <p className="notes-meta">{note.title}</p>
      <NoteExport note={note} />
    </DialogContent>
  </Dialog>;
}
