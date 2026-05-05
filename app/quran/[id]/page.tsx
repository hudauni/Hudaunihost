import QuranClient from './QuranClient';

export function generateStaticParams() {
  return Array.from({ length: 114 }, (_, i) => ({
    id: (i + 1).toString(),
  }));
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  // Using the ID as a key forces React to completely unmount and remount
  // the component when the Surah changes. This is the most stable way
  // to prevent stale state and infinite scroll bugs during navigation.
  return <QuranClient key={id} />;
}
