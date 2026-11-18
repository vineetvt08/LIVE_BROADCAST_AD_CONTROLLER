import { describe, it, expect } from 'vitest';
import {
  disjointPairsPIE,
  bruteForceDisjointPairs,
  computeRookPolynomial,
  bruteForceRookBoard,
  derangementCount,
  factorial,
  combination
} from '../src/engine/math/combinatorics';

describe('Combinatorics & Formula Verifications', () => {
  it('verifies factorials and combinations', () => {
    expect(factorial(0)).toBe(1);
    expect(factorial(4)).toBe(24);
    expect(factorial(5)).toBe(120);
    expect(combination(5, 2)).toBe(10);
    expect(combination(6, 3)).toBe(20);
  });

  describe('Principle of Inclusion-Exclusion (PIE) vs Brute Force', () => {
    it('verifies PIE formula for n=4 with m=1 disjoint pair', () => {
      // 4 slots, 1 rival pair (0, 1) cannot be adjacent
      // PIE: N = 4! - C(1,1)*2^1*3! = 24 - 12 = 12
      const pie = disjointPairsPIE(4, 1);
      const bf = bruteForceDisjointPairs(4, [[0, 1]]);
      expect(pie.count).toBe(12);
      expect(pie.count).toBe(bf);
    });

    it('verifies PIE formula for n=4 with m=2 disjoint pairs', () => {
      // 4 slots, 2 disjoint pairs: (0, 1) and (2, 3)
      // k=0: 4! = 24
      // k=1: - C(2,1)*2^1 * 3! = - 2 * 2 * 6 = -24
      // k=2: + C(2,2)*2^2 * 2! = + 1 * 4 * 2 = +8
      // N = 24 - 24 + 8 = 8
      const pie = disjointPairsPIE(4, 2);
      const bf = bruteForceDisjointPairs(4, [[0, 1], [2, 3]]);
      expect(pie.count).toBe(8);
      expect(pie.count).toBe(bf);
    });

    it('verifies PIE formula for n=5 with m=2 disjoint pairs', () => {
      // 5 slots, 2 disjoint pairs: (0, 1) and (2, 3)
      // k=0: 5! = 120
      // k=1: - C(2,1)*2^1 * 4! = - 2 * 2 * 24 = -96
      // k=2: + C(2,2)*2^2 * 3! = + 1 * 4 * 6 = +24
      // N = 120 - 96 + 24 = 48
      const pie = disjointPairsPIE(5, 2);
      const bf = bruteForceDisjointPairs(5, [[0, 1], [2, 3]]);
      expect(pie.count).toBe(48);
      expect(pie.count).toBe(bf);
    });
  });

  describe('Rook Polynomials on Forbidden Board vs Brute Force', () => {
    it('verifies Rook Polynomial N(B) on a 3x3 board with diagonal forbidden', () => {
      // Forbidden on diagonal (0,0), (1,1), (2,2) -> Derangement of 3!
      const board = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ];
      const result = computeRookPolynomial(board);
      const bf = bruteForceRookBoard(board);
      // !3 = 2
      expect(result.validPermutations).toBe(2);
      expect(result.validPermutations).toBe(bf);
    });

    it('verifies Rook Polynomial N(B) on arbitrary 4x4 forbidden board', () => {
      const board = [
        [1, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 1],
        [0, 0, 0, 0]
      ];
      const result = computeRookPolynomial(board);
      const bf = bruteForceRookBoard(board);
      expect(result.validPermutations).toBe(bf);
    });
  });

  describe('Derangements (Subfactorials)', () => {
    it('matches known mathematical derangement values !n', () => {
      expect(derangementCount(0)).toBe(1);
      expect(derangementCount(1)).toBe(0);
      expect(derangementCount(2)).toBe(1);
      expect(derangementCount(3)).toBe(2);
      expect(derangementCount(4)).toBe(9);
      expect(derangementCount(5)).toBe(44);
      expect(derangementCount(6)).toBe(265);
    });
  });
});
