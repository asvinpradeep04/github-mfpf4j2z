import { Brain } from 'lucide-react';

interface HeaderProps {
  onLogoClick?: () => void;
  rightContent?: React.ReactNode;
}

export function Header({ onLogoClick, rightContent }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
            <Brain className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold tracking-tight text-ink-800">
              Interview Readiness
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-ink-400">
              PM Practice Simulator
            </div>
          </div>
        </button>
        {rightContent}
      </div>
    </header>
  );
}
