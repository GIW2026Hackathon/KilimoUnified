"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/api";

export default function SignOutButton({ className = "", label = "Sign out" }) {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: () => router.replace("/login"),
  });

  return <>
    <button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate()} aria-label={label} className={`${className} disabled:opacity-60`}>
      <LogOut className="h-[18px] w-[18px]" aria-hidden />
      {label}
    </button>
    {mutation.isError && <span role="alert" className="text-xs text-error">{mutation.error.message}</span>}
  </>;
}
