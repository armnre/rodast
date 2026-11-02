import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, ShieldCheck, Loader2, Pencil, KeyRound, Sparkles, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@project/components/ui/button';
import { requestOtp, verifyOtp, trackEvent } from 'zitejs/api';
import { LogoMark } from '../components/Logo';
import { setSession } from '../lib/session';
import { errMsg, fa } from '../lib/me';
import Seo from '../components/Seo';

const toLatin = (s: string) => s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
const LEN = 5;

const BUBBLES = [
  { t: 'باشه هر جور راحتی...', me: false },
  { t: 'راحتیم وقتی تو هم باشی 😌', me: true },
  { t: 'اوه! این از کجا اومد؟ 😂', me: false },
  { t: 'از همون‌جا که تو رو آوردن 😏', me: true },
];

function PhoneStep({ onSent }: { onSent: (phone: string, code: string, resend: number) => void }) {
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const digits = toLatin(phone).replace(/\D/g, '');
  const valid = /^(0?9\d{9})$/.test(digits);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      trackEvent({ event: 'signup_started' }).catch(() => {});
      const r = await requestOtp({ phone: digits });
      onSent(r.phone, r.demoCode, r.resendIn);
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <motion.form key="phone" onSubmit={submit} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
      <h1 className="mt-5 text-3xl font-black">بزن بریم! 👋</h1>
      <p className="mt-2 text-muted-foreground">با شماره موبایلت وارد شو یا حساب بساز. بدون رمز عبور.</p>
      <label className="mt-7 block text-sm font-bold" htmlFor="phone">شماره موبایل</label>
      <div className="mt-2 flex items-center gap-2 rounded-2xl border-2 bg-background px-4 transition focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/15">
        <Smartphone className="h-5 w-5 text-muted-foreground" />
        <input id="phone" autoFocus inputMode="numeric" autoComplete="tel" dir="ltr" placeholder="0912 345 6789"
          value={phone} onChange={(e) => setPhone(e.target.value.slice(0, 14))}
          className="h-14 flex-1 bg-transparent text-left text-lg font-bold tracking-widest outline-none placeholder:font-normal placeholder:text-muted-foreground/50" />
        <span className="text-sm font-bold text-muted-foreground" dir="ltr">🇮🇷 +98</span>
      </div>
      {phone && !valid && <p className="mt-2 text-xs text-destructive">شماره باید ۱۱ رقم و با ۰۹ شروع بشه.</p>}
      <motion.div whileTap={{ scale: 0.98 }} className="mt-6">
        <Button type="submit" disabled={!valid || busy} className="group h-14 w-full rounded-2xl text-lg font-bold shadow-lg shadow-primary/30">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>دریافت کد ورود<ArrowLeft className="mr-2 h-5 w-5 transition group-hover:-translate-x-1" /></>}
        </Button>
      </motion.div>
    </motion.form>
  );
}

function OtpStep({ phone, demoCode, resend, onBack, onResent }: {
  phone: string; demoCode: string; resend: number; onBack: () => void; onResent: (code: string, resend: number) => void;
}) {
  const [vals, setVals] = useState<string[]>(Array(LEN).fill(''));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [left, setLeft] = useState(resend);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const nav = useNavigate();

  useEffect(() => { setLeft(resend); }, [resend, demoCode]);
  useEffect(() => { const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { refs.current[0]?.focus(); }, [demoCode]);

  const submit = async (code: string) => {
    if (busy) return;
    setBusy(true); setErr('');
    try {
      const r = await verifyOtp({ phone, code });
      toast.success('خوش اومدی! 🎉');
      setSession({ token: r.token, phone: r.phone });
      nav('/', { replace: true });
    } catch (e) {
      setErr(errMsg(e)); setVals(Array(LEN).fill('')); refs.current[0]?.focus();
    } finally { setBusy(false); }
  };

  const fill = (i: number, raw: string) => {
    const d = toLatin(raw).replace(/\D/g, '');
    const next = [...vals];
    if (d.length > 1) { d.slice(0, LEN).split('').forEach((c, k) => { next[k] = c; }); }
    else next[i] = d;
    setVals(next); setErr('');
    const code = next.join('');
    if (code.length === LEN) submit(code);
    else if (d) refs.current[Math.min(LEN - 1, d.length > 1 ? d.length : i + 1)]?.focus();
  };

  const resendCode = async () => {
    try { const r = await requestOtp({ phone }); onResent(r.demoCode, r.resendIn); setVals(Array(LEN).fill('')); toast('کد جدید اومد'); }
    catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <motion.div key="otp" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
      <h1 className="mt-5 text-3xl font-black">کد رو بزن 🔐</h1>
      <p className="mt-2 text-muted-foreground">
        کد ۵ رقمی به <b dir="ltr" className="text-foreground">{fa(phone)}</b> فرستاده شد.
        <button onClick={onBack} className="mr-2 inline-flex items-center gap-1 text-primary"><Pencil className="h-3.5 w-3.5" />ویرایش</button>
      </p>

      <motion.button type="button" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }}
        onClick={() => fill(0, demoCode)}
        className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-dashed border-primary/50 bg-primary/5 p-3 text-right">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><KeyRound className="h-5 w-5" /></span>
        <span className="flex-1">
          <span className="block text-xs text-muted-foreground">حالت دمو — پیامک واقعی ارسال نمی‌شه</span>
          <span className="block text-lg font-black tracking-[0.4em]" dir="ltr">{demoCode}</span>
        </span>
        <span className="flex items-center gap-1 text-xs font-bold text-primary"><Copy className="h-3.5 w-3.5" />پر کن</span>
      </motion.button>

      <motion.div dir="ltr" className="mt-6 flex justify-center gap-2 sm:gap-3" animate={err ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.4 }}>
        {vals.map((v, i) => (
          <input key={i} ref={(el) => { refs.current[i] = el; }} value={v} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={i === 0 ? LEN : 1} aria-label={`رقم ${i + 1}`} disabled={busy}
            onChange={(e) => fill(i, e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Backspace' && !vals[i] && i > 0) refs.current[i - 1]?.focus(); }}
            className={`h-14 w-12 rounded-2xl border-2 bg-background text-center text-2xl font-black outline-none transition sm:h-16 sm:w-14
              ${err ? 'border-destructive' : v ? 'border-primary bg-primary/5' : 'focus:border-primary'}`} />
        ))}
      </motion.div>
      <div className="mt-3 h-5 text-center text-sm text-destructive">{err}</div>

      <Button disabled={busy || vals.join('').length < LEN} onClick={() => submit(vals.join(''))}
        className="mt-2 h-14 w-full rounded-2xl text-lg font-bold shadow-lg shadow-primary/30">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ShieldCheck className="ml-2 h-5 w-5" />تأیید و ورود</>}
      </Button>
      <div className="mt-4 text-center text-sm text-muted-foreground">
        {left > 0 ? <>ارسال دوباره تا <b className="tabular-nums text-foreground">{fa(`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`)}</b></>
          : <button onClick={resendCode} className="font-bold text-primary">ارسال دوباره‌ی کد</button>}
      </div>
    </motion.div>
  );
}

