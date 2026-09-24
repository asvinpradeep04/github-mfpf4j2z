import {
  Target,
  Users,
  Scale,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Target,
  Users,
  Scale,
  BarChart3,
};

export function CompetencyIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICON_MAP[name] || Target;
  return <Icon className={className} />;
}
