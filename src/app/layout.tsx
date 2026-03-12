
import type { Metadata } from "next";
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { AppGuard } from "@/components/app-guard";

export const metadata: Metadata = {
  title: "HUNAR-YOB — Платформаи устоҳо ва ҳунармандони Тоҷикистон",
  description: "Бузургтарин ва беҳтарин платформаи рақами яки Тоҷикистон барои пайдо кардани устоҳои моҳир. HUNAR-YOB — маҳоратро ёб!",
  keywords: "HUNAR-YOB, Хунариёб, Кориёб, усто, Тоҷикистон, хизматрасонӣ, сохтмон, таъмир, сантехник, барқчӣ, дӯзанда",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  robots: "index, follow",
  themeColor: "#FF7F50",
  openGraph: {
    type: "website",
    locale: "tg_TJ",
    url: "https://hunaryob.tj",
    title: "HUNAR-YOB — Платформаи устоҳои Тоҷикистон",
    description: "Бо HUNAR-YOB беҳтарин устоҳоро дар Тоҷикистон пайдо кунед.",
    siteName: "HUNAR-YOB",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tg">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen pb-16 md:pb-0">
        <FirebaseClientProvider>
          <AppGuard>
            {children}
          </AppGuard>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
