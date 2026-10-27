import Image from "next/image";
import { cn } from "@/lib/utils";

export default function Photo({ src, alt, sizes = "100vw", priority = false, className }) {
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-cover", className)} />;
}