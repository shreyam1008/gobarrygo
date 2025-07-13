import { useEffect, useState } from "react";
import { X, FolderOpen, FileSearch } from "lucide-react";
import { Preferences } from "@bindings/github.com/shreyam1008/gobarrygo/internal/contracts/models.js";
import { appStore } from "@/lib/store/app-store";

type Props = {
  open: boolean;
  preferences: Preferences;
  onClose: () => void;
};

const fileAllocationOptions = ["prealloc", "falloc", "trunc", "none"];

export function PreferencesDialog({ open, preferences, onClose }: Props) {
  const [draft, setDraft] = useState(new Preferences(preferences));

  useEffect(() => {
    setDraft(new Preferences(preferences));
  }, [preferences, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card modal-card--wide">
        <header className="modal-card__header">
          <div>
            <h2>Preferences</h2>
            <p>Tune how aggressively aria2 parallelizes downloads, where files land, and how session recovery behaves.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="prefs-grid">
          <label className="field">
            <span>aria2 binary</span>
            <div className="field-inline">
              <input
                type="text"
                value={draft.aria2Binary}
                onChange={(event) => setDraft(new Preferences({ ...draft, aria2Binary: event.target.value }))}
              />
              <button
                type="button"
                className="secondary-button"
                onClick={async () => {
                  const picked = await appStore.pickAria2Binary();
                  if (picked) {
                    setDraft(new Preferences({ ...draft, aria2Binary: picked }));
                  }
                }}
              >
                <FileSearch size={16} />
              </button>
            </div>
          </label>

          <label className="field">
            <span>Download folder</span>
            <div className="field-inline">
              <input
                type="text"
                value={draft.downloadDirectory}
                onChange={(event) => setDraft(new Preferences({ ...draft, downloadDirectory: event.target.value }))}
              />
              <button
                type="button"
                className="secondary-button"
                onClick={async () => {
                  const picked = await appStore.pickDownloadDirectory();
                  if (picked) {
                    setDraft(new Preferences({ ...draft, downloadDirectory: picked }));
                  }
                }}
              >
                <FolderOpen size={16} />
              </button>
            </div>
          </label>

          <NumberField
            label="Concurrent downloads"
            value={draft.maxConcurrentDownloads}
            onChange={(value) => setDraft(new Preferences({ ...draft, maxConcurrentDownloads: value }))}
          />

          <NumberField
            label="Split count"
            value={draft.split}
            onChange={(value) => setDraft(new Preferences({ ...draft, split: value }))}
          />

          <NumberField
            label="Connections per server"
            value={draft.maxConnectionsPerServer}
            onChange={(value) => setDraft(new Preferences({ ...draft, maxConnectionsPerServer: value }))}
          />

          <label className="field">
            <span>Minimum split size</span>
            <input
              type="text"
              value={draft.minSplitSize}
              onChange={(event) => setDraft(new Preferences({ ...draft, minSplitSize: event.target.value }))}
            />
          </label>

          <label className="field">
            <span>File allocation</span>
            <select
              value={draft.fileAllocation}
              onChange={(event) => setDraft(new Preferences({ ...draft, fileAllocation: event.target.value }))}
            >
              {fileAllocationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>User-Agent</span>
            <input
              type="text"
              value={draft.userAgent}
              onChange={(event) => setDraft(new Preferences({ ...draft, userAgent: event.target.value }))}
            />
          </label>
        </div>

        <div className="switch-grid">
          <Switch
            label="Continue partial downloads"
            checked={draft.continueDownloads}
            onChange={(checked) => setDraft(new Preferences({ ...draft, continueDownloads: checked }))}
          />
          <Switch
            label="Always resume when possible"
            checked={draft.alwaysResume}
            onChange={(checked) => setDraft(new Preferences({ ...draft, alwaysResume: checked }))}
          />
          <Switch
            label="Auto rename on conflicts"
            checked={draft.autoRename}
            onChange={(checked) => setDraft(new Preferences({ ...draft, autoRename: checked }))}
          />
          <Switch
            label="Notify on completion"
            checked={draft.notifyOnCompletion}
            onChange={(checked) => setDraft(new Preferences({ ...draft, notifyOnCompletion: checked }))}
          />
          <Switch
            label="Notify on failure"
            checked={draft.notifyOnError}
            onChange={(checked) => setDraft(new Preferences({ ...draft, notifyOnError: checked }))}
          />
        </div>

        <footer className="modal-card__footer">
          <button type="button" className="secondary-button" onClick={() => void appStore.revealPreferencesFile()}>
            Reveal config
          </button>
          <div className="footer-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => void appStore.savePreferences(draft)}
            >
              Save preferences
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="switch-card">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

