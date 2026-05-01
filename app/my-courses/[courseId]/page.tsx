import CoursePlayerClient from './CoursePlayerClient';

export default function Page() {
  return <CoursePlayerClient />;
}

export function generateStaticParams() {
  return [{ courseId: '1' }];
}
