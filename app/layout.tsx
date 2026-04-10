import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import CartBadge from "./components/CartBadge";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://duurengoyl.mn";
const OG_IMAGE = "https://vdoieqzhmvilwmnkzzvh.supabase.co/storage/v1/object/public/product-images/full/65.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Дүүрэн Гоёл | Монгол гар урлалын мөнгөн эдлэл",
    template: "%s | Дүүрэн Гоёл",
  },
  description:
    "Монгол уламжлалт гар урлалын мөнгөн аяга, таваг, халбага, данх, бэлэг дурсгал. Дархан урчуудын гар ажиллагаатай 925 мөнгөн эдлэл.",
  keywords: [
    "мөнгөн аяга",
    "зэс аяга",
    "монгол гар урлал",
    "бэлэг дурсгал",
    "мөнгөн эдлэл",
    "дүүрэн гоёл",
    "зэс таваг",
    "халбага",
    "монгол уламжлал",
  ],
  authors: [{ name: "Дүүрэн Гоёл" }],
  openGraph: {
    type: "website",
    locale: "mn_MN",
    siteName: "Дүүрэн Гоёл",
    title: "Дүүрэн Гоёл | Монгол гар урлалын мөнгөн эдлэл",
    description:
      "Монгол уламжлалт гар урлалын мөнгөн аяга, таваг, халбага, данх, бэлэг дурсгал. Дархан урчуудын гар ажиллагаа.",
    images: [{ url: OG_IMAGE, width: 1200, height: 960, alt: "Дүүрэн Гоёл мөнгөн эдлэл" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Дүүрэн Гоёл | Монгол гар урлалын мөнгөн эдлэл",
    description:
      "Монгол уламжлалт гар урлалын мөнгөн аяга, таваг, бэлэг дурсгал.",
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              name: "Дүүрэн Гоёл",
              description:
                "Монгол уламжлалт гар урлалын мөнгөн аяга, таваг, халбага, бэлэг дурсгал",
              url: SITE_URL,
              logo: OG_IMAGE,
              priceRange: "₮35,000 - ₮350,000",
              address: {
                "@type": "PostalAddress",
                addressCountry: "MN",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Top bar */}
        <div className="bg-dark text-center text-xs tracking-widest text-white/70 py-2">
          МОНГОЛ ГАР УРЛАЛЫН МӨНГӨН ЭДЛЭЛ
        </div>

        <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-cream/95 backdrop-blur-md">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <Link href="/" className="group">
              <span className="text-2xl font-light tracking-[0.15em] text-dark uppercase">
                Дүүрэн
              </span>
              <span className="text-2xl font-semibold tracking-[0.15em] text-gold ml-1 uppercase">
                Гоёл
              </span>
            </Link>
            <div className="flex items-center gap-8">
              <Link
                href="/"
                className="text-xs tracking-widest text-zinc-600 uppercase hover:text-gold transition-colors"
              >
                Бүтээгдэхүүн
              </Link>
              <Link
                href="/orders"
                className="text-xs tracking-widest text-zinc-600 uppercase hover:text-gold transition-colors"
              >
                Захиалга
              </Link>
              <CartBadge />
            </div>
          </nav>
        </header>

        <main className="min-h-screen">{children}</main>

        {/* Footer */}
        <footer className="bg-dark text-white/60">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div>
                <h3 className="mb-4 text-sm font-semibold tracking-widest text-white uppercase">
                  Дүүрэн Гоёл
                </h3>
                <p className="text-sm leading-relaxed">
                  Монгол уламжлалт гар урлалын мөнгөн эдлэлийн дэлгүүр.
                  Бидний бүтээгдэхүүн бүр урлагийн бүтээл.
                </p>
              </div>
              <div>
                <h3 className="mb-4 text-sm font-semibold tracking-widest text-white uppercase">
                  Холбоос
                </h3>
                <div className="flex flex-col gap-2 text-sm">
                  <Link href="/" className="hover:text-gold transition-colors">
                    Бүтээгдэхүүн
                  </Link>
                  <Link href="/orders" className="hover:text-gold transition-colors">
                    Захиалга шалгах
                  </Link>
                </div>
              </div>
              <div>
                <h3 className="mb-4 text-sm font-semibold tracking-widest text-white uppercase">
                  Холбоо барих
                </h3>
                <div className="flex flex-col gap-2 text-sm">
                  <p>Утас: +976 0000-0000</p>
                  <p>И-мэйл: info@duurengoyl.mn</p>
                </div>
              </div>
            </div>
            <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40">
              &copy; 2026 Дүүрэн Гоёл. Бүх эрх хуулиар хамгаалагдсан.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
