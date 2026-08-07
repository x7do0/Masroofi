import { Plus } from 'lucide-react';
import type { EmptyStateContent } from '../content/emptyStates';

interface EmptyStateProps {
  content: EmptyStateContent;
  compact?: boolean;
  onAction?: () => void;
}

export function EmptyState({ content, compact = false, onAction }: EmptyStateProps) {
  return (
    <div className={`empty-state polished-empty${compact ? ' compact-empty' : ''}`}>
      <span className="empty-emoji" aria-hidden="true">{content.emoji}</span>
      <h3>{content.title}</h3>
      <p>{content.description}</p>
      {content.actionLabel && onAction && (
        <button type="button" className="button secondary" onClick={onAction}>
          <Plus size={17} /> {content.actionLabel}
        </button>
      )}
    </div>
  );
}
