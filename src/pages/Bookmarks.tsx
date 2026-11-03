import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bookmark } from 'lucide-react';
import FeedList, { Empty } from '../components/social/FeedList';
import { useFeed } from '../lib/social';

export default function Bookmarks() {
  const nav = useNavigate();
  const feed = useFeed({ mode: 'bookmarks' });
  return (
    <div className="-mx-4 sm:mx-auto sm:max-w-xl">
      <div className="flex items-center gap-2 px-3 py-3">
        <button onClick={() => nav(-1)} className="grid size-10 place-items-center rounded-full hover:bg-muted" aria-label="بازگشت"><ArrowRight className="size-5" /></button>
        <h1 className="text-lg font-black">ذخیره‌شده‌ها</h1>
      </div>
      <FeedList feed={feed} empty={<Empty icon={Bookmark} title="چیزی ذخیره نکردی" text="از منوی هر پست «ذخیره» رو بزن تا اینجا بمونه. فقط خودت می‌بینیشون." />} />
    </div>
  );
}
