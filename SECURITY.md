# Security policy

Please report suspected vulnerabilities privately through GitHub's **Report a vulnerability** flow. Do not publish exploitable details, download URLs containing private tokens, or local aria2 RPC secrets in an issue.

The latest released version receives security fixes. Include the GoBarryGo version, operating system, aria2c version, reproduction steps, and impact. Ordinary defects belong in the public issue tracker.

GoBarryGo is designed to control a local aria2c process. Reports involving remote RPC exposure should include the bind address and authentication configuration, with secrets removed.
