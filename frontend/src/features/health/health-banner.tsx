import { FileSearch, Settings } from "lucide-react";
import { Preferences, type Health } from "@bindings/github.com/shreyam1008/gobarrygo/internal/contracts/models.js";
import { appStore } from "@/lib/store/app-store";

type Props = {
  health: Health;
  preferences: Preferences;
};

export function HealthBanner({ health, preferences }: Props) {
  if (health.ready) {
    return (
      <section className="health-banner health-banner--ok">
        <div>
          <strong>aria2c ready</strong>
          <p>Local RPC is listening on port {health.rpcPort}.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="health-banner health-banner--warn">
      <div>
        <strong>{health.status === "binary_missing" ? "aria2c missing" : "aria2c unavailable"}</strong>
        <p>{health.message || "Choose an aria2c binary to activate the controller."}</p>
      </div>
      <div className="health-banner__actions">
        <button
          type="button"
          className="tool-button tool-button--primary"
          onClick={async () => {
            const picked = await appStore.pickAria2Binary();
            if (picked) {
              await appStore.savePreferences(new Preferences({ ...preferences, aria2Binary: picked }));
            }
          }}
        >
          <FileSearch size={16} />
          Choose
        </button>
        <button type="button" className="tool-button" onClick={() => appStore.openPreferences()}>
          <Settings size={16} />
          Settings
        </button>
      </div>
    </section>
  );
}
