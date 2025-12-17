import { CheckSquare } from 'lucide-react';

export const Logo = ({ className }: { className?: string }) => (
  <div className={`flex items-center gap-2 text-primary ${className}`}>
    <CheckSquare className="h-8 w-8" />
    <span className="text-2xl font-bold text-foreground">TaskinAja</span>
  </div>
);
