import { useRef } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUpload } from 'zitejs/upload';

export default function CoverPicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const { upload, isUploading } = useUpload();
  const ref = useRef<HTMLInputElement>(null);
  const pick = async (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast.error('فقط عکس.');
    if (f.size > 8 * 1024 * 1024) return toast.error('حجم کاور حداکثر ۸ مگابایت.');
    try { onChange((await upload(f)).url); } catch { toast.error('آپلود نشد، دوباره امتحان کن.'); }
    if (ref.current) ref.current.value = '';
  };
  return (
    <div className="relative h-28 overflow-hidden rounded-2xl bg-gradient-brand">
      {value && <img src={value} alt="" className="h-full w-full object-cover" />}
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/20">
        <button type="button" onClick={() => ref.current?.click()} disabled={isUploading}
          className="flex items-center gap-1.5 rounded-full bg-black/55 px-4 py-2 text-sm font-bold text-white backdrop-blur active:scale-95">
          {isUploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} {value ? 'عوض کن' : 'انتخاب کاور'}
        </button>
        {value && <button type="button" aria-label="حذف کاور" onClick={() => onChange('')} className="grid size-9 place-items-center rounded-full bg-black/55 text-white"><X className="size-4" /></button>}
      </div>
    </div>
  );
}
