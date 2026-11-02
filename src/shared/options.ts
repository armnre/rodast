export const SITUATIONS = [
  { id: 'flirt', label: 'مخ‌زنی و آشنایی', emoji: '💘' },
  { id: 'story', label: 'جواب به استوری', emoji: '📸' },
  { id: 'cold', label: 'جواب به پیام سرد', emoji: '🧊' },
  { id: 'rescue', label: 'نجات مکالمه', emoji: '🛟' },
  { id: 'start', label: 'شروع مکالمه', emoji: '👋' },
  { id: 'formal', label: 'جواب به پیام رسمی', emoji: '💼' },
  { id: 'custom', label: 'موقعیت دلخواه', emoji: '✏️' },
] as const;

export const TONES = [
  { id: 'funny', label: 'بامزه', emoji: '😄' },
  { id: 'naughty', label: 'شیطون', emoji: '😈' },
  { id: 'classy', label: 'باکلاس', emoji: '👑' },
  { id: 'cool', label: 'سنگین', emoji: '😎' },
  { id: 'warm', label: 'صمیمی', emoji: '🤗' },
  { id: 'sarcastic', label: 'کنایه‌ای', emoji: '🙃' },
  { id: 'bold', label: 'جسور', emoji: '🔥' },
  { id: 'polite', label: 'محترمانه', emoji: '🙏' },
  { id: 'romantic', label: 'رمانتیک', emoji: '🌹' },
] as const;

export const RELATIONSHIPS = [
  { id: 'crush', label: 'کراش' },
  { id: 'new', label: 'تازه آشنا' },
  { id: 'partner', label: 'پارتنر' },
  { id: 'friend', label: 'دوست' },
  { id: 'ex', label: 'اکس' },
  { id: 'colleague', label: 'همکار' },
  { id: 'family', label: 'خانواده' },
] as const;

export const LENGTHS = [
  { id: 'short', label: 'کوتاه' },
  { id: 'medium', label: 'متوسط' },
  { id: 'long', label: 'بلندتر' },
] as const;

export const MAX_INPUT = 400;

export const labelOf = (list: readonly { id: string; label: string }[], id?: string | null) =>
  list.find((x) => x.id === id)?.label ?? '';
