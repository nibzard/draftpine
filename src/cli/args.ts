export interface ParsedArgs {
  command: string[];
  flags: Record<string, string | boolean | string[]>;
  positionals: string[];
}

export function parseArgs(argv: string[]): ParsedArgs {
  const command: string[] = [];
  const positionals: string[] = [];
  const flags: Record<string, string | boolean | string[]> = {};
  const booleanFlags = new Set(["force", "json", "strict", "aiReview", "help"]);
  let commandDone = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg.startsWith("--")) {
      const [rawKey, inline] = arg.slice(2).split("=", 2);
      const key = rawKey.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
      const next = argv[index + 1];
      const value = inline ?? (booleanFlags.has(key) ? true : next && !next.startsWith("--") ? next : true);
      if (value === next) index += 1;
      if (flags[key]) {
        const existing = flags[key];
        flags[key] = Array.isArray(existing) ? [...existing, String(value)] : [String(existing), String(value)];
      } else {
        flags[key] = value;
      }
      commandDone = true;
    } else if ((!commandDone && command.length < 2 && ["new", "test"].includes(command[0] ?? "")) || (!commandDone && command.length === 0)) {
      command.push(arg);
    } else if (!commandDone && command.length === 1 && ["block"].includes(arg)) {
      command.push(arg);
    } else {
      commandDone = true;
      positionals.push(arg);
    }
  }
  return { command, flags, positionals };
}

export function flagString(flags: Record<string, string | boolean | string[]>, name: string, fallback?: string): string | undefined {
  const value = flags[name];
  if (typeof value === "string") return value;
  return fallback;
}

export function flagBoolean(flags: Record<string, string | boolean | string[]>, name: string): boolean {
  const value = flags[name];
  return value === true || value === "true";
}
