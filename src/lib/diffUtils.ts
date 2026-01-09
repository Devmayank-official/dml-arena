// Word-level diff utilities for comparing AI responses

export interface DiffSegment {
  type: 'equal' | 'insert' | 'delete';
  value: string;
}

// Simple word-level diff algorithm
export function computeWordDiff(text1: string, text2: string): { left: DiffSegment[]; right: DiffSegment[] } {
  const words1 = tokenize(text1);
  const words2 = tokenize(text2);
  
  // Use LCS (Longest Common Subsequence) approach
  const lcs = computeLCS(words1, words2);
  
  const left: DiffSegment[] = [];
  const right: DiffSegment[] = [];
  
  let i = 0, j = 0, k = 0;
  
  while (i < words1.length || j < words2.length) {
    if (k < lcs.length && i < words1.length && j < words2.length && 
        words1[i] === lcs[k] && words2[j] === lcs[k]) {
      // Common word
      left.push({ type: 'equal', value: words1[i] });
      right.push({ type: 'equal', value: words2[j] });
      i++; j++; k++;
    } else {
      // Check if current word in text1 is part of LCS
      const in1 = k < lcs.length && words1[i] !== lcs[k];
      const in2 = k < lcs.length && words2[j] !== lcs[k];
      
      if (i < words1.length && (j >= words2.length || in1)) {
        left.push({ type: 'delete', value: words1[i] });
        i++;
      }
      if (j < words2.length && (i >= words1.length || in2)) {
        right.push({ type: 'insert', value: words2[j] });
        j++;
      }
      
      // Safety break if both are past
      if (i >= words1.length && j >= words2.length) break;
    }
  }
  
  // Merge consecutive segments of same type
  return {
    left: mergeSegments(left),
    right: mergeSegments(right),
  };
}

function tokenize(text: string): string[] {
  // Split on whitespace but preserve it in results for proper formatting
  return text.split(/(\s+)/).filter(Boolean);
}

function computeLCS(arr1: string[], arr2: string[]): string[] {
  const m = arr1.length;
  const n = arr2.length;
  
  // Create DP table
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // Backtrack to find LCS
  const lcs: string[] = [];
  let i = m, j = n;
  
  while (i > 0 && j > 0) {
    if (arr1[i - 1] === arr2[j - 1]) {
      lcs.unshift(arr1[i - 1]);
      i--; j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  
  return lcs;
}

function mergeSegments(segments: DiffSegment[]): DiffSegment[] {
  if (segments.length === 0) return [];
  
  const merged: DiffSegment[] = [segments[0]];
  
  for (let i = 1; i < segments.length; i++) {
    const last = merged[merged.length - 1];
    const current = segments[i];
    
    if (last.type === current.type) {
      last.value += current.value;
    } else {
      merged.push(current);
    }
  }
  
  return merged;
}

// Get similarity percentage between two texts
export function getSimilarityPercentage(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/).filter(Boolean);
  const words2 = text2.toLowerCase().split(/\s+/).filter(Boolean);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  if (union.size === 0) return 100;
  return Math.round((intersection.size / union.size) * 100);
}
