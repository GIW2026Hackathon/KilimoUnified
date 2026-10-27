import { Inter, Newsreader, Poppins } from "next/font/google";
import "./globals.css";
import AppProviders from "@/providers/app-providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
  adjustFontFallback: false,
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata = {
  title: "MaziwaShield | Kenya's Dairy Feed Resilience Network",
  description:
    "Healthy Cows • Quality Milk • Better Livelihoods. Feed security, shortage alerts and cooperative procurement for Kenyan dairy farmers.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${newsreader.variable} ${poppins.variable}`}
    >
      <body className="bg-surface font-sans text-on-surface antialiased selection:bg-secondary-container selection:text-primary">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}