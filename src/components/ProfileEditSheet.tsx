import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { updateProfile } from 'zitejs/api';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@project/components/ui/sheet';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Textarea } from '@project/components/ui/textarea';
import { Label } from '@project/components/ui/label';
import { cn } from '@project/components/lib/utils';
import { tok } from '../lib/session';
import { errMsg, fa, useMe } from '../lib/me';
import AvatarPicker from './AvatarPicker';
import CoverPicker from './social/CoverPicker';
import { VIBES } from '../shared/avatars';

export default function ProfileEditSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { me, refresh } = useMe();
  const p = me?.profile;
  const [v, setV] = useState({ dn: '', un: '', bio: '', vibe: '', avatar: '', cover: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open && p) setV({ dn: p.displayName, un: p.username, bio: p.bio ?? '', vibe: p.vibe ?? '', avatar: p.avatar ?? '', cover: p.cover ?? '' });
  }, [open]); // eslint-disable-line
  const set = (k: keyof typeof v) => (x: string) => setV((s) => ({ ...s, [k]: x }));

  const save = async () => {
    if (v.dn.trim().length < 2) return toast.error('نام نمایشی کوتاهه.');
    if (!/^[a-z0-9_]{3,20}$/.test(v.un)) return toast.error('نام کاربری فقط حروف انگلیسی کوچک، عدد و _ (۳ تا ۲۰).');
    setBusy(true);
    try {
      await updateProfile({ token: tok(), displayName: v.dn, username: v.un, bio: v.bio, vibe: v.vibe, avatar: v.avatar, cover: v.cover });
      await refresh(); toast.success('پروفایلت به‌روز شد ✨'); onOpenChange(false);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" dir="rtl" className="mx-auto max-h-[92dvh] max-w-xl overflow-y-auto rounded-t-[28px] p-0">
        <SheetHeader className="sticky top-0 z-10 border-b border-border/60 bg-background/90 px-5 py-4 text-right backdrop-blur">
          <SheetTitle>ویرایش پروفایل</SheetTitle>
          <SheetDescription>خودتو همون‌جوری که می‌خوای نشون بده.</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-5 py-5">
          <div className="space-y-2"><Label>کاور</Label><CoverPicker value={v.cover} onChange={set('cover')} /></div>
          <div className="space-y-2"><Label>آواتار</Label><AvatarPicker value={v.avatar} onChange={set('avatar')} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>نام نمایشی</Label><Input value={v.dn} maxLength={30} onChange={(e) => set('dn')(e.target.value)} className="h-11 rounded-xl" /></div>
            <div className="space-y-1.5"><Label>نام کاربری</Label><Input dir="ltr" value={v.un} maxLength={20} onChange={(e) => set('un')(e.target.value.toLowerCase())} className="h-11 rounded-xl text-left" /></div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between"><Label>بیو</Label><span className="text-xs text-muted-foreground">{fa(v.bio.length)}/۱۲۰</span></div>
            <Textarea value={v.bio} maxLength={120} rows={2} placeholder="همیشه یه جواب تو آستینم دارم 😏" onChange={(e) => set('bio')(e.target.value)} className="resize-none rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>حال‌وهوا</Label>
            <div className="flex flex-wrap gap-2">
              {VIBES.map((x) => (
                <button key={x} type="button" onClick={() => set('vibe')(v.vibe === x ? '' : x)}
                  className={cn('rounded-full border px-3.5 py-1.5 text-sm font-bold transition', v.vibe === x ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:border-primary/40')}>{x}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 border-t border-border/60 bg-background/95 p-4 backdrop-blur" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <Button onClick={save} disabled={busy} className="h-12 w-full rounded-2xl bg-gradient-brand text-base font-bold">{busy && <Loader2 className="ml-2 size-4 animate-spin" />}ذخیره</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
