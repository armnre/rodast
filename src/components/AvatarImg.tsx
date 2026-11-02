import { cn } from '@project/components/lib/utils';
import { avatarUrl } from '../shared/avatars';

export default function AvatarImg({ id, name, className }: { id?: string | null; name: string; className?: string }) {
  const url = avatarUrl(id);
  return (
    <div className={cn('relative shrink-0 overflow-hidden rounded-full bg-gradient-brand text-primary-foreground ring-4 ring-card', className)}>
      {url ? <img src={url} alt="" className="h-full w-full object-cover" draggable={false} />
        : <div className="grid h-full w-full place-items-center font-display text-[42%]">{name.slice(0, 1)}</div>}
    </div>
  );
}
