import AdminExploreClient from './AdminExploreClient';

export default function Page() {
  return <AdminExploreClient />;
}

export function generateStaticParams() {
  return [{ id: '1' }];
}
