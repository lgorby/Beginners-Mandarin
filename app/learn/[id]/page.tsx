import { notFound } from "next/navigation";
import LessonRunner from "@/components/kid/LessonRunner";
import { LESSONS, lessonIndex } from "@/lib/curriculum";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ id: l.id }));
}

export default async function LearnPage({ params }: PageProps<"/learn/[id]">) {
  const { id } = await params;
  if (lessonIndex(id) < 0) notFound();
  return <LessonRunner lessonId={id} />;
}
