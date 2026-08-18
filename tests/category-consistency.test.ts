import { describe, it, expect } from 'vitest';
import {
  enforceCategoryConsistency,
  STRONG_SIGNAL_THRESHOLD,
} from '../scripts/classify/categoryConsistency';

describe('enforceCategoryConsistency', () => {
  it('overrides to crypto-web3 on a strong blockchain/crypto signal', () => {
    const result = enforceCategoryConsistency({
      title: 'Crypto Traders Hub',
      description: 'Blockchain and DeFi signals for Web3 investors',
      tags: ['crypto', 'airdrop'],
      category: 'online-earning',
    });
    expect(result.category).toBe('crypto-web3');
    expect(result.changed).toBe(true);
    expect(result.reason).toMatch(/crypto/);
  });

  it('overrides to forex-stocks on strong forex/trading keywords', () => {
    const result = enforceCategoryConsistency({
      title: 'XAUUSD Trading Signals',
      description: 'Gold futures and options analysis for investors',
      tags: ['stocks', 'forex'],
      category: 'ai-tech',
    });
    expect(result.category).toBe('forex-stocks');
    expect(result.changed).toBe(true);
  });

  it('overrides to ai-tech on a strong AI/LLM signal', () => {
    const result = enforceCategoryConsistency({
      title: 'ChatGPT Developers',
      description: 'Machine learning and prompt engineering for LLM apps',
      tags: ['ai', 'opensource'],
      category: 'deals-coupons',
    });
    expect(result.category).toBe('ai-tech');
    expect(result.changed).toBe(true);
  });

  it('keeps the original category on a weak/ambiguous signal', () => {
    // "ai" and "trading" each give one hit in different categories —
    // below the threshold, so the original category must survive.
    const result = enforceCategoryConsistency({
      title: 'AI Trading Group',
      description: 'Daily market discussion channel',
      tags: ['discussion'],
      category: 'forex-stocks',
    });
    expect(result.category).toBe('forex-stocks');
    expect(result.changed).toBe(false);
    expect(result.reason).toBeUndefined();
    expect(STRONG_SIGNAL_THRESHOLD).toBe(2);
  });

  it('overrides to deals-coupons on a strong deals signal', () => {
    const result = enforceCategoryConsistency({
      title: 'SaaS Deals Newsletter',
      description: 'Daily coupons and freebies',
      tags: ['courses'],
      category: 'crypto-web3',
    });
    expect(result.category).toBe('deals-coupons');
    expect(result.changed).toBe(true);
  });

  it('assigns a category when the original is null and the signal is strong', () => {
    const result = enforceCategoryConsistency({
      title: 'Memecoin Airdrops',
      description: 'New web3 token launches',
      tags: [],
      category: null,
    });
    expect(result.category).toBe('crypto-web3');
    expect(result.changed).toBe(true);
  });

  it('reports unchanged when the record already matches the detected category', () => {
    const result = enforceCategoryConsistency({
      title: 'Crypto Signals',
      description: 'Blockchain news',
      tags: ['defi'],
      category: 'crypto-web3',
    });
    expect(result.category).toBe('crypto-web3');
    expect(result.changed).toBe(false);
  });

  it('does not match short keywords inside longer words', () => {
    const result = enforceCategoryConsistency({
      title: 'Email Marketers Community',
      description: 'Plain discussion group',
      tags: [],
      category: 'online-earning',
    });
    // "email" must not count as an "ai" hit; no category reaches the
    // threshold, so the original category is kept.
    expect(result.category).toBe('online-earning');
    expect(result.changed).toBe(false);
  });
});
