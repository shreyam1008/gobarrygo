import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@/app/App";
import "@/styles.css";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

async function render() {
  const preview = import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get("native-ui-preview")
    : null;

  if (preview) {
    const { NativeUIPreview } = await import("@/dev/native-ui-preview");
    root.render(<NativeUIPreview dialogOpen={preview === "dialog"} />);
    return;
  }

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void render();
