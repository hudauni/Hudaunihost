import QuranClient from './QuranClient';

export default function Page() {
  return <QuranClient />;
}

export function generateStaticParams() {
  return Array.from({ length: 114 }, (_, i) => ({
    id: (i + 1).toString(),
  }));
}
