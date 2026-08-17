import { useCallback, useMemo, useState } from "react";
import { ClipboardPaste, FolderOpen, Link2, ListPlus, Plus, X } from "lucide-react";
import { analyzeDownloadInput, describeDownloadInput } from "@/lib/download-model";
import { appStore } from "@/lib/store/app-store";

type Props = {
  directory: string;
  directoryOptions: string[];
  defaultUserAgent: string;
};

export function QuickAddBar({ directory, directoryOptions, defaultUserAgent }: Props) {
  const [urlsText, setURLsText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const analysis = useMemo(() => analyzeDownloadInput(urlsText), [urlsText]);
  const inputMessage = describeDownloadInput(analysis);
  const hasText = urlsText.trim().length > 0;
  const actionDisabled = submitting || (hasText && analysis.urls.length === 0);
  const actionLabel = !hasText ? "Add" : analysis.urls.length > 0 ? `Queue ${analysis.urls.length}` : "No links";

  const submit = useCallback(async () => {
    if (analysis.urls.length === 0) {
      appStore.openAddDialog();
      return;
    }

    setSubmitting(true);
    try {
      const success = await appStore.submitDownload({
        urlsText,
        outputName: "",
        directory,
        headersText: "",
        userAgent: defaultUserAgent,
      });
      if (success) {
        setURLsText("");
      }
    } finally {
      setSubmitting(false);
    }
  }, [analysis.urls.length, defaultUserAgent, directory, urlsText]);

  const paste = useCallback(async () => {
    try {
      const clipboardText = await navigator.clipboard?.readText();
      if (clipboardText) {
        setURLsText((current) => [current, clipboardText].filter(Boolean).join("\n"));
      }
    } catch {
      appStore.openAddDialog();
    }
  }, []);

  return (
    <section className="quick" aria-label="Quick add download">
      <div className="q-group">
        <div className="q-input">
          <Link2 size={17} aria-hidden="true" />
          <textarea
            rows={1}
            aria-label="Download links"
            aria-describedby={inputMessage ? "quick-add-message" : undefined}
            placeholder="Paste one or many download links"
            value={urlsText}
            onChange={(event) => setURLsText(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                void submit();
              }
            }}
          />
          {urlsText ? (
            <button type="button" className="bare" onClick={() => setURLsText("")} aria-label="Clear quick add" title="Clear links">
              <X size={15} />
            </button>
          ) : null}
        </div>
        <span id="quick-add-message" className="q-hint" aria-live="polite">
          {inputMessage || "Ctrl/⌘ + Enter queues pasted links"}
        </span>
      </div>

      <label className="q-dest" title={directory || "Default download folder"}>
        <FolderOpen size={15} aria-hidden="true" />
        <span className="sr-only">Quick add download folder</span>
        <select value={directory} onChange={(event) => appStore.setQuickDirectory(event.target.value)}>
          {directoryOptions.map((item) => (
            <option key={item || "default"} value={item}>
              {item || "Default download folder"}
            </option>
          ))}
        </select>
      </label>

      <div className="q-actions">
        <button type="button" className="icon" onClick={() => void paste()} aria-label="Paste download links" title="Paste links">
          <ClipboardPaste size={16} />
        </button>
        <button type="button" className="tool q-details" onClick={() => appStore.openAddDialog()}>
          <ListPlus size={16} />
          <span>Details</span>
        </button>
        <button type="button" className="tool primary" disabled={actionDisabled} onClick={() => void submit()}>
          <Plus size={16} />
          {actionLabel}
        </button>
      </div>
    </section>
  );
}
