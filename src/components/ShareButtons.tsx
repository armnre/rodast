import { tok } from '../lib/session';
import { Share2, Send, MessageCircle } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { trackEvent } from 'zitejs/api';

const TEXT = 'با «رو دست» دیگه تو جواب دادن کم نمیاری 😎 با لینک من بیا و ۱۰ جواب رایگان بگیر:';

export function ShareButtons({ link }: { link: string }) {
  const log = (m: string) => trackEvent({ token: tok(),  event: 'referral_link_shared', meta: m }).catch(() => {});
  const native = async () => {
    try { await navigator.share({ title: 'رو دست', text: TEXT, url: link }); log('native'); } catch { /* cancelled */ }
  };
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {'share' in navigator && (
        <Button size="sm" variant="outline" className="rounded-xl bg-card" onClick={native}><Share2 className="ml-1 h-4 w-4" />اشتراک</Button>
      )}
      <Button size="sm" variant="outline" className="rounded-xl bg-card" asChild>
        <a href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(TEXT)}`} target="_blank" rel="noreferrer" onClick={() => log('telegram')}><Send className="ml-1 h-4 w-4" />تلگرام</a>
      </Button>
      <Button size="sm" variant="outline" className="rounded-xl bg-card" asChild>
        <a href={`https://wa.me/?text=${encodeURIComponent(`${TEXT} ${link}`)}`} target="_blank" rel="noreferrer" onClick={() => log('whatsapp')}><MessageCircle className="ml-1 h-4 w-4" />واتساپ</a>
      </Button>
    </div>
  );
}
