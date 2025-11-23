import Twemoji from 'twemoji';
export default function Twee({ emoji, size, rounded = false }: { emoji: string; size: number; rounded?: boolean }) {
  const code = Twemoji.parse(emoji);
  const match = code.match(/(\d+)x(\d+)\/([\w-]+)\.png"/);
  if (match) {
    const id = match[3];
    const newUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/${id}.svg`;
    const newAlt = emoji;
    if (rounded) {
      const sizeValue = size;
      const width = `${sizeValue * 0.7}px`;
      const height = `${sizeValue * 0.7}px`;
      return (
        <div style={{ width, height }} className="rounded-full overflow-hidden flex items-center justify-center">
          <img
            className="emoji object-cover object-center"
            draggable="false"
            src={newUrl}
            alt={newAlt}
            style={{ width: size + 'px', height: size + 'px' }}
          />
        </div>
      );
    } else {
      return <img className="emoji" draggable="false" src={newUrl} alt={newAlt} style={{ width: size + 'px', height: size + 'px' }} />;
    }
  } else {
    console.log('Invalid emoji code');
    return null;
  }
}
