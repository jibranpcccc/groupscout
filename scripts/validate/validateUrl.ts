/**
 * Shared HTTP helper for link validation. Honest user agent, timeouts,
 * limited retries with backoff, per-request error isolation.
 */
import { validationConfig } from '../../src/config/discovery';

export const VALIDATOR_UA =
  'community-directory-link-validator/0.1 (+public directory link health check; not a scraper)';

export interface FetchOutcome {
  ok: boolean;
  status: number | null;
  finalUrl: string;
  /** 'timeout' | 'network' | 'http' | 'blocked' */
  errorKind: 'timeout' | 'network' | 'http' | 'blocked' | null;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export async function fetchWithRetry(url: string): Promise<FetchOutcome> {
  let lastErrorKind: FetchOutcome['errorKind'] = null;
  let lastStatus: number | null = null;
  let lastFinalUrl = url;

  for (let attempt = 0; attempt <= validationConfig.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), validationConfig.requestTimeoutMs);
      const res = await fetch(url, {
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': VALIDATOR_UA,
          Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        },
      });
      clearTimeout(timer);
      lastStatus = res.status;
      lastFinalUrl = res.url || url;
      const status = res.status;

      if (status === 403 || status === 429) {
        // Bot-blocking is NOT evidence of a dead link.
        return { ok: false, status, finalUrl: lastFinalUrl, errorKind: 'blocked' };
      }
      if (status >= 200 && status < 400) {
        return { ok: true, status, finalUrl: lastFinalUrl, errorKind: null };
      }
      if (status === 404 || status === 410) {
        return { ok: false, status, finalUrl: lastFinalUrl, errorKind: 'http' };
      }
      // Other 4xx/5xx: transient-ish; retry then classify as network/http.
      lastErrorKind = status >= 500 ? 'network' : 'http';
    } catch (err) {
      const aborted = err instanceof Error && err.name === 'AbortError';
      lastErrorKind = aborted ? 'timeout' : 'network';
    }

    if (attempt < validationConfig.maxRetries) {
      await sleep(validationConfig.retryBackoffMs * (attempt + 1));
    }
  }

  return { ok: false, status: lastStatus, finalUrl: lastFinalUrl, errorKind: lastErrorKind ?? 'network' };
}

export async function fetchText(url: string): Promise<{ text: string; outcome: FetchOutcome }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), validationConfig.requestTimeoutMs);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': VALIDATOR_UA, Accept: 'text/html,application/xhtml+xml' },
    });
    const text = await res.text();
    return {
      text,
      outcome: {
        ok: res.ok,
        status: res.status,
        finalUrl: res.url || url,
        errorKind: res.status === 403 || res.status === 429 ? 'blocked' : null,
      },
    };
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    return {
      text: '',
      outcome: {
        ok: false,
        status: null,
        finalUrl: url,
        errorKind: aborted ? 'timeout' : 'network',
      },
    };
  } finally {
    clearTimeout(timer);
  }
}
