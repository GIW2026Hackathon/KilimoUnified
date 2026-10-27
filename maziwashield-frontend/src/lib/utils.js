import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/* Teach tailwind-merge our custom font-size names so they are not mistaken for text colors */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-hero",
            "display-hero-mobile",
            "headline-xl",
            "headline-xl-mobile",
            "headline-lg",
            "headline-lg-mobile",
            "headline-md",
            "title-lg",
            "title-md",
            "body-lg",
            "body-md",
            "body-sm",
            "label-caps",
            "label-numeric-currency",
          ],
        },
      ],
    },
  },
});

/** Merge conditional classes. Always pass full static class strings. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatKES(value) {
  return `KES ${Number(value).toLocaleString("en-KE")}`;
}