export default function Login() {
  const [step, setStep] = useState<{ phone: string; code: string; resend: number } | null>(null);
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background">
      <Seo title="ورود به رو دست | ۱۰ جواب رایگان" path="/login" description="با شماره موبایل وارد رو دست شو و ۱۰ جواب حاضرجواب رایگان بگیر؛ بدون رمز، کمتر از ۳۰ ثانیه." />
      <motion.div aria-hidden className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/25 blur-3xl"
        animate={{ scale: [1, 1.15, 1], x: [0, -20, 0] }} transition={{ duration: 8, repeat: Infinity }} />
      <motion.div aria-hidden className="absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-secondary blur-3xl"
        animate={{ scale: [1.1, 1, 1.1], y: [0, -30, 0] }} transition={{ duration: 10, repeat: Infinity }} />

      <div className="relative mx-auto grid min-h-[100dvh] max-w-6xl items-center gap-10 px-5 py-8 lg:grid-cols-2">
        <div className="order-2 hidden lg:block">
          <div className="relative mx-auto w-80 rounded-[2.5rem] border-8 border-foreground bg-card p-5 shadow-2xl">
            <div className="mx-auto mb-5 h-1.5 w-16 rounded-full bg-muted" />
            <div className="space-y-3">
              {BUBBLES.map((b, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 14, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.7, type: 'spring', stiffness: 260, damping: 20 }}
                  className={`max-w-[85%] rounded-3xl px-4 py-2.5 text-sm ${b.me ? 'mr-auto rounded-bl-md bg-primary text-primary-foreground' : 'ml-auto rounded-br-md bg-muted'}`}>
                  {b.t}
                </motion.div>
              ))}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.4 }}
                className="mt-4 flex items-center gap-2 rounded-2xl bg-secondary px-3 py-2 text-xs font-bold text-secondary-foreground">
                <Sparkles className="h-4 w-4" /> ۱۰ جواب رایگان بعد از ورود
              </motion.div>
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="order-1 mx-auto w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 rotate-180" /> برگشت
          </Link>
          <div className="rounded-[2rem] border bg-card/80 p-7 shadow-2xl shadow-primary/10 backdrop-blur-xl md:p-9">
            <div className="flex items-center justify-between">
              <LogoMark size={56} />
              <div className="flex gap-1.5">{[0, 1].map((i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${(step ? 1 : 0) >= i ? 'w-8 bg-primary' : 'w-4 bg-muted'}`} />
              ))}</div>
            </div>
            <AnimatePresence mode="wait">
              {step
                ? <OtpStep key="o" phone={step.phone} demoCode={step.code} resend={step.resend} onBack={() => setStep(null)}
                    onResent={(code, resend) => setStep({ ...step, code, resend })} />
                : <PhoneStep key="p" onSent={(phone, code, resend) => setStep({ phone, code, resend })} />}
            </AnimatePresence>
            <p className="mt-6 text-center text-xs leading-6 text-muted-foreground">
              با ورود، <Link to="/terms" className="text-primary underline">قوانین و حریم خصوصی</Link> رو می‌پذیری.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
