"use client";

import QueryProvider from "@/providers/query-provider";
import { LanguageProvider } from "@/providers/language-provider";
import { ToastProvider } from "@/components/ui/toast";

export default function AppProviders({ children }) {
  return (
    <QueryProvider>
      <LanguageProvider>
        <ToastProvider>{children}</ToastProvider>
      </LanguageProvider>
    </QueryProvider>
  );
}