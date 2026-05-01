import QuranClient from './QuranClient';

export default function Page() {
  return <QuranClient />;
}

export function generateStaticParams() {
  return [{ id: '1' }];
}
