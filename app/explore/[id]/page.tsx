import ExploreClient from './ExploreClient';

// This is a Server Component now
export default function Page() {
  return <ExploreClient />;
}

// Next.js needs this for static export
export function generateStaticParams() {
  return [{ id: '1' }];
}
