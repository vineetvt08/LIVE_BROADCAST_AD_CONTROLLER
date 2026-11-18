/**
 * Pure Mathematical & Combinatorial Modules for MCR Guard
 * Covers:
 * 1. Principle of Inclusion-Exclusion (PIE) for Disjoint Rival Pairs
 * 2. General Adjacency Forbidden Permutations via Backtracking
 * 3. Rook Polynomials on Cross-Pod Forbidden Boards
 * 4. Derangements (Subfactorials !n)
 */

// Factorial helper
export function factorial(n: number): number {
  if (n < 0) return 0;
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

// Combinations n choose k: C(n, k)
export function combination(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  if (k > n / 2) k = n - k;
  let res = 1;
  for (let i = 1; i <= k; i++) {
    res = (res * (n - i + 1)) / i;
  }
  return Math.round(res);
}

/**
 * Inclusion-Exclusion for m disjoint rival pairs among n slots:
 * N = sum_{k=0}^m (-1)^k * C(m, k) * 2^k * (n - k)!
 * 
 * Each of the m pairs represents two brands that cannot appear adjacent.
 * If the pairs are disjoint, choosing k pairs to be forced together can be done
 * in C(m, k) ways, each contracted pair has 2 internal orderings (AB or BA),
 * leaving (n - k) items to permute.
 */
export function disjointPairsPIE(n: number, m: number): {
  count: number;
  terms: { k: number; sign: number; comb: number; twoPower: number; fact: number; termValue: number }[];
  formulaLatex: string;
} {
  if (m < 0 || n < 0 || 2 * m > n) {
    // Cannot have more disjoint pairs than n/2 items
    m = Math.max(0, Math.min(m, Math.floor(n / 2)));
  }

  let total = 0;
  const terms: { k: number; sign: number; comb: number; twoPower: number; fact: number; termValue: number }[] = [];

  for (let k = 0; k <= m; k++) {
    const sign = k % 2 === 0 ? 1 : -1;
    const comb = combination(m, k);
    const twoPower = Math.pow(2, k);
    const fact = factorial(n - k);
    const termValue = sign * comb * twoPower * fact;
    total += termValue;

    terms.push({
      k,
      sign,
      comb,
      twoPower,
      fact,
      termValue
    });
  }

  const formulaLatex = `N = \\sum_{k=0}^{${m}} (-1)^k \\binom{${m}}{k} 2^k (${n} - k)! = ${total}`;

  return {
    count: total,
    terms,
    formulaLatex
  };
}

/**
 * Brute-force enumeration to verify disjoint rival pairs count.
 * Generates all n! permutations and filters those where no disjoint pair is adjacent.
 * disjointPairs are 0-based indices e.g. [[0, 1], [2, 3]]
 */
export function bruteForceDisjointPairs(n: number, disjointPairs: [number, number][]): number {
  const items = Array.from({ length: n }, (_, i) => i);
  let validCount = 0;

  function permute(arr: number[], l: number): void {
    if (l === arr.length) {
      // Check if any forbidden pair is adjacent
      let hasClash = false;
      for (let i = 0; i < arr.length - 1; i++) {
        const a = arr[i];
        const b = arr[i + 1];
        for (const [p1, p2] of disjointPairs) {
          if ((a === p1 && b === p2) || (a === p2 && b === p1)) {
            hasClash = true;
            break;
          }
        }
        if (hasClash) break;
      }
      if (!hasClash) validCount++;
      return;
    }

    for (let i = l; i < arr.length; i++) {
      [arr[l], arr[i]] = [arr[i], arr[l]];
      permute(arr, l + 1);
      [arr[l], arr[i]] = [arr[i], arr[l]];
    }
  }

  permute(items, 0);
  return validCount;
}

/**
 * General Adjacency Forbidden Permutations via Backtracking.
 * Handles ANY arbitrary rival graph (including non-disjoint triangles, stars, etc.).
 * forbiddenMatrix[u][v] === true if u cannot be immediately adjacent to v.
 */
export function countValidGeneralPermutations(n: number, forbiddenAdjacency: boolean[][]): number {
  const used = new Array(n).fill(false);
  let validCount = 0;

  function backtrack(pos: number, lastItem: number): void {
    if (pos === n) {
      validCount++;
      return;
    }

    for (let i = 0; i < n; i++) {
      if (!used[i]) {
        if (pos > 0 && forbiddenAdjacency[lastItem][i]) {
          continue; // Forbidden adjacent pair
        }
        used[i] = true;
        backtrack(pos + 1, i);
        used[i] = false;
      }
    }
  }

  for (let first = 0; first < n; first++) {
    used[first] = true;
    backtrack(1, first);
    used[first] = false;
  }

  return validCount;
}

/**
 * Rook Polynomials on Cross-Pod Forbidden Board:
 * Board B is an n x n binary matrix where B[i][j] = 1 indicates cell (i, j) is forbidden.
 * (e.g. brand j cannot be placed in slot index i due to category clash with previous pod).
 * 
 * r_k is the number of ways to place k non-attacking rooks on the forbidden cells of B.
 * Then the number of placements avoiding all forbidden cells is:
 * N(B) = sum_{k=0}^n (-1)^k * r_k * (n - k)!
 */
export function computeRookPolynomial(board: number[][]): {
  coefficients: number[]; // r_0, r_1, ..., r_n
  validPermutations: number; // N(B)
  polynomialLatex: string;
  evaluationLatex: string;
} {
  const n = board.length;
  // Collect all forbidden cells coordinates
  const forbiddenCells: [number, number][] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (board[r][c] === 1) {
        forbiddenCells.push([r, c]);
      }
    }
  }

  // Count ways to place k non-attacking rooks on forbiddenCells
  const rCoefficients = new Array(n + 1).fill(0);
  rCoefficients[0] = 1; // Always 1 way to place 0 rooks

  // Subsets backtracking for rooks
  function placeRooks(
    cellIdx: number,
    k: number,
    usedRows: Set<number>,
    usedCols: Set<number>
  ): void {
    if (k > 0) {
      rCoefficients[k]++;
    }
    if (k === n) return;

    for (let idx = cellIdx; idx < forbiddenCells.length; idx++) {
      const [row, col] = forbiddenCells[idx];
      if (!usedRows.has(row) && !usedCols.has(col)) {
        usedRows.add(row);
        usedCols.add(col);
        placeRooks(idx + 1, k + 1, usedRows, usedCols);
        usedRows.delete(row);
        usedCols.delete(col);
      }
    }
  }

  placeRooks(0, 0, new Set(), new Set());

  // Compute N(B) = sum_{k=0}^n (-1)^k * r_k * (n - k)!
  let totalValid = 0;
  const polyTerms: string[] = [];
  const evalTerms: string[] = [];

  for (let k = 0; k <= n; k++) {
    const r_k = rCoefficients[k];
    if (r_k > 0) {
      polyTerms.push(k === 0 ? '1' : `${r_k}x^{${k}}`);
    }
    const sign = k % 2 === 0 ? 1 : -1;
    const fact = factorial(n - k);
    const termVal = sign * r_k * fact;
    totalValid += termVal;

    evalTerms.push(
      `${sign > 0 ? '+' : '-'}${r_k} \\cdot (${n} - ${k})!`
    );
  }

  const polynomialLatex = `R(x, B) = ${polyTerms.join(' + ')}`;
  const evaluationLatex = `N(B) = \\sum_{k=0}^{${n}} (-1)^k r_k (${n} - k)! = ${totalValid}`;

  return {
    coefficients: rCoefficients,
    validPermutations: Math.max(0, totalValid),
    polynomialLatex,
    evaluationLatex
  };
}

