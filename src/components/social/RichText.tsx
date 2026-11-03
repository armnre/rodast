import { Fragment } from 'react';
import { Link } from 'react-router-dom';

/** Renders post text with clickable #hashtags, @mentions and links. */
export default function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(#[\p{L}\p{N}_]{1,40}|@[a-zA-Z0-9_]{3,20}|https?:\/\/[^\s]+)/gu);
  return (
    <p className={className} dir="auto">
      {parts.map((p, i) => {
        const stop = (e: React.MouseEvent) => e.stopPropagation();
        if (p.startsWith('#') && p.length > 1)
          return <Link key={i} onClick={stop} to={`/explore?tag=${encodeURIComponent(p.slice(1))}`} className="font-semibold text-primary hover:underline">{p}</Link>;
        if (p.startsWith('@') && p.length > 3)
          return <Link key={i} onClick={stop} to={`/u/${p.slice(1).toLowerCase()}`} className="font-semibold text-primary hover:underline" dir="ltr">{p}</Link>;
        if (/^https?:\/\//.test(p))
          return <a key={i} onClick={stop} href={p} target="_blank" rel="noopener noreferrer nofollow" className="text-primary underline-offset-2 hover:underline break-all" dir="ltr">{p.replace(/^https?:\/\//, '').slice(0, 40)}</a>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </p>
  );
}
