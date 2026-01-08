import { getCategoryInfo, type QueryCategory } from '@/lib/queryCategories';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category: QueryCategory;
  size?: 'sm' | 'md';
  className?: string;
}

export function CategoryBadge({ category, size = 'sm', className }: CategoryBadgeProps) {
  const info = getCategoryInfo(category);
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border",
        size === 'sm' ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        "bg-secondary/50 border-border",
        className
      )}
      style={{ 
        borderColor: `${info.color}40`,
        backgroundColor: `${info.color}15`,
      }}
    >
      <span>{info.icon}</span>
      <span style={{ color: info.color }}>{info.label}</span>
    </span>
  );
}
