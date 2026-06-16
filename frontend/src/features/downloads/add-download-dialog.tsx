import { useEffect, useMemo, useState } from "react";
import { ClipboardPaste, FolderOpen, Plus, X } from "lucide-react";
import { appStore } from "@/lib/store/app-store";
import { parseDownloadURLs } from "@/lib/download-model";

type Props = {
  open: boolean;
  defaultDirectory: string;
  recentDirectories: string[];
  onClose: () => void;
};

export function AddDownloadDialog({ open, defaultDirectory, recentDirectories, onClose }: Props) {
  const [urlsText, setURLsText] = useState("");
  const [outputName, setOutputName] = useState("");
  const [directory, setDirectory] = useState(defaultDirectory);
  const [headersText, setHeadersText] = useState("");
  const [userAgent, setUserAgent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const parsedURLs = useMemo(() => parseDownloadURLs(urlsText), [urlsText]);

  useEffect(() => {
    if (open) {
      setDirectory((current) => current || defaultDirectory);
    }
  }, [defaultDirectory, open]);

  if (!open) {
    return null;
  }

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard?.readText();
      if (text) {
        setURLsText((current) => [current, text].filter(Boolean).join("\n"));
      }
    } catch {
      // Clipboard permission is optional in desktop webviews.
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const success = await appStore.submitDownload({
        urlsText,
        outputName,
        directory,
        headersText,
        userAgent,
      });
      if (success) {
        setURLsText("");
        setOutputName("");
        setHeadersText("");
        setUserAgent("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    }}>
      <section
        className="modal-card add-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-download-title"
      >
        <header className="modal-card__header">
          <div>
            <h2 id="add-download-title">Add Download</h2>
            <p>{parsedURLs.length > 0 ? `${parsedURLs.length} valid link${parsedURLs.length === 1 ? "" : "s"} ready` : "Paste links and choose where the files should land."}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close" title="Close">
            <X size={18} />
          </button>
        </header>

        <label className="field field--stacked">
          <span>Links</span>
          <textarea
            rows={7}
            autoFocus
            placeholder="https://example.com/file.iso"
            value={urlsText}
            onChange={(event) => setURLsText(event.target.value)}
          />
        </label>

        <div className="dialog-action-row">
          <button type="button" className="tool-button" onClick={pasteFromClipboard}>
            <ClipboardPaste size={16} />
            Paste
          </button>
          <button type="button" className="tool-button" onClick={() => setURLsText("")} disabled={!urlsText}>
            <X size={16} />
            Clear
          </button>
        </div>

        <div className="field-grid">
          <label className="field">
            <span>File name</span>
            <input
              type="text"
              placeholder="Optional"
              value={outputName}
              onChange={(event) => setOutputName(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Destination</span>
            <div className="field-inline">
              <input
                type="text"
                value={directory}
                onChange={(event) => setDirectory(event.target.value)}
              />
              <button
                type="button"
                className="icon-button"
                onClick={async () => {
                  const picked = await appStore.pickDownloadDirectory();
                  if (picked) {
                    setDirectory(picked);
                  }
                }}
                aria-label="Pick destination folder"
                title="Pick destination folder"
              >
                <FolderOpen size={16} />
              </button>
            </div>
          </label>
        </div>

        {recentDirectories.length > 0 ? (
          <div className="directory-chip-row" aria-label="Recent folders">
            {recentDirectories.slice(0, 5).map((item) => (
              <button
                key={item}
                type="button"
                className={`directory-chip ${directory === item ? "directory-chip--active" : ""}`}
                onClick={() => setDirectory(item)}
                title={item}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}

        <details className="advanced-panel">
          <summary>Advanced Request Options</summary>
          <div className="field-grid">
            <label className="field field--stacked">
              <span>Headers</span>
              <textarea
                rows={4}
                placeholder="Authorization: Bearer ..."
                value={headersText}
                onChange={(event) => setHeadersText(event.target.value)}
              />
            </label>

            <label className="field">
              <span>User-Agent</span>
              <input
                type="text"
                placeholder="Optional override"
                value={userAgent}
                onChange={(event) => setUserAgent(event.target.value)}
              />
            </label>
          </div>
        </details>

        <footer className="modal-card__footer">
          <button type="button" className="tool-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="tool-button tool-button--primary"
            disabled={submitting || parsedURLs.length === 0}
            onClick={() => void submit()}
          >
            <Plus size={16} />
            Queue
          </button>
        </footer>
      </section>
    </div>
  );
}
