import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Gift, Clock, MessageSquareText, Wand2, Send, ShieldCheck, Share, PlusSquare, MoreVertical, Download, Apple, Smartphone, Zap, Lock, Copy } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@project/components/ui/accordion';
import { cn } from '@project/components/lib/utils';
import { Logo, LogoMark } from '../components/Logo';
import OptionIcon from '../components/OptionIcon';

const SAMPLES = [
  { tone: 'naughty', label: 'شیطون', text: 'راحتیم وقتی تو هم باشی 😏' },
  { tone: 'funny', label: 'بامزه', text: 'این «هر جور راحتی» بوی قهر میده، مطمئنی؟' },
  { tone: 'classy', label: 'باکلاس', text: 'اتفاقاً خیلی دوست دارم نظر خودت رو بدونم.' },
];
const HOW = [
  { icon: MessageSquareText, t: 'پیامو بچسبون', d: 'پیامی که گرفتی یا موقعیتی که توش گیر کردی.' },
  { icon: Wand2, t: 'لحن رو انتخاب کن', d: 'بامزه، شیطون، باکلاس، سنگین، رمانتیک و...' },
  { icon: Send, t: 'کپی کن، بفرست', d: 'سه جواب متفاوت؛ از امن تا جسورانه.' },
];
const FEATURES = [
  { i: Zap, t: 'زیر ۵ ثانیه', d: 'جواب‌ها تقریباً فوری ساخته می‌شن.' },
  { i: Gift, t: '۵ جواب برای هر دعوت', d: 'دوستاتو بیار، جواب هدیه بگیر.' },
  { i: Clock, t: 'شارژ خودکار', d: 'تموم شد؟ ۲۴ ساعت بعد دوباره داری.' },
  { i: Lock, t: 'خصوصی و امن', d: 'پیام‌هات فقط مال خودته؛ هر وقت خواستی پاک کن.' },
];
const FAQ = [
  ['رایگانه؟', 'آره! با ثبت‌نام ۱۰ جواب رایگان می‌گیری. بعدش با دعوت دوستات یا شارژ خودکار ۲۴ ساعته ادامه می‌دی.'],
  ['پیام‌هام جایی منتشر می‌شه؟', 'نه. فقط برای ساختن جواب استفاده می‌شن و تو تاریخچه‌ی شخصی خودت می‌مونن.'],
  ['باید از اپ‌استور نصبش کنم؟', 'نه. رو دست یه وب‌اپه؛ از همین مرورگر با دو لمس روی صفحه‌ی اصلی گوشی نصب می‌شه و مثل اپ واقعی باز می‌شه.'],
  ['جواب‌ها طبیعی‌ان؟', 'کاملاً محاوره‌ای و ایرانی؛ مثل یه رفیق حاضرجواب، نه ربات.'],
];
const STEPS = {
  ios: [
    { i: Smartphone, t: 'سایت رو با Safari باز کن', d: 'فقط سافاری اجازه‌ی نصب روی آیفون رو می‌ده.' },
    { i: Share, t: 'دکمه‌ی Share رو بزن', d: 'مربع با فلش رو به بالا، پایین صفحه.' },
    { i: PlusSquare, t: 'Add to Home Screen', d: 'یه کم پایین برو و این گزینه رو بزن، بعد Add.' },
  ],
  android: [
    { i: Smartphone, t: 'سایت رو با Chrome باز کن', d: 'یا هر مرورگر به‌روز دیگه.' },
    { i: MoreVertical, t: 'منوی ⋮ رو بزن', d: 'سه‌نقطه‌ی بالای صفحه.' },
    { i: Download, t: 'Install app / نصب برنامه', d: 'تأیید کن؛ آیکون رو دست میاد رو صفحه‌ت.' },
  ],
};

const fade = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' } };

