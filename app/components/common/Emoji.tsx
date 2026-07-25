function getEmojiUrl(emoji: string): string | null {
  try {
    const codepoint = [...emoji]
      .filter((char) => char.codePointAt(0)! > 0xffff || !char.match(/[\u200d\ufe0f]/))
      .map((char) => char.codePointAt(0)!.toString(16).toLowerCase())
      .filter(Boolean)
      .join('-');

    if (!codepoint) return null;

    return `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/${codepoint}.svg`;
  } catch {
    return null;
  }
}

export default function Emoji({ emoji, size, rounded = false }: { emoji: string; size: number; rounded?: boolean }) {
  const url = getEmojiUrl(emoji);

  if (!url) {
    console.warn(`Invalid emoji: ${emoji}`);
    return null;
  }

  const img = (
    <img
      className={rounded ? 'emoji object-cover object-center' : 'emoji'}
      draggable={false}
      src={url}
      alt={emoji}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );

  if (rounded) {
    const containerSize = `${size * 0.7}px`;
    return (
      <div style={{ width: containerSize, height: containerSize }} className="rounded-full overflow-hidden flex items-center justify-center">
        {img}
      </div>
    );
  }

  return img;
}
