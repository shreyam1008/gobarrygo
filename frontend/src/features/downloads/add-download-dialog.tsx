import { useState } from "react";
import { X, FolderOpen } from "lucide-react";
import { appStore } from "@/lib/store/app-store";

type Props = {
  open: boolean;
  defaultDirectory: string;
  onClose: () => void;
};

export function AddDownloadDialog({ open, defaultDirectory, onClose }: Props) {
  const [urlsText, setURLsText] = useState("");
  const [outputName, setOutputName] = useState("");
  const [directory, setDirectory] = useState(defaultDirectory);
  const [headersText, setHeadersText] = useState("");
  const [userAgent, setUserAgent] = useState("");

  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card">
        <header className="modal-card__header">
          <div>
            <h2>Add download</h2>
            <p>Paste one or more URLs. aria2 will split and parallelize aggressively using your preferences.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <label className="field">
          <span>URLs</span>
          <textarea
            rows={6}
            placeholder="https://example.com/file.iso"
            value={urlsText}
            onChange={(event) => setURLsText(event.target.value)}
          />
        </label>

        <div className="field-grid">
          <label className="field">
            <span>Output name</span>
            <input
              type="text"
              placeholder="ubuntu.iso"
              value={outputName}
              onChange={(event) => setOutputName(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Override directory</span>
            <div className="field-inline">
              <input
                type="text"
                value={directory}
                onChange={(event) => setDirectory(event.target.value)}
              />
              <button
                type="button"
                className="secondary-button"
                onClick={async () => {
                  const picked = await appStore.pickDownloadDirectory();
                  if (picked) {
                    setDirectory(picked);
                  }
                }}
              >
                <FolderOpen size={16} />
              </button>
            </div>
          </label>
        </div>

        <div className="field-grid">
          <label className="field">
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
            <textarea
              rows={4}
              placeholder="Optional override"
              value={userAgent}
              onChange={(event) => setUserAgent(event.target.value)}
            />
          </label>
        </div>

        <footer className="modal-card__footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={async () => {
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
            }}
          >
            Queue download
          </button>
        </footer>
      </section>
    </div>
  );
}

