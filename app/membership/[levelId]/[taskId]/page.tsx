import TaskDetailClient from './TaskDetailClient';

export default function Page() {
  return <TaskDetailClient />;
}

export function generateStaticParams() {
  return [{ levelId: 'associate', taskId: '1' }];
}
