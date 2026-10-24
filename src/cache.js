'use strict';

/** Tiny TTL cache with a size cap; the oldest entry is evicted first. */
class TtlCache {
  constructor(max = 200, ttlMs = 600000) { this.max = max; this.ttl = ttlMs; this.map = new Map(); }
  get(key) {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (e.exp < Date.now()) { this.map.delete(key); return undefined; }
    return e.val;
  }
  set(key, val) {
    if (this.map.size >= this.max) this.map.delete(this.map.keys().next().value);
    this.map.set(key, { val, exp: Date.now() + this.ttl });
  }
}

module.exports = { TtlCache };
