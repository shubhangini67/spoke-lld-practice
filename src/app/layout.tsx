import type { Metadata } from "next";
import { Figtree, Syne } from "next/font/google";
import { Shell } from "@/components/shell";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spoke — LLD practice studio",
  description:
    "Rehearse the low-level design interview: lock scope, name types, walk a use case, defend a trade-off, and get feedback that allows more than one valid design.",
};

const themeScript = `(function(){try{var t=localStorage.getItem("spoke-theme");if(t!=="day"&&t!=="night"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"day":"night"}document.documentElement.setAttribute("data-theme",t)}catch(e){document.documentElement.setAttribute("data-theme","night")}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${figtree.variable} ${syne.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
