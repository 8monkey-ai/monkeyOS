const tokenPattern = /__([A-Z][A-Z0-9_]*)__/g;

export function renderTemplate(source: string, values: Record<string, string>): string {
  const rendered = source.replace(tokenPattern, (_, token: string) => {
    const value = values[token];
    if (value === undefined) throw new Error(`Missing template value: ${token}`);
    return value;
  });
  const leftovers = [...rendered.matchAll(tokenPattern)].map((match) => match[0]);
  if (leftovers.length) throw new Error(`Unresolved tokens: ${leftovers.join(", ")}`);
  return rendered;
}

export function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}
