import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { UserDropdown } from '@/components/UserDropdown';
import AlertsBell from '@/components/alerts/AlertsBell';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Records', to: '/all-records' },
  { label: 'Cases', to: '/cases' },
  { label: 'Compliance', to: '/compliance' },
  { label: 'Bulk', to: '/bulk-analysis' },
  { label: 'Audit', to: '/audit-logs' },
  { label: 'API', to: '/api-docs' },
];

interface AppHeaderProps {
  /** Optional slot rendered to the left of alerts/user (page actions) */
  actions?: React.ReactNode;
  /** Optional slot rendered before the logo (e.g. a back button) */
  leading?: React.ReactNode;
  /** Optional subtitle replacing the default tagline */
  subtitle?: string;
}

export function AppHeader({ actions, leading, subtitle }: AppHeaderProps) {
  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {leading}

          <NavLink to="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <Shield className="w-6 h-6 text-primary" />
            <div className="leading-tight">
              <span className="text-base font-bold tracking-tight block">
                <span className="text-aurora">Rìan</span> Intelligence
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {subtitle ?? 'Blockchain Investigation Platform'}
              </span>
            </div>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1 ml-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            {actions}
            <AlertsBell />
            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
