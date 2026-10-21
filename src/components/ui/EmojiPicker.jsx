import { useState } from 'react';
import { useT } from '../../i18n';
import Emoji from './Emoji';
import { EMOJI_GROUPS, DEFAULT_CATEGORY_EMOJI } from '../../utils/categoryEmoji';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export default function EmojiPicker({ value, onChange }) {
  const t = useT();
  const [customInput, setCustomInput] = useState('');
  const [recent, setRecent] = useLocalStorage('qlct:recentEmojis', []);
  const current = value || DEFAULT_CATEGORY_EMOJI;

  function pick(emoji) {
    onChange(emoji);
    setRecent((prev) => [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 12));
  }

  // Applies an emoji as soon as it is typed/pasted; plain text is ignored.
  function handleCustomInputChange(e) {
    const val = e.target.value;
    const match = val.match(/\p{Extended_Pictographic}(\uFE0F|\u200D\p{Extended_Pictographic})*/u);
    if (match) {
      pick(match[0]);
      setCustomInput('');
    } else {
      setCustomInput(val);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-2xl bg-surface-container-highest p-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-cardest">
          <Emoji size={26}>{current}</Emoji>
        </span>
        <input
          type="text"
          value={customInput}
          onChange={handleCustomInputChange}
          placeholder={t('emoji.placeholder')}
          className="min-w-0 flex-1 rounded-lg border border-outline bg-transparent px-3 py-2.5 text-body-md text-on-surface outline-none placeholder:text-on-surface-variant focus:border-brand"
        />
      </div>
      <p className="-mt-1 text-body-sm text-on-surface-variant">{t('emoji.tip')}</p>

      {recent.length > 0 && (
        <div>
          <p className="mb-1.5 text-label-md text-on-surface-variant">{t('emoji.recent')}</p>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((e) => (
              <EmojiButton key={`recent-${e}`} emoji={e} active={e === current} onClick={() => pick(e)} />
            ))}
          </div>
        </div>
      )}

      <div className="max-h-56 space-y-3 overflow-y-auto pr-1 sm:max-h-64">
        {EMOJI_GROUPS.map((g) => (
          <div key={g.labelKey}>
            <p className="mb-1.5 text-label-md text-on-surface-variant">{t(g.labelKey)}</p>
            <div className="flex flex-wrap gap-1.5">
              {g.emojis.map((e) => (
                <EmojiButton key={`${g.labelKey}-${e}`} emoji={e} active={e === current} onClick={() => pick(e)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmojiButton({ emoji, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`state-layer flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-colors ${
        active ? 'bg-secondary-container ring-2 ring-brand' : ''
      }`}
    >
      <Emoji size={20}>{emoji}</Emoji>
    </button>
  );
}
