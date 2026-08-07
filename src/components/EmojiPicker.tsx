import { Check, SmilePlus, X } from 'lucide-react';

interface EmojiPickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

const emojiOptions = ['💼', '🎁', '💰', '🛒', '⛽', '☕', '🍽️', '🏠', '🚕', '📱', '🎓', '🎮', '🧾', '❤️'];

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  return (
    <div className="field-group">
      <label>أيقونة <span className="optional">اختياري</span></label>
      <div className="emoji-picker">
        <button
          type="button"
          className={`emoji-option emoji-empty${value === null ? ' active' : ''}`}
          onClick={() => onChange(null)}
          aria-label="بدون أيقونة"
        >
          {value === null ? <Check size={16} /> : <X size={15} />}
          <span>بدون</span>
        </button>
        {emojiOptions.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className={`emoji-option${value === emoji ? ' active' : ''}`}
            onClick={() => onChange(value === emoji ? null : emoji)}
            aria-label={`اختيار ${emoji}`}
          >
            {emoji}
          </button>
        ))}
        <span className="emoji-picker-mark" title="اختيار اختياري"><SmilePlus size={16} /></span>
      </div>
    </div>
  );
}
