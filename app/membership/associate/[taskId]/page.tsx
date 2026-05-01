import TaskDetailAssociateClient from './TaskDetailAssociateClient';

export default function Page() {
  return <TaskDetailAssociateClient />;
}

export function generateStaticParams() {
  return [{ taskId: '1' }];
}
