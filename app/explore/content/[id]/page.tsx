import ExploreContentClient from './ExploreContentClient';

export default function Page() {
  return <ExploreContentClient />;
}

export function generateStaticParams() {
  return [{ id: '1' }];
}
