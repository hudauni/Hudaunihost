import TaskDetailAssociateClient from './TaskDetailAssociateClient';

export default function Page() {
  return <TaskDetailAssociateClient />;
}

export function generateStaticParams() {
  // Provide a range of possible task IDs for static export
  return Array.from({ length: 20 }, (_, i) => ({
    taskId: (i + 1).toString(),
  }));
}
