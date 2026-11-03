import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@project/components/ui/dialog';
import { cn } from '@project/components/lib/utils';
import type { Post } from '../../lib/social';

type M = Post['media'][number];

function Img({ m, onOpen, className }: { m: M; onOpen: () => void; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(); }} className={cn('relative overflow-hidden bg-muted', className)}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
      <img src={m.url} alt="" loading="lazy" decoding="async" onLoad={() => setLoaded(true)}
        className={cn('h-full w-full object-cover transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')} />
    </button>
  );
}

export default function MediaGrid({ media }: { media: M[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!media.length) return null;
  const video = media.find((m) => m.type === 'video');
  const imgs = media.filter((m) => m.type === 'image');
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-border/70" onClick={(e) => e.stopPropagation()}>
      {video && (
        <video src={video.url} controls playsInline preload="metadata" className="max-h-[520px] w-full bg-black" />
      )}
      {imgs.length > 0 && (
        <div className={cn('grid gap-0.5', imgs.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
          {imgs.map((m, i) => (
            <Img key={m.url} m={m} onOpen={() => setOpen(m.url)}
              className={cn(imgs.length === 1 ? 'max-h-[520px] min-h-[180px]' : 'aspect-square', imgs.length === 3 && i === 0 && 'row-span-2 aspect-auto')} />
          ))}
        </div>
      )}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-3xl border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">تصویر</DialogTitle>
          {open && <img src={open} alt="" className="max-h-[85vh] w-full rounded-2xl object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
