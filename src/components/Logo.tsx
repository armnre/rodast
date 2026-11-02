import { cn } from '@project/components/lib/utils';

export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <div className={cn('relative shrink-0 overflow-hidden shadow-lg shadow-primary/30 ring-1 ring-black/5', className)}
      style={{ width: size, height: size, borderRadius: size * 0.28 }}>
      <img src="https://images.fillout.com/912168/hp1wine38g/generated-images/wfWo3CahrPGYE8sVCmv7J8/img_ghoIhaRe333NzvDC.jpg"
        alt="" draggable={false} className="h-full w-full scale-[1.12] object-cover" />
    </div>
  );
}

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2" aria-label="رو دست">
      <LogoMark size={size} />
      <span className="font-black tracking-tight" style={{ fontSize: size * 0.62 }}>
        رو<span className="text-gradient">دست</span>
      </span>
    </div>
  );
}
