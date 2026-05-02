import AdminExploreClient from '../[id]/AdminExploreClient';
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#001a1a] flex items-center justify-center font-bold text-emerald-500">Loading...</div>}>
      <AdminExploreClient isQueryParam={true} />
    </Suspense>
  );
}
