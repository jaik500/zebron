/* eslint-disable max-len */
/**
 * Opens a web address the way a browser would and says whether it works.
 *
 * - ok: the page answered (2xx or 3xx after redirects).
 * - broken: the page is gone (404, 410) or the address does not exist
 *   (no such domain, or not a web address). Only these are reported as
 *   broken links.
 * - blocked (anything else): the site refused or ignored the automatic
 *   check (401, 403, 429, 5xx, timeouts, dropped connections). Many large
 *   sites (studentaid.gov, ged.com…) do this to requests from cloud
 *   servers, so these are listed as "Could not check", not as broken.
 */
export interface LinkStatus {
  ok: boolean;
  blocked: boolean;
  status: number;
  reason: string;
}

const GONE = new Set([404, 410]);
const MISSING_HOST = new Set(["ENOTFOUND", "EAI_NONAME"]);

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 ZebronLinkCheck/1.1",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

/** The low-level error code behind a failed fetch (ENOTFOUND, ECONNRESET…). */
function errorCode(error: unknown): string {
  const cause = (error as { cause?: { code?: string; cause?: { code?: string } } })?.cause;
  return cause?.code ?? cause?.cause?.code ?? "";
}

export async function linkStatus(url: string, timeoutMs = 15_000): Promise<LinkStatus> {
  if (!/^https?:\/\//i.test(url)) {
    return { ok: false, blocked: false, status: 0, reason: "Not a web address" };
  }
  let last: LinkStatus = { ok: false, blocked: true, status: 0, reason: "The site did not answer the automatic check" };
  // Some sites refuse HEAD requests, so GET is tried too.
  for (const method of ["HEAD", "GET"]) {
    try {
      const response = await fetch(url, { method, redirect: "follow", headers: BROWSER_HEADERS, signal: AbortSignal.timeout(timeoutMs) });
      if (response.status < 400) {
        return { ok: true, blocked: false, status: response.status, reason: "" };
      }
      last = GONE.has(response.status) ?
        { ok: false, blocked: false, status: response.status, reason: response.status === 404 ? "Page not found (404)" : "Page removed (410)" } :
        { ok: false, blocked: true, status: response.status, reason: `The site refused the automatic check (${response.status})` };
    } catch (error) {
      const code = errorCode(error);
      if (MISSING_HOST.has(code)) {
        // The domain does not exist: no point trying again.
        return { ok: false, blocked: false, status: 0, reason: "This web address does not exist" };
      }
      const message = error instanceof Error ? error.message : String(error);
      last = {
        ok: false,
        blocked: true,
        status: 0,
        reason: /timeout|aborted/i.test(message) ? "No answer within 15 seconds" : "The site did not answer the automatic check",
      };
    }
  }
  return last;
}

/** Runs tasks with at most `limit` at a time. */
export async function inBatches<T, R>(items: T[], limit: number, run: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await run(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}
