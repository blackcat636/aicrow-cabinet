#!/usr/bin/env bash
set -euo pipefail

INPUT="$(cat)"

COMMAND="$(
  printf '%s' "$INPUT" | node -e '
    let raw = "";
    process.stdin.on("data", (c) => (raw += c));
    process.stdin.on("end", () => {
      try {
        const parsed = JSON.parse(raw);
        const cmd =
          parsed.command ??
          parsed.input?.command ??
          parsed.payload?.command ??
          "";
        process.stdout.write(String(cmd));
      } catch {
        process.stdout.write("");
      }
    });
  '
)"

if [[ -z "$COMMAND" ]]; then
  echo '{"permission":"allow"}'
  exit 0
fi

if [[ "$COMMAND" =~ wrangler[[:space:]]+pages[[:space:]]+deploy ]] || \
   [[ "$COMMAND" =~ git[[:space:]]+push[[:space:]]+--force ]] || \
   [[ "$COMMAND" =~ rm[[:space:]]+-rf ]]; then
  echo '{"permission":"ask","user_message":"Команда виглядає ризиковою (deploy/force/rm -rf). Підтвердьте, будь ласка.","agent_message":"High-risk shell command detected by project hook."}'
  exit 0
fi

echo '{"permission":"allow"}'
