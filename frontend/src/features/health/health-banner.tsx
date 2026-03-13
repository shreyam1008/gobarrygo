import type { Health } from "@bindings/github.com/shreyam1008/gobarrygo/internal/contracts/models.js";

type Props = {
  health: Health;
};

export function HealthBanner({ health }: Props) {
  if (health.ready) {
    return (
      <section className="health-banner health-banner--ok">
        <div>
          <strong>aria2c ready</strong>
          <p>
            Local RPC is listening on port {health.rpcPort}. Downloads are being managed
            through the embedded controller.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="health-banner health-banner--warn">
      <div>
        <strong>{health.status === "binary_missing" ? "aria2c missing" : "aria2c unavailable"}</strong>
        <p>{health.message || "Choose an aria2c binary in Preferences to activate the controller."}</p>
      </div>
    </section>
  );
}

