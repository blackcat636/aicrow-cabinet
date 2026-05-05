#!/usr/bin/env node

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
};

const parseJson = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const collectText = (value, depth = 0) => {
  if (depth > 4 || value == null) {
    return [];
  }

  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectText(item, depth + 1));
  }

  if (typeof value === "object") {
    const interestingKeys = [
      "prompt",
      "userPrompt",
      "user_prompt",
      "text",
      "content",
      "message",
      "input",
    ];

    const prioritized = interestingKeys
      .filter((key) => key in value)
      .flatMap((key) => collectText(value[key], depth + 1));

    if (prioritized.length > 0) {
      return prioritized;
    }

    return Object.values(value).flatMap((item) => collectText(item, depth + 1));
  }

  return [];
};

const looksSensitive = (text) => {
  const patterns = [
    /sk_live_[A-Za-z0-9]{10,}/,
    /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /AIza[0-9A-Za-z\-_]{20,}/,
    /ghp_[A-Za-z0-9]{20,}/,
    /xox[baprs]-[A-Za-z0-9-]{10,}/,
    /password\s*=\s*["']?[^\s"']{10,}/i,
    /secret\s*=\s*["']?[^\s"']{10,}/i,
    /\b[A-Za-z0-9+\/]{32,}={0,2}\b/,
  ];

  return patterns.some((pattern) => pattern.test(text));
};

const main = async () => {
  const raw = await readStdin();
  const parsed = parseJson(raw);

  if (!parsed) {
    process.stdout.write(JSON.stringify({ permission: "allow" }));
    return;
  }

  const allText = collectText(parsed).join("\n");
  if (!allText || !looksSensitive(allText)) {
    process.stdout.write(JSON.stringify({ permission: "allow" }));
    return;
  }

  process.stdout.write(
    JSON.stringify({
      permission: "ask",
      user_message:
        "У промпті можуть бути чутливі дані. Перевірте, будь ласка, перед відправкою.",
      agent_message:
        "Potential secret-like pattern detected in prompt payload. Ask user confirmation.",
    }),
  );
};

main().catch(() => {
  process.stdout.write(JSON.stringify({ permission: "allow" }));
});
