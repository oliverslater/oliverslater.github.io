const API_HEADERS = {
  Accept: "application/json",
  "User-Agent": "OliverSlater-VirtualCV/1.0",
};

export async function fetchCredentialJson<T>(
  url: string,
  timeoutMs: number,
  sourceName: string,
): Promise<T> {
  const response = await fetch(url, {
    headers: API_HEADERS,
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`${sourceName} API returned HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}