/**
 * Brute-force verification for Rook Board valid assignments.
 * Tests all n! permutations pi: checks if board[i][pi[i]] === 0 for all i.
 */
export function bruteForceRookBoard(board: number[][]): number {
  const n = board.length;
  const items = Array.from({ length: n }, (_, i) => i);
  let validCount = 0;

  function permute(arr: number[], l: number): void {
    if (l === arr.length) {
      let isAllowed = true;
      for (let i = 0; i < n; i++) {
        if (board[i][arr[i]] === 1) {
          isAllowed = false;
          break;
        }
      }
      if (isAllowed) validCount++;
      return;
    }

    for (let i = l; i < arr.length; i++) {
      [arr[l], arr[i]] = [arr[i], arr[l]];
      permute(arr, l + 1);
      [arr[l], arr[i]] = [arr[i], arr[l]];
    }
  }

  permute(items, 0);
  return validCount;
}

/**
 * Derangements (Subfactorial !n):
 * Number of permutations of n elements where no element appears in its original position.
 * !0 = 1, !1 = 0, !2 = 1, !3 = 2, !4 = 9, !5 = 44, etc.
 * Recurrence: d_n = (n - 1) * (d_{n-1} + d_{n-2})
 * Formula: round(n! / e)
 */
export function derangementCount(n: number): number {
  if (n < 0) return 0;
  if (n === 0) return 1;
  if (n === 1) return 0;
  let d0 = 1;
  let d1 = 0;
  let dn = 0;
  for (let i = 2; i <= n; i++) {
    dn = (i - 1) * (d1 + d0);
    d0 = d1;
    d1 = dn;
  }
  return dn;
}

/**
 * Count permutations of arr that share zero fixed points with a reference array.
 */
export function countDerangementsAgainst(ref: string[]): number {
  return derangementCount(ref.length);
}
