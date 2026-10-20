import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
export const metadata: Metadata = {
  title: "ParcelCare · Every exception, accounted for",
  description:
    "Report delivery exceptions, coordinate support, and follow your case.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>
        <Script
          id="parcelcare-theme"
          strategy="beforeInteractive"
        >{`try{document.documentElement.dataset.theme=localStorage.getItem("parcelcare-theme")==="dark"?"dark":"light"}catch{document.documentElement.dataset.theme="light"}`}</Script>
        {children}
      </body>
    </html>
  );
}
