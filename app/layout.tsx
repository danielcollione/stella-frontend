import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Nunito } from "next/font/google";
import { MotionProvider } from "@/components/layout/MotionProvider";
import { ViewportVars } from "@/components/layout/ViewportVars";
import { SPLASH_SCREENS } from "@/utils/splashScreens";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_TITLE, SITE_URL } from "@/utils/site";
import "@/app/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Arredondada, para números de destaque (ex: dias do calendário)
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "fashion",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  // Código de confirmação do Google Search Console (só a parte do "content" da meta tag)
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  formatDetection: { telephone: false },
  // Instalada na tela inicial do iPhone, a Stella abre em tela cheia com este nome
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default", startupImage: SPLASH_SCREENS },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Ocupa a tela inteira, inclusive em volta do recorte; as margens seguras são tratadas no CSS
  viewportFit: "cover",
  themeColor: "#FAF8F5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><ViewportVars /><MotionProvider>{children}</MotionProvider></body>
    </html>
  );
}
