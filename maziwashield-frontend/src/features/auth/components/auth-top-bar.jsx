import { cn } from "@/lib/utils";
import LanguageToggle from "@/components/shared/language-toggle";

export default function AuthTopBar({ className, pillClassName }) {
  return (
    <div className={cn("flex w-full items-center justify-between", className)}>
      <div className={cn("inline-flex items-center gap-2 rounded-full border bg-mint1 px-3.5 py-1.5 text-forest", pillClassName)}>
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
        </span>
        <span className="font-label-caps text-label-caps font-semibold">Nakuru Agri-Hub • Online</span>
      </div>
      <LanguageToggle variant="auth" />
    </div>
  );
}