function Install() {
  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const [os, setOs] = useState<'ios' | 'android'>(isIOS ? 'ios' : 'android');
  return (
    <section id="install" className="py-16 md:py-24">
      <div className="card-soft grid items-center gap-8 overflow-hidden p-5 sm:p-8 md:grid-cols-2 md:p-12">
        <motion.div {...fade}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent"><Download className="h-3.5 w-3.5" />بدون اپ‌استور</span>
          <h2 className="mt-4 text-3xl font-black md:text-4xl">نصبش کن، <span className="text-gradient">همیشه دم دستت</span></h2>
          <p className="mt-3 text-muted-foreground">رو دست مثل یه اپ واقعی روی صفحه‌ی اصلی گوشیت میاد؛ تمام‌صفحه، سریع و بدون حجم اضافه.</p>
          <div className="mt-6 grid w-full max-w-xs grid-cols-2 rounded-2xl border border-border bg-foreground/[0.04] p-1">
            {(['ios', 'android'] as const).map((k) => (
              <button key={k} onClick={() => setOs(k)} className="relative flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold">
                {os === k && <motion.span layoutId="os" className="absolute inset-0 rounded-xl bg-gradient-brand" />}
                <span className={cn('relative flex items-center gap-1.5', os === k ? 'text-white' : 'text-muted-foreground')}>
                  {k === 'ios' ? <><Apple className="h-4 w-4" />آیفون</> : <><Smartphone className="h-4 w-4" />اندروید</>}
                </span>
              </button>
            ))}
          </div>
          <ol className="mt-6 space-y-3">
            {STEPS[os].map((s, i) => (
              <motion.li key={os + i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-foreground/[0.04] p-3.5">
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-lg shadow-primary/30">
                  <s.i className="h-5 w-5" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-black text-accent-foreground">{['۱', '۲', '۳'][i]}</span>
                </span>
                <div><b className="text-sm" dir="auto">{s.t}</b><p className="text-xs text-muted-foreground">{s.d}</p></div>
              </motion.li>
            ))}
          </ol>
        </motion.div>
        <motion.div {...fade} className="relative">
          <div className="absolute inset-8 rounded-full bg-primary/30 blur-3xl" />
          <img src="https://images.fillout.com/912168/hp1wine38g/generated-images/cNDyph2Ygj35oN9Z6ZPAHn/img_pCr-Vj6J9jt5WI-3.jpg" alt="نصب رو دست روی گوشی"
            loading="lazy" className="relative mx-auto w-full max-w-sm rounded-[2rem] ring-1 ring-white/10" />
        </motion.div>
      </div>
    </section>
  );
}

export default function Landing() {
  const nav = useNavigate();
  const start = () => nav('/login');
  return (
    <div className="bg-blobs min-h-[100dvh] overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-border bg-background/60 backdrop-blur-2xl" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo size={34} />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground">چطور کار می‌کنه</a>
            <a href="#install" className="hover:text-foreground">نصب اپ</a>
            <a href="#faq" className="hover:text-foreground">سؤالات</a>
          </nav>
          <div className="flex gap-2">
            <Button variant="ghost" className="hidden rounded-full sm:inline-flex" onClick={start}>ورود</Button>
            <Button className="rounded-full bg-gradient-brand font-bold text-white" onClick={start}>شروع رایگان</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <section className="grid items-center gap-8 py-10 md:grid-cols-2 md:gap-12 md:py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center md:text-right">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.04] px-3.5 py-1.5 text-xs font-bold text-muted-foreground sm:text-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" /> هوش مصنوعی حاضرجواب فارسی
            </span>
            <h1 className="mt-5 text-[2.75rem] font-black leading-[1.15] sm:text-6xl md:text-7xl">جواب چی<br /><span className="text-gradient">بدیم؟</span></h1>
            <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground sm:text-lg md:mx-0 md:text-xl">پیامتو بده، سه تا جواب رو‌دست‌خور بگیر. برای مخ‌زدن، استوری، پیام سرد و هر موقعیتی که کم میاری.</p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:justify-start">
              <motion.div whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                <Button size="lg" className="h-14 w-full rounded-2xl bg-gradient-brand px-8 text-lg font-black text-white shadow-xl shadow-primary/40 sm:w-auto" onClick={start}>
                  <Sparkles className="ml-2 h-5 w-5" /> ۱۰ جواب رایگان بگیر
                </Button>
              </motion.div>
              <Button asChild variant="ghost" size="lg" className="h-14 rounded-2xl border border-border"><a href="#install"><Download className="ml-2 h-5 w-5" />نصب روی گوشی</a></Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">ورود با موبایل · بدون رمز · کمتر از ۳۰ ثانیه</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 100, delay: 0.15 }} className="relative">
            <div className="absolute inset-6 rounded-full bg-primary/25 blur-3xl" />
            <motion.img animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              src="https://images.fillout.com/912168/hp1wine38g/generated-images/eR9f3AXYnm4Wm2cyiKhSMD/img_U7Y1BrmyCcpI7mWh.jpg" alt="رو دست روی گوشی"
              className="relative w-full rounded-[2rem] ring-1 ring-white/10 [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)]" />
          </motion.div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {SAMPLES.map((s, i) => (
            <motion.div key={i} {...fade} transition={{ delay: i * 0.1 }} className="card-soft p-5">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><OptionIcon id={s.tone} size="sm" />{s.label}</div>
              <div className="mt-3 w-fit max-w-[85%] rounded-2xl rounded-br-md bg-foreground/[0.04] px-4 py-2 text-sm text-muted-foreground">باشه هر جور راحتی...</div>
              <div className="mr-auto mt-2 w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-gradient-brand px-4 py-2.5 font-semibold text-white">{s.text}</div>
              <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><Copy className="h-3.5 w-3.5" /> با یه لمس کپی</div>
            </motion.div>
          ))}
        </section>

        <section id="how" className="scroll-mt-20 py-16 md:py-24">
          <motion.h2 {...fade} className="text-center text-3xl font-black md:text-4xl">سه قدم تا <span className="text-gradient">جواب طلایی</span></motion.h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {HOW.map((h, i) => (
              <motion.div key={i} {...fade} transition={{ delay: i * 0.12 }} className="card-soft relative p-6">
                <span className="absolute left-5 top-3 text-6xl font-black text-foreground/[0.05]">{['۱', '۲', '۳'][i]}</span>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-lg shadow-primary/30"><h.icon className="h-6 w-6" /></span>
                <h3 className="mt-4 text-lg font-black">{h.t}</h3>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">{h.d}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {FEATURES.map((f, i) => (
            <motion.div key={i} {...fade} transition={{ delay: i * 0.08 }} className="card-soft p-4 sm:p-5">
              <f.i className="h-7 w-7 text-accent" />
              <b className="mt-3 block text-sm sm:text-base">{f.t}</b>
              <p className="mt-1 text-xs leading-6 text-muted-foreground sm:text-sm">{f.d}</p>
            </motion.div>
          ))}
        </section>

        <Install />

        <section id="faq" className="mx-auto max-w-2xl scroll-mt-20 pb-16">
          <motion.h2 {...fade} className="mb-6 text-center text-3xl font-black">سؤال داری؟</motion.h2>
          <Accordion type="single" collapsible className="card-soft px-5">
            {FAQ.map(([q, a]) => (
              <AccordionItem key={q} value={q} className="border-border last:border-0"><AccordionTrigger className="text-right font-bold">{q}</AccordionTrigger><AccordionContent className="leading-7 text-muted-foreground">{a}</AccordionContent></AccordionItem>
            ))}
          </Accordion>
        </section>

        <motion.footer {...fade} className="relative overflow-hidden rounded-[2rem] bg-gradient-brand p-6 text-white sm:p-10">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-center gap-4"><LogoMark size={60} /><div><b className="text-xl sm:text-2xl">این دفعه تو کم نیار!</b><p className="text-sm text-white/80">رو دست همیشه یه چیزی تو چنته داره.</p></div></div>
            <Button size="lg" className="h-12 w-full rounded-2xl bg-white font-black text-black hover:bg-white/90 md:w-auto" onClick={start}>شروع رایگان</Button>
          </div>
          <div className="relative mt-6 flex items-center gap-3 border-t border-white/20 pt-4 text-xs text-white/70">
            <ShieldCheck className="h-4 w-4" /><Link to="/terms" className="underline">قوانین و حریم خصوصی</Link>
          </div>
        </motion.footer>
      </main>
    </div>
  );
}
