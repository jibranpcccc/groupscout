/**
 * Client-side directory view: search, filter, sort and paginate over the
 * embedded static dataset. No framework, no network requests — directory
 * content is always present in the rendered HTML (no-JS fallback included).
 *
 * Pages mount it like this:
 *   <div id="directory-view" data-base="/communities/" data-page-size="24">
 *     <script type="application/json" id="directory-data" set:html={jsonForClient(communities)} />
 *     ...server-rendered first page...
 *   </div>
 *   <script> import { initDirectoryView } from '../scripts/directory'; initDirectoryView(); </script>
 */

import type { Community } from '../types/community';

export interface DirectoryMountConfig {
  base: string;
  pageSize: number;
  hasMemberCounts: boolean;
  showSort: boolean;
}

const VIEW_ID = 'directory-view';
const DATA_ID = 'directory-data';

const STOP_WORDS = new Set(['a', 'an', 'the', 'of', 'for', 'and', 'or', 'in', 'on', 'with', 'to', 'at', 'by', 'is', 'are']);

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ');
}

function tokens(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter((t) => !STOP_WORDS.has(t));
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
}

function matchesQuery(community: Community, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const queryTokens = tokens(q);
  if (queryTokens.length === 0) return true;
  const haystack = [
    community.title,
    community.category,
    community.subcategory ?? '',
    ...community.tags,
    community.description ?? '',
    community.platform,
    community.language ?? '',
    community.country ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return queryTokens.every((t) => haystack.includes(t));
}

interface Filters {
  q: string;
  platform: string;
  category: string;
  tag: string;
  language: string;
  accessType: string;
  verification: string;
  linkStatus: string;
  sort: string;
  page: number;
}

function readFilters(params: URLSearchParams): Filters {
  const pick = (key: string): string => (params.get(key)?.trim() || '').toLowerCase();
  const page = Number.parseInt(params.get('page') ?? '1', 10);
  return {
    q: params.get('q')?.trim() ?? '',
    platform: pick('platform'),
    category: pick('category'),
    tag: pick('tag'),
    language: pick('language'),
    accessType: pick('accessType'),
    verification: pick('verification'),
    linkStatus: pick('linkStatus'),
    sort: pick('sort') || 'newest',
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

function sortCommunities(communities: Community[], sort: string): Community[] {
  const arr = [...communities];
  switch (sort) {
    case 'alphabetical':
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case 'recently-checked':
      return arr.sort((a, b) => (b.lastCheckedAt ?? '').localeCompare(a.lastCheckedAt ?? ''));
    case 'member-count':
      return arr.sort((a, b) => (b.memberCount ?? -1) - (a.memberCount ?? -1));
    case 'newest':
    default:
      return arr.sort((a, b) => b.discoveredAt.localeCompare(a.discoveredAt));
  }
}

function renderCard(community: Community): string {
  const checked = formatDate(community.lastCheckedAt);
  const memberCount =
    community.memberCount != null ? `${community.memberCount.toLocaleString()} members` : '';
  const statusLabel =
    community.linkStatus === 'active'
      ? 'Link active'
      : community.linkStatus === 'dead'
        ? 'Invite unavailable'
        : community.linkStatus === 'reported'
          ? 'Reported'
          : community.linkStatus === 'removed'
            ? 'Removed'
            : 'Status unknown';

  return `
  <article class="card flex flex-col p-5 transition-shadow hover:shadow-md">
    <div class="flex items-start justify-between gap-3">
      <span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium text-stone-600 bg-stone-50 border-stone-200">
        ${escapeHtml(community.platform)}
      </span>
      <div class="flex items-center gap-1.5">
        ${community.featured ? '<span class="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">Featured</span>' : ''}
      </div>
    </div>
    <h2 class="mt-3 text-lg font-semibold leading-snug text-stone-900">
      <a href="/group/${escapeHtml(community.slug)}/" class="hover:text-blue-700">${escapeHtml(community.title)}</a>
    </h2>
    <p class="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-600">${escapeHtml(community.description ?? `A publicly listed ${community.platform} community categorized under ${community.category}.`)}</p>
    <div class="mt-3 flex flex-wrap items-center gap-1.5">
      <a href="/category/${escapeHtml(community.category)}/" class="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-xs font-medium text-stone-700 hover:border-blue-300 hover:text-blue-700">${escapeHtml(community.category)}</a>
      ${community.tags.slice(0, 3).map((tag) => `<a href="/tag/${escapeHtml(slugifyTag(tag))}/" class="rounded-full border border-stone-200 px-2.5 py-0.5 text-xs font-medium text-stone-600 hover:border-blue-300 hover:text-blue-700">${escapeHtml(tag)}</a>`).join('')}
    </div>
    <dl class="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
      ${memberCount ? `<div class="flex items-center gap-1"><dt class="sr-only">Member count</dt><dd class="font-medium text-stone-700">${escapeHtml(memberCount)}</dd></div>` : ''}
      ${checked ? `<div class="flex items-center gap-1"><dt class="sr-only">Last checked</dt><dd>Last checked ${escapeHtml(checked)}</dd></div>` : ''}
      <div class="flex items-center gap-1"><dt class="sr-only">Link status</dt><dd>${escapeHtml(statusLabel)}</dd></div>
    </dl>
    <div class="mt-4 flex items-center gap-2 border-t border-stone-100 pt-4">
      <a href="/group/${escapeHtml(community.slug)}/" class="btn-secondary px-3 py-1.5 text-xs">View Details</a>
      <a href="${escapeHtml(community.inviteUrl)}" target="_blank" rel="noopener noreferrer" class="btn-primary px-3 py-1.5 text-xs">Visit Community</a>
    </div>
  </article>`;
}

export function initDirectoryView(): void {
  const mount = document.getElementById(VIEW_ID);
  const dataEl = document.getElementById(DATA_ID);
  if (!mount || !dataEl) return;

  // Narrowed reference for use inside closures (TS keeps the non-null type).
  const root: HTMLElement = mount;

  let communities: Community[];
  try {
    communities = JSON.parse(dataEl.textContent ?? '[]') as Community[];
  } catch {
    console.error('[directory] invalid embedded dataset');
    return;
  }

  const base = mount.dataset.base ?? '/communities/';
  const pageSize = Number.parseInt(mount.dataset.pageSize ?? '24', 10) || 24;

  const resultsSummary = document.querySelector('[data-directory-summary]');
  const pager = document.querySelector('[data-directory-pager]');

  function apply(): void {
    const filters = readFilters(new URLSearchParams(window.location.search));

    let filtered = communities.filter((c) => {
      if (filters.platform && c.platform !== filters.platform) return false;
      if (filters.category && c.category !== filters.category) return false;
      if (filters.tag && !c.tags.some((t) => slugifyTag(t) === filters.tag)) return false;
      if (filters.language && (c.language ?? '').toLowerCase() !== filters.language) return false;
      if (filters.accessType && (c.accessType ?? 'unknown') !== filters.accessType) return false;
      if (filters.verification && c.verificationStatus !== filters.verification) return false;
      if (filters.linkStatus && c.linkStatus !== filters.linkStatus) return false;
      return matchesQuery(c, filters.q);
    });

    filtered = sortCommunities(filtered, filters.sort);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const page = Math.min(filters.page, totalPages);
    const start = (page - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    root.innerHTML = pageItems.length
      ? pageItems.map(renderCard).join('')
      : `<div class="col-span-full">
           <div class="card flex flex-col items-center gap-4 p-10 text-center">
             <p class="font-medium text-stone-800">No communities match these filters yet.</p>
             <div class="flex flex-wrap items-center justify-center gap-2">
               <a href="/communities/" class="btn-secondary text-sm">Clear filters</a>
               <a href="/submit/" class="btn-primary text-sm">Submit a community</a>
             </div>
           </div>
         </div>`;

    if (resultsSummary) {
      const rangeLabel =
        filtered.length === 0
          ? '0 results'
          : `Showing ${start + 1}–${Math.min(start + pageSize, filtered.length)} of ${filtered.length}`;
      resultsSummary.textContent = rangeLabel;
    }

    if (pager) {
      if (totalPages <= 1) {
        pager.innerHTML = '';
      } else {
        const makeLink = (p: number, label: string, disabled: boolean, active = false): string => {
          if (disabled) {
            return `<span class="inline-flex items-center rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-400">${label}</span>`;
          }
          const url = new URL(window.location.href);
          url.searchParams.set('page', String(p));
          return `<a href="${escapeHtml(url.pathname + url.search)}" data-page="${p}" aria-current="${active ? 'page' : 'false'}" class="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium ${active ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-stone-200 bg-surface text-stone-600 hover:border-blue-300 hover:text-blue-700'}">${escapeHtml(label)}</a>`;
        };
        const prev = makeLink(page - 1, 'Previous', page === 1);
        const next = makeLink(page + 1, 'Next', page === totalPages);
        const numbers: string[] = [];
        for (let p = 1; p <= totalPages; p++) {
          if (totalPages > 9 && p !== 1 && p !== totalPages && Math.abs(p - page) > 2) {
            if (numbers[numbers.length - 1] !== '…') numbers.push('…');
            continue;
          }
          numbers.push(makeLink(p, String(p), false, p === page));
        }
        pager.innerHTML = `<nav aria-label="Pagination" class="flex flex-wrap items-center gap-2">${prev}${numbers.join('')}${next}</nav>`;
        pager.querySelectorAll<HTMLAnchorElement>('a[data-page]').forEach((a) => {
          a.addEventListener('click', (e) => {
            e.preventDefault();
            const url = new URL(window.location.href);
            url.searchParams.set('page', a.dataset.page ?? '1');
            window.history.replaceState({}, '', url.pathname + url.search);
            apply();
            document.getElementById(VIEW_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        });
      }
    }
  }

  // Intercept the filter form submit to update the URL client-side.
  const form = document.querySelector<HTMLFormElement>('form[data-directory-form]');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const params = new URLSearchParams(new FormData(form as HTMLFormElement) as unknown as URLSearchParams);
    // Drop "all" placeholders and empty values.
    for (const [k, v] of [...params.entries()]) {
      if (!v || v === 'all') params.delete(k);
    }
    if (params.get('sort') === 'newest') params.delete('sort');
    window.history.replaceState({}, '', `${base}${params.toString() ? `?${params.toString()}` : ''}`);
    apply();
  });

  // Sync select values with current filters.
  const filters = readFilters(new URLSearchParams(window.location.search));
  form?.querySelectorAll<HTMLSelectElement>('select[name]').forEach((select) => {
    const value = select.name === 'sort' ? filters.sort : filters[select.name as keyof Filters];
    if (typeof value === 'string' && value) select.value = value;
  });

  apply();
}

/** JSON for the embedded dataset script tag (safe against `</script>` breakout). */
export function jsonForClient(communities: Community[]): string {
  return JSON.stringify(communities).replace(/</g, '\\u003c');
}
