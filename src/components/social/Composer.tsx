import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X, Film } from 'lucide-react';
import { toast } from 'sonner';
import { useUpload } from 'zitejs/upload';
import { createPost } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { cn } from '@project/components/lib/utils';
import AvatarImg from '../AvatarImg';
import { useMe, fa } from '../../lib/me';
import { tok } from '../../lib/session';
import { POST_MAX, newKey, onErr, type Post } from '../../lib/social';

type Media = { url: string; type: 'image' | 'video'; preview: string };
const IMG_MB = 10, VID_MB = 20, MAX = 4;

function Ring({ used }: { used: number }) {
  const left = POST_MAX - used, pct = Math.min(1, used / POST_MAX), r = 10, c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-1.5">
      {left <= 40 && <span className={cn('text-xs font-bold tabular-nums', left < 0 ? 'text-destructive' : 'text-muted-foreground')}>{fa(left)}</span>}
      <svg width="26" height="26" className="-rotate-90">
        <circle cx="13" cy="13" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="2.5" />
        <circle cx="13" cy="13" r={r} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          stroke={left < 0 ? 'hsl(var(--destructive))' : left <= 40 ? 'hsl(38 95% 50%)' : 'hsl(var(--primary))'} className="transition-all" />
      </svg>
    </div>
  );
}

export default function Composer({ parentId, quoteId, placeholder, onDone, autoFocus }: {
  parentId?: string; quoteId?: string; placeholder?: string; onDone: (p: Post) => void; autoFocus?: boolean;
}) {
  const { me } = useMe();
  const { upload } = useUpload();
  const [text, setText] = useState('');
  const [media, setMedia] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(0);
  const [busy, setBusy] = useState(false);
  const key = useRef(newKey());
  const file = useRef<HTMLInputElement>(null);
  const used = [...text].length;
  const canPost = !busy && !uploading && used <= POST_MAX && (text.trim().length > 0 || media.length > 0);

  const pick = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      const type = f.type.startsWith('video/') ? 'video' : f.type.startsWith('image/') ? 'image' : null;
      if (!type) { toast.error('فقط عکس یا ویدئو.'); continue; }
      if (media.length + uploading >= MAX) { toast.error(`حداکثر ${fa(MAX)} رسانه.`); break; }
      if (type === 'video' && media.some((m) => m.type === 'video')) { toast.error('فقط یک ویدئو در هر پست.'); continue; }
      const lim = type === 'video' ? VID_MB : IMG_MB;
      if (f.size > lim * 1024 * 1024) { toast.error(`حجم ${type === 'video' ? 'ویدئو' : 'عکس'} حداکثر ${fa(lim)} مگابایت.`); continue; }
      setUploading((n) => n + 1);
      try {
        const { url } = await upload(f);
        setMedia((m) => [...m, { url, type, preview: URL.createObjectURL(f) }]);
      } catch { toast.error('آپلود نشد، دوباره امتحان کن.'); }
      finally { setUploading((n) => n - 1); }
    }
    if (file.current) file.current.value = '';
  };

  const submit = async () => {
    if (!canPost) return;
    setBusy(true);
    try {
      const { post } = await createPost({ token: tok(), body: text, media: media.map(({ url, type }) => ({ url, type })), parentId, quoteId, clientKey: key.current });
      setText(''); setMedia([]); key.current = newKey();
      onDone(post);
    } catch (e) { onErr(e); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex gap-3">
      <AvatarImg id={me?.profile?.avatar} name={me?.profile?.displayName ?? '?'} className="size-11 ring-2" />
      <div className="min-w-0 flex-1">
        <textarea value={text} onChange={(e) => setText(e.target.value)} autoFocus={autoFocus} dir="auto" rows={parentId ? 2 : 4}
          placeholder={placeholder ?? (media.length ? 'یه توضیح کوتاه بنویس (اختیاری)…' : 'چه خبر؟ یه حرف حسابی بزن…')}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(); }}
          className="w-full resize-none bg-transparent py-2 text-[17px] leading-8 outline-none placeholder:text-muted-foreground/70" />
        {(media.length > 0 || uploading > 0) && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            {media.map((m) => (
              <div key={m.url} className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
                {m.type === 'video' ? <video src={m.preview} className="h-full w-full object-cover" muted /> : <img src={m.preview} alt="" className="h-full w-full object-cover" />}
                {m.type === 'video' && <Film className="absolute bottom-2 right-2 size-5 text-white drop-shadow" />}
                <button aria-label="حذف" onClick={() => setMedia((x) => x.filter((y) => y.url !== m.url))}
                  className="absolute left-2 top-2 grid size-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur active:scale-90"><X className="size-4" /></button>
              </div>
            ))}
            {Array.from({ length: uploading }).map((_, i) => (
              <div key={i} className="grid aspect-square place-items-center rounded-2xl bg-muted"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
          <div>
            <input ref={file} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => pick(e.target.files)} />
            <button type="button" onClick={() => file.current?.click()} disabled={media.length + uploading >= MAX}
              className="grid size-10 place-items-center rounded-full text-primary transition hover:bg-primary/10 disabled:opacity-40" aria-label="افزودن عکس یا ویدئو">
              <ImagePlus className="size-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Ring used={used} />
            <Button onClick={submit} disabled={!canPost} className="h-10 rounded-full bg-gradient-brand px-6 font-bold shadow-md shadow-primary/30">
              {busy ? <Loader2 className="size-4 animate-spin" /> : parentId ? 'پاسخ' : 'منتشر کن'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
