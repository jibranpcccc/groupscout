/**
 * `npm run data:stats` — dataset summary, all values computed from real data.
 */
import 'dotenv/config';
import { loadPublished, loadPending } from './io';
import type { Community } from '../../src/types/community';

function main(): void {
  const published = loadPublished() as Community[];
  const pending = loadPending() as Community[];

  const byPlatform = (id: string): number => published.filter((c) => c.platform === id).length;
  const byStatus = (s: Community['linkStatus']): number => published.filter((c) => c.linkStatus === s).length;
  const withMembers = published.filter((c) => c.memberCount != null).length;

  console.log(`Total published: ${published.length}`);
  console.log(`Pending: ${pending.length}`);
  console.log(`Telegram: ${byPlatform('telegram')}`);
  console.log(`Discord: ${byPlatform('discord')}`);
  console.log(`WhatsApp: ${byPlatform('whatsapp')}`);
  console.log(`Active: ${byStatus('active')}`);
  console.log(`Unknown: ${byStatus('unknown')}`);
  console.log(`Dead: ${byStatus('dead')}`);
  console.log(`Reported: ${byStatus('reported')}`);
  console.log(`Removed: ${byStatus('removed')}`);
  console.log(`With sourced member counts: ${withMembers}`);
}

main();
