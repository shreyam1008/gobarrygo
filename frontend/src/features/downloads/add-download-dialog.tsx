import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardPaste, Download, Folder, FolderOpen, Trash2, X } from "lucide-react";
import { analyzeDownloadInput, describeDownloadInput } from "@/lib/download-model";
import { appStore } from "@/lib/store/app-store";

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
  const analysis = useMemo(() => analyzeDownloadInput(urlsText), [urlsText]);
  const outputConflict = analysis.urls.length > 1 && outputName.trim().length > 0;

  useEffect(() => {
    if (open) {
      setDirectory((current) => current || defaultDirectory);
    }
  }, [defaultDirectory, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

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
    if (outputConflict) {
      return;
    }
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

  const inputDescription = describeDownloadInput(analysis);

  return (
    <div className="backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    }}>
      <section
        className="modal add-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-download-title"
        aria-describedby="add-download-st"
      >
        <header className="m-head">
          <div>
            <h2 id="add-download-title">Add download</h2>
            <p id="add-download-st" className={analysis.urls.length > 0 ? "dialog-st-valid" : ""}>
              {analysis.urls.length > 0 ? <CheckCircle2 size={15} aria-hidden="true" /> : null}
              {inputDescription || "Paste links and choose where the files should land."}
            </p>
          </div>
          <button type="button" className="bare" onClick={onClose} aria-label="Close add download" title="Close">
            <X size={17} />
          </button>
        </header>

        <div className="field-head">
          <label htmlFor="download-links">Links</label>
          <div>
            <button type="button" className="tool" onClick={() => void pasteFromClipboard()}>
              <ClipboardPaste size={15} /> Paste
            </button>
            <button type="button" className="tool" onClick={() => setURLsText("")} disabled={!urlsText}>
              <Trash2 size={15} /> Clear
            </button>
          </div>
        </div>
        <textarea
          id="download-links"
          className="add-dialog__links"
          rows={6}
          autoFocus
          spellCheck={false}
          placeholder={"https://example.com/file.iso\nhttps://mirror.example.com/archive.zip"}
          value={urlsText}
          onChange={(event) => setURLsText(event.target.value)}
        />

        <label className="field field--stacked">
          <span>File name</span>
          <input
            type="text"
            placeholder="Optional (for example, linux.iso)"
            value={outputName}
            onChange={(event) => setOutputName(event.target.value)}
            aria-invalid={outputConflict}
            aria-describedby={outputConflict ? "output-name-help" : undefined}
          />
          {outputConflict ? (
            <small id="output-name-help" className="field-error">A custom file name can only be used with one link.</small>
          ) : null}
        </label>

        <label className="field field--stacked">
          <span>Destination</span>
          <div className="field-line">
            <Folder size={16} aria-hidden="true" />
            <input
              type="text"
              value={directory}
              onChange={(event) => setDirectory(event.target.value)}
            />
            <button
              type="button"
              className="tool"
              onClick={async () => {
                const picked = await appStore.pickDownloadDirectory();
                if (picked) {
                  setDirectory(picked);
                }
              }}
            >
              <FolderOpen size={15} /> Browse
            </button>
          </div>
        </label>

        {recentDirectories.length > 0 ? (
          <div className="recents">
            <span>Recent folders</span>
            <div className="dir-chips" aria-label="Recent folders">
              {recentDirectories.slice(0, 5).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`dir-chip ${directory === item ? "dir-chip-on" : ""}`}
                  onClick={() => setDirectory(item)}
                  title={item}
                >
                  <Folder size={14} />
                  {compactDirectory(item)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <details className="advanced">
          <summary>
            <span>Advanced request options</span>
            <small>HTTP headers, User-Agent</small>
          </summary>
          <div className="advanced-body">
            <label className="field">
              <span>Headers</span>
              <textarea
                rows={4}
                placeholder="Authorization: Bearer …"
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

        <footer className="m-foot">
          <button type="button" className="tool" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="tool primary"
            disabled={submitting || analysis.urls.length === 0 || outputConflict}
            onClick={() => void submit()}
          >
            <Download size={16} />
            Queue {analysis.urls.length || ""}
          </button>
        </footer>
      </section>
    </div>
  );
}

function compactDirectory(directory: string): string {
  const normalized = directory.replace(/[\\/]+$/, "");
  const parts = normalized.split(/[\\/]/);
  const leaf = parts.at(-1);
  return leaf ? `…/${leaf}` : directory;
}
