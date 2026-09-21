import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="empty-state card">
      <h2>Page not found</h2>
      <p className="muted">That screen is not part of this inspection app.</p>
      <Link className="btn btn-primary btn-block" to="/">
        Back to inspections
      </Link>
    </section>
  );
}
