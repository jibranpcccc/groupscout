/**
 * URL normalization — canonical implementation lives in src/lib/urls.ts
 * (shared with the website build). Re-exported here so data scripts use
 * exactly the same rules as the site.
 */
export {
  normalizeInviteUrl,
  platformIdentityKey,
  detectPlatform,
  isValidPlatform,
  isHttpUrl,
} from '../../src/lib/urls';
