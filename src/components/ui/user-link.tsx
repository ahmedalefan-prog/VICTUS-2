import Link from "next/link";
import { cn } from "@/lib/utils";

// رابط اسم مستخدم → صفحته الشخصية /profile/[userId].
// إن غاب userId يُعرض الاسم كنص عادي (لا روابط مكسورة).
export function UserLink({
  userId,
  name,
  className,
}: {
  userId?: string | null;
  name: string;
  className?: string;
}) {
  if (!userId) return <span className={className}>{name}</span>;
  return (
    <Link
      href={`/profile/${userId}`}
      className={cn("transition-colors hover:text-primary hover:underline", className)}
    >
      {name}
    </Link>
  );
}
