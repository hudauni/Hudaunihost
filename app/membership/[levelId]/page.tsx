import LevelSyllabusClient from './LevelSyllabusClient';

export default function Page() {
  return <LevelSyllabusClient />;
}

export function generateStaticParams() {
  return [{ levelId: 'associate' }];
}
