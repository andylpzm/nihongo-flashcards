// Save and restore, wired to the settings sheet.
//
// buildBackup/parseBackup/applyBackup already do the careful part; this is only
// about getting the file out of the phone and back in, which on iOS is its own
// small problem:
//
//   - a standalone PWA has no download shelf. an <a download> click can end up
//     doing nothing visible at all, which for a backup button is the worst
//     possible failure - it looks like it worked.
//   - navigator.share with a file opens the real share sheet, so the copy can
//     go to Files, Mail, anywhere. that is the path we take when it exists.
//
// nothing is written until the summary has been shown and confirmed.

import { buildBackup, parseBackup, applyBackup, backupFilename, type BackupBundle } from '../state/backup';

const say = (el: HTMLElement | null, text: string): void => {
  if (el) el.textContent = text;
};

async function offerFile(json: string, name: string): Promise<'shared' | 'downloaded'> {
  const file = new File([json], name, { type: 'application/json' });
  // canShare has to be asked about the actual file: ios says yes to the api and
  // no to the payload, and sharing then rejects
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: name });
    return 'shared';
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}

export function setupBackupPanel(): void {
  const exportBtn = document.getElementById('btn-backup-export');
  const importBtn = document.getElementById('btn-backup-import');
  const input = document.getElementById('backup-file') as HTMLInputElement | null;
  const confirm = document.getElementById('restore-confirm');
  const summaryEl = document.getElementById('restore-summary');
  const goBtn = document.getElementById('btn-restore-go');
  const cancelBtn = document.getElementById('btn-restore-cancel');
  const backupNote = document.getElementById('backup-note');
  const restoreNote = document.getElementById('restore-note');
  if (!exportBtn || !importBtn || !input) return;

  exportBtn.addEventListener('click', () => {
    say(backupNote, 'Preparing…');
    void (async () => {
      try {
        const bundle = await buildBackup();
        const name = backupFilename();
        const how = await offerFile(JSON.stringify(bundle, null, 2), name);
        say(
          backupNote,
          how === 'shared'
            ? `${bundle.reviews.length} reviews saved. Keep it somewhere safe.`
            : `Saved as ${name}. Keep it somewhere safe.`,
        );
      } catch (e) {
        // an abandoned share sheet throws AbortError; that is not a failure
        if (e instanceof DOMException && e.name === 'AbortError') say(backupNote, 'Cancelled.');
        else say(backupNote, `Could not save: ${e instanceof Error ? e.message : String(e)}`);
      }
    })();
  });

  let pending: BackupBundle | null = null;
  const closeConfirm = (): void => {
    pending = null;
    confirm?.classList.add('hidden');
    input.value = '';
  };

  importBtn.addEventListener('click', () => input.click());

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    void (async () => {
      const parsed = parseBackup(await file.text());
      if (!parsed.ok) {
        say(restoreNote, parsed.error);
        input.value = '';
        return;
      }
      pending = parsed.bundle;
      const s = parsed.summary;
      const when = new Date(s.exportedAt).toLocaleDateString();
      say(
        summaryEl,
        `Saved ${when}: ${s.reviews} reviews, ${s.sessions} sessions. ` +
          'Anything this phone already knows is kept, so nothing is lost by restoring.',
      );
      say(restoreNote, `Ready to restore ${file.name}.`);
      confirm?.classList.remove('hidden');
    })();
  });

  cancelBtn?.addEventListener('click', () => {
    closeConfirm();
    say(restoreNote, 'Adds anything the copy knows that this phone does not.');
  });

  goBtn?.addEventListener('click', () => {
    if (!pending) return;
    const bundle = pending;
    say(summaryEl, 'Restoring…');
    void (async () => {
      try {
        const r = await applyBackup(bundle);
        closeConfirm();
        say(restoreNote, `Restored ${r.reviews} reviews and ${r.sessions} sessions. Reopening…`);
        // the whole app read its state at boot; rather than hunt down every
        // view that now holds a stale copy, start again from the new data
        setTimeout(() => location.reload(), 1200);
      } catch (e) {
        say(summaryEl, `Could not restore: ${e instanceof Error ? e.message : String(e)}`);
      }
    })();
  });
}
