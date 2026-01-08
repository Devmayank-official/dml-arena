// Query category definitions and classification logic

export type QueryCategory = 
  | 'coding'
  | 'creative'
  | 'research'
  | 'math'
  | 'writing'
  | 'analysis'
  | 'general';

export interface CategoryInfo {
  id: QueryCategory;
  label: string;
  icon: string;
  color: string;
  keywords: string[];
}

export const QUERY_CATEGORIES: CategoryInfo[] = [
  {
    id: 'coding',
    label: 'Coding',
    icon: '💻',
    color: 'hsl(142 76% 45%)',
    keywords: [
      'code', 'function', 'class', 'api', 'bug', 'error', 'debug', 'programming',
      'javascript', 'typescript', 'python', 'java', 'react', 'node', 'sql', 'database',
      'algorithm', 'data structure', 'git', 'deploy', 'server', 'frontend', 'backend',
      'html', 'css', 'variable', 'array', 'object', 'loop', 'import', 'export',
      'component', 'hook', 'async', 'await', 'promise', 'fetch', 'rest', 'graphql'
    ],
  },
  {
    id: 'creative',
    label: 'Creative',
    icon: '🎨',
    color: 'hsl(280 100% 65%)',
    keywords: [
      'story', 'poem', 'creative', 'imagine', 'fiction', 'write a story', 'character',
      'plot', 'narrative', 'dialogue', 'song', 'lyrics', 'art', 'design', 'creative writing',
      'screenplay', 'script', 'novel', 'short story', 'fantasy', 'sci-fi', 'romance',
      'generate a', 'create a story', 'write me', 'come up with', 'invent'
    ],
  },
  {
    id: 'research',
    label: 'Research',
    icon: '🔬',
    color: 'hsl(217 91% 60%)',
    keywords: [
      'research', 'study', 'science', 'experiment', 'hypothesis', 'data', 'analysis',
      'statistics', 'evidence', 'findings', 'paper', 'journal', 'academic', 'scholar',
      'theory', 'methodology', 'peer review', 'citation', 'source', 'investigate',
      'what is', 'how does', 'why does', 'explain', 'history of', 'origin of'
    ],
  },
  {
    id: 'math',
    label: 'Math',
    icon: '🔢',
    color: 'hsl(45 93% 47%)',
    keywords: [
      'math', 'calculate', 'equation', 'formula', 'algebra', 'calculus', 'geometry',
      'statistics', 'probability', 'number', 'solve', 'derivative', 'integral',
      'matrix', 'vector', 'trigonometry', 'logarithm', 'exponential', 'fraction',
      'percentage', 'ratio', 'arithmetic', 'sum', 'product', 'divide', 'multiply'
    ],
  },
  {
    id: 'writing',
    label: 'Writing',
    icon: '✍️',
    color: 'hsl(190 100% 50%)',
    keywords: [
      'write', 'essay', 'article', 'blog', 'email', 'letter', 'resume', 'cv',
      'cover letter', 'report', 'summary', 'review', 'description', 'content',
      'copywriting', 'marketing', 'proposal', 'presentation', 'document', 'draft',
      'edit', 'proofread', 'grammar', 'rewrite', 'paraphrase', 'summarize'
    ],
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: '📊',
    color: 'hsl(0 84% 60%)',
    keywords: [
      'analyze', 'compare', 'contrast', 'evaluate', 'assess', 'review', 'critique',
      'pros and cons', 'advantages', 'disadvantages', 'strengths', 'weaknesses',
      'benchmark', 'metrics', 'kpi', 'performance', 'insight', 'trend', 'pattern',
      'breakdown', 'examine', 'interpret', 'vs', 'versus', 'better', 'best'
    ],
  },
  {
    id: 'general',
    label: 'General',
    icon: '💬',
    color: 'hsl(215 20% 55%)',
    keywords: [],
  },
];

/**
 * Classifies a query into a category based on keyword matching
 */
export function classifyQuery(query: string): QueryCategory {
  const lowerQuery = query.toLowerCase();
  
  let bestMatch: QueryCategory = 'general';
  let bestScore = 0;
  
  for (const category of QUERY_CATEGORIES) {
    if (category.id === 'general') continue;
    
    let score = 0;
    for (const keyword of category.keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        // Longer keywords get higher scores
        score += keyword.length;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = category.id;
    }
  }
  
  return bestMatch;
}

/**
 * Gets category info by ID
 */
export function getCategoryInfo(categoryId: QueryCategory): CategoryInfo {
  return QUERY_CATEGORIES.find(c => c.id === categoryId) || QUERY_CATEGORIES[QUERY_CATEGORIES.length - 1];
}

/**
 * Gets all categories with counts from a list of queries
 */
export function getCategoryCounts(categories: (QueryCategory | null | undefined)[]): Record<QueryCategory, number> {
  const counts: Record<QueryCategory, number> = {
    coding: 0,
    creative: 0,
    research: 0,
    math: 0,
    writing: 0,
    analysis: 0,
    general: 0,
  };
  
  for (const cat of categories) {
    if (cat && cat in counts) {
      counts[cat]++;
    }
  }
  
  return counts;
}
