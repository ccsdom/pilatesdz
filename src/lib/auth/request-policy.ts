export function isTrustedMutation(origin: string | null, contentType: string | null, configuredOrigin: string | undefined) {
  if (contentType?.split(";")[0].trim() !== "application/json") return false;
  const expectedOrigin = configuredOrigin || origin;
  if (!expectedOrigin || !origin || origin !== expectedOrigin) return false;
  try {
    const url = new URL(expectedOrigin);
    return (
      ["127.0.0.1", "localhost"].includes(url.hostname) ||
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch { return false; }
}

export async function readLimitedBody(request: Request, limit = 12000): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); throw new Error("Body too large"); }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(all);
}
