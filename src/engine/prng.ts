// Seeded pseudo-random number generator (Mulberry32)
export class PRNG {
  private state: number;

  constructor(seed: number = 1337) {
    this.state = seed >>> 0;
  }

  // Returns pseudo-random float in [0, 1)
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Returns integer in [min, max]
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Choose an item from an array
  choice<T>(items: T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }

  // Reseed the generator
  seed(newSeed: number): void {
    this.state = newSeed >>> 0;
  }

  // Get current state
  getState(): number {
    return this.state;
  }
}
