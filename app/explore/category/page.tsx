import ExploreClient from '../[id]/ExploreClient';
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#001a1a] flex items-center justify-center">Loading...</div>}>
      <ExploreClient isQueryParam={true} />
    </Suspense>
  );
}
