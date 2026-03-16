import Link from "next/link";
import { MessageSquareText } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal nav */}
      <nav className="h-16 flex items-center px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <MessageSquareText className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-display text-xl text-foreground">
            ReviewFlow
          </span>
        </Link>
      </nav>

      {/* Auth content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
