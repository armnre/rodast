import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Users, Newspaper, Flame, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@project/components/lib/utils';
import { Button } from '@project/components/ui/button';
import FeedList, { Empty } from '../components/social/FeedList';
import { useFeed } from '../lib/social';

const TABS = [
  { id: 'foryou', label: 'برای تو' },
  { id: 'following', label: 'دنبال‌شده‌ها' },
  { id: 'latest', label: 'تازه‌ها' },
] as const;

export default function Feed() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>(() => (sessionStorage.getItem('rd_tab') as 'foryou') || 'foryou');
  const feed = useFeed({ mode: tab });
  const choose = (t: typeof tab) => { setTab(t); sessionStorage.setItem('rd_tab', t); window.scrollTo({ top: 0 }); };

  return (
    <div className="-mx-4 sm:mx-auto sm:max-w-xl">
      <div className="sticky top-14 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl md:top-16">
        <div className="flex">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => choose(t.id)} className={cn('relative flex-1 py-3.5 text-[15px] font-bold transition', tab === t.id ? 'text-foreground' : 'text-muted-foreground')}>
              {t.label}
              {tab === t.id && <motion.span layoutId="feedtab" className="absolute inset-x-1/4 bottom-0 h-1 rounded-full bg-gradient-brand" />}
            </button>
          ))}
        </div>
      </div>

      <Link to="/reply" className="mx-4 mt-3 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 transition active:scale-[0.99]">
        <span className="grid size-10 place-items-center rounded-xl bg-gradient-brand text-white"><Sparkles className="size-5" /></span>
        <div className="flex-1">
          <div className="text-sm font-black">جوابشو بده</div>
          <div className="text-xs text-muted-foreground">نمی‌دونی چی جواب بدی؟ هوش مصنوعی رو دست کمکت می‌کنه.</div>
        </div>
      </Link>

      <FeedList feed={feed} empty={
        tab === 'following'
          ? <Empty icon={Users} title="هنوز کسی رو دنبال نکردی" text="آدمای باحال رو پیدا کن و دنبالشون کن تا پست‌هاشون اینجا بیاد."><Button asChild className="mt-3 rounded-full"><Link to="/explore">کشف آدم‌ها</Link></Button></Empty>
          : tab === 'foryou'
            ? <Empty icon={Flame} title="هنوز پست داغی نیست" text="اولین نفری باش که یه حرف حسابی می‌زنه!"><Button asChild className="mt-3 rounded-full"><Link to="/compose">اولین پست</Link></Button></Empty>
            : <Empty icon={Newspaper} title="هنوز پستی نیست" text="شبکه تازه راه افتاده؛ تو شروعش کن." />
      } />
      <Link to="/compose" aria-label="پست جدید" className="fixed bottom-28 left-5 z-30 grid size-14 place-items-center rounded-2xl bg-foreground text-background shadow-xl shadow-foreground/25 transition active:scale-90 md:hidden">
        <Plus className="size-6" strokeWidth={2.6} />
      </Link>
    </div>
  );
}
