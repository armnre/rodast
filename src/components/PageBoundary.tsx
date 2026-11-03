import { ErrorBoundary } from 'react-error-boundary';
import { useLocation } from 'react-router-dom';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { Button } from '@project/components/ui/button';

function Fallback({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  return (
    <div className="card-soft mx-auto mt-10 max-w-md p-8 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive"><TriangleAlert className="size-7" /></span>
      <h2 className="mt-4 text-xl font-black">یه چیزی درست بالا نیومد</h2>
      <p className="mt-2 text-sm text-muted-foreground">نگران نباش، اطلاعاتت سر جاشه. یه بار دیگه امتحان کن.</p>
      <Button className="mt-5 rounded-full" onClick={resetErrorBoundary}><RefreshCw className="ml-1 size-4" />دوباره</Button>
    </div>
  );
}

export default function PageBoundary({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return <ErrorBoundary FallbackComponent={Fallback} resetKeys={[loc.pathname]} onError={(e) => console.error(e)}>{children}</ErrorBoundary>;
}
