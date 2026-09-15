export function isTrustedMutation(origin: string | null, contentType: string | null, configuredOrigin: string | undefined) {
  if (contentType?.split(";")[0].trim() !== "application/json") return false;
  if (!configuredOrigin || !origin) return false;
  try {
    const requestUrl = new URL(origin);
    const expectedUrl = new URL(configuredOrigin);
    const reqHost = requestUrl.hostname.replace(/^www\./, "");
    const expHost = expectedUrl.hostname.replace(/^www\./, "");
    if (requestUrl.protocol !== expectedUrl.protocol || reqHost !== expHost || requestUrl.port !== expectedUrl.port) return false;
    return (
      ["127.0.0.1", "localhost"].includes(requestUrl.hostname) ||
      requestUrl.protocol === "http:" ||
      requestUrl.protocol === "https:"
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
