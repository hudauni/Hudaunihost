import TaskDetailClient from './TaskDetailClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#001a1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    }>
      <TaskDetailClient />
    </Suspense>
  );
}
