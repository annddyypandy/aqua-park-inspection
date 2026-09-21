import type { ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { PwaUpdateBanner } from '../pwa/PwaUpdateBanner';

function titleForPath(pathname: string): string {
  if (pathname === '/') {
    return 'Inspections';
  }
  if (pathname.endsWith('/new') && pathname.includes('/pieces/')) {
    return 'Add piece';
  }
  if (pathname.endsWith('/new')) {
    return 'New inspection';
  }
  if (pathname.endsWith('/edit')) {
    return 'Edit inspection';
  }
  if (pathname.includes('/pieces/')) {
    return 'Piece';
  }
  return 'Inspection';
}

export function AppShell({ children }: { children?: ReactNode }) {
  const location = useLocation();
  const title = titleForPath(location.pathname);
  const showBack = location.pathname !== '/';

  return (
    <div className="app-shell">
      <header className="app-header">
        {showBack ? (
          <Link className="btn btn-ghost" to={backTarget(location.pathname)} aria-label="Back">
            Back
          </Link>
        ) : (
          <span className="visually-hidden">Aqua Park Inspection</span>
        )}
        <h1>{title}</h1>
      </header>
      <main className="app-main">{children ?? <Outlet />}</main>
      <PwaUpdateBanner />
    </div>
  );
}

function backTarget(pathname: string): string {
  const pieceMatch = pathname.match(/^\/inspections\/([^/]+)\/pieces\//);
  if (pieceMatch?.[1]) {
    return `/inspections/${pieceMatch[1]}`;
  }

  const editMatch = pathname.match(/^\/inspections\/([^/]+)\/edit$/);
  if (editMatch?.[1]) {
    return `/inspections/${editMatch[1]}`;
  }

  return '/';
}
