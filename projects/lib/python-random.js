'use strict';

// Python's random.random(), seeded exactly like random.seed(), so ports of
// scripts that seed their randomness produce the same values as the original.
//
//   const random = pythonRandom(seed);   // seed: integer, BigInt or string
//   random();                            // same sequence as Python
//
// Integers seed MT19937 via init_by_array with their 32-bit words, least
// significant first. Strings are first turned into an integer as Python 3 does:
// int.from_bytes(utf8 + sha512(utf8)).

function pythonRandom(seed) {
  const N = 624;
  const mt = new Uint32Array(N);
  let mti = N;

  function initGenrand(s) {
    mt[0] = s >>> 0;
    for (mti = 1; mti < N; mti++) {
      const prev = mt[mti - 1] ^ (mt[mti - 1] >>> 30);
      mt[mti] = (Math.imul(1812433253, prev) + mti) >>> 0;
    }
  }

  function initByArray(key) {
    initGenrand(19650218);
    let i = 1;
    let j = 0;
    for (let k = Math.max(N, key.length); k; k--) {
      const prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = ((mt[i] ^ Math.imul(prev, 1664525)) + key[j] + j) >>> 0;
      i++;
      j++;
      if (i >= N) { mt[0] = mt[N - 1]; i = 1; }
      if (j >= key.length) j = 0;
    }
    for (let k = N - 1; k; k--) {
      const prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = ((mt[i] ^ Math.imul(prev, 1566083941)) - i) >>> 0;
      i++;
      if (i >= N) { mt[0] = mt[N - 1]; i = 1; }
    }
    mt[0] = 0x80000000;
  }

  function genrand() {
    if (mti >= N) {
      for (let k = 0; k < N; k++) {
        const y = (mt[k] & 0x80000000) | (mt[(k + 1) % N] & 0x7fffffff);
        mt[k] = mt[(k + 397) % N] ^ (y >>> 1) ^ (y & 1 ? 0x9908b0df : 0);
      }
      mti = 0;
    }
    let y = mt[mti++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return y >>> 0;
  }

  let n;
  if (typeof seed === 'string') {
    const bytes = new TextEncoder().encode(seed);
    n = 0n;
    for (const b of [...bytes, ...sha512(bytes)]) n = (n << 8n) | BigInt(b);
  } else {
    n = BigInt(seed);
    if (n < 0n) n = -n;
  }

  const key = [];
  do {
    key.push(Number(n & 0xffffffffn));
    n >>= 32n;
  } while (n > 0n);
  initByArray(key);

  return () => ((genrand() >>> 5) * 67108864 + (genrand() >>> 6)) / 9007199254740992;
}

// SHA-512 (FIPS 180-4) on 64-bit BigInt words. Only used to seed from strings,
// so clarity matters more than speed. The round constants are the first 64
// bits of the fractional parts of the cube roots of the first 80 primes, and
// the initial hash those of the square roots of the first 8 primes; they are
// computed here rather than written out.
const sha512 = (() => {
  const MASK = (1n << 64n) - 1n;

  function iroot(n, k) {
    // Integer k-th root by Newton's method, starting from above.
    let x = 1n << BigInt(Math.ceil(n.toString(2).length / Number(k)));
    for (;;) {
      const y = ((k - 1n) * x + n / x ** (k - 1n)) / k;
      if (y >= x) return x;
      x = y;
    }
  }

  const primes = [];
  for (let p = 2; primes.length < 80; p++) {
    if (primes.every((q) => p % q)) primes.push(p);
  }
  const K = primes.map((p) => iroot(BigInt(p) << 192n, 3n) & MASK);
  const H0 = primes.slice(0, 8).map((p) => iroot(BigInt(p) << 128n, 2n) & MASK);

  const rotr = (x, r) => ((x >> r) | (x << (64n - r))) & MASK;

  return function sha512(bytes) {
    const bitLength = BigInt(bytes.length) * 8n;
    const padded = new Uint8Array(Math.ceil((bytes.length + 17) / 128) * 128);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    for (let i = 0; i < 16; i++) {
      padded[padded.length - 1 - i] = Number((bitLength >> BigInt(8 * i)) & 0xffn);
    }

    const H = [...H0];
    const W = new Array(80);
    for (let block = 0; block < padded.length; block += 128) {
      for (let t = 0; t < 16; t++) {
        let w = 0n;
        for (let b = 0; b < 8; b++) w = (w << 8n) | BigInt(padded[block + t * 8 + b]);
        W[t] = w;
      }
      for (let t = 16; t < 80; t++) {
        const s0 = rotr(W[t - 15], 1n) ^ rotr(W[t - 15], 8n) ^ (W[t - 15] >> 7n);
        const s1 = rotr(W[t - 2], 19n) ^ rotr(W[t - 2], 61n) ^ (W[t - 2] >> 6n);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) & MASK;
      }

      let [a, b, c, d, e, f, g, h] = H;
      for (let t = 0; t < 80; t++) {
        const S1 = rotr(e, 14n) ^ rotr(e, 18n) ^ rotr(e, 41n);
        const ch = (e & f) ^ (~e & MASK & g);
        const t1 = (h + S1 + ch + K[t] + W[t]) & MASK;
        const S0 = rotr(a, 28n) ^ rotr(a, 34n) ^ rotr(a, 39n);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) & MASK;
        h = g;
        g = f;
        f = e;
        e = (d + t1) & MASK;
        d = c;
        c = b;
        b = a;
        a = (t1 + t2) & MASK;
      }
      [a, b, c, d, e, f, g, h].forEach((v, i) => { H[i] = (H[i] + v) & MASK; });
    }

    const out = new Uint8Array(64);
    H.forEach((v, i) => {
      for (let b = 0; b < 8; b++) out[i * 8 + b] = Number((v >> BigInt(56 - 8 * b)) & 0xffn);
    });
    return out;
  };
})();
