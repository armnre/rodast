import { logout } from '../lib/session';

import { Button } from '@project/components/ui/button';
import { LogoMark } from './Logo';

export default function Blocked() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <LogoMark size={64} />
      <h1 className="text-xl font-black">این حساب فعال نیست</h1>
      <p className="max-w-xs text-sm text-muted-foreground">حسابت بسته یا مسدود شده. اگه فکر می‌کنی اشتباه شده، با پشتیبانی رو دست در تماس باش.</p>
      <Button variant="outline" onClick={() => logout()}>خروج</Button>
    </div>
  );
}
