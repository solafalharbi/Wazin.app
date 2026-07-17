import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-5 h-5 border-[1.5px]',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-[2.5px]',
  xl: 'w-16 h-16 border-[3px]',
};

function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'rounded-full animate-spin',
        'border-foreground/20',
        'border-t-foreground border-r-foreground border-b-foreground',
        sizeMap[size],
        className
      )}
    />
  );
}

/** Full-page / full-section centered loading state */
function PageLoader({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center w-full py-24', className)}>
      <Spinner size="lg" />
    </div>
  );
}

export { Spinner, PageLoader };
