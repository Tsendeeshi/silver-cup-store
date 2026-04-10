import type { Metadata } from "next";
import { Cormorant_Garamond, Libre_Franklin } from "next/font/google";
import Link from "next/link";
import CartBadge from "./components/CartBadge";
import "./globals.css";

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const bodyFont = Libre_Franklin({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600"],
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
    <html lang="mn" className="dark">
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
              priceRange: "35,000₮ - 350,000₮",
              address: {
                "@type": "PostalAddress",
                addressCountry: "MN",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${displayFont.variable} ${bodyFont.variable} antialiased`}
      >
        {/* Top bar */}
        <div className="border-b border-gold/10 bg-dark text-center text-[10px] font-light tracking-[0.4em] text-gold/50 py-2.5 uppercase">
          Монгол гар урлалын мөнгөн эдлэл
        </div>

        <header className="sticky top-0 z-50 border-b border-white/5 bg-dark/95 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <Link href="/" className="group flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-light tracking-[0.15em] text-white/90 uppercase">
                Дүүрэн
              </span>
              <span className="font-display text-2xl font-semibold tracking-[0.15em] text-gold uppercase">
                Гоёл
              </span>
            </Link>
            <div className="flex items-center gap-8">
              <Link
                href="/"
                className="text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase hover:text-gold transition-colors duration-300"
              >
                Бүтээгдэхүүн
              </Link>
              <Link
                href="/orders"
                className="text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase hover:text-gold transition-colors duration-300"
              >
                Захиалга
              </Link>
              <CartBadge />
            </div>
          </nav>
        </header>

        <main className="min-h-screen">{children}</main>

        {/* Footer */}
        <footer className="border-t border-white/5 bg-dark">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              <div>
                <h3 className="font-display mb-4 text-lg font-light tracking-widest text-white/80 uppercase">
                  Дүүрэн Гоёл
                </h3>
                <p className="text-xs leading-[1.9] text-white/30 font-light">
                  Монгол уламжлалт гар урлалын мөнгөн эдлэлийн дэлгүүр.
                  Бидний бүтээгдэхүүн бүр урлагийн бүтээл.
                </p>
              </div>
              <div>
                <h3 className="font-display mb-4 text-lg font-light tracking-widest text-white/80 uppercase">
                  Холбоос
                </h3>
                <div className="flex flex-col gap-2.5 text-xs font-light">
                  <Link href="/" className="text-white/30 hover:text-gold transition-colors">
                    Бүтээгдэхүүн
                  </Link>
                  <Link href="/orders" className="text-white/30 hover:text-gold transition-colors">
                    Захиалга шалгах
                  </Link>
                </div>
              </div>
              <div>
                <h3 className="font-display mb-4 text-lg font-light tracking-widest text-white/80 uppercase">
                  Холбоо барих
                </h3>
                <div className="flex flex-col gap-2.5 text-xs text-white/30 font-light">
                  <p>Утас: +976 0000-0000</p>
                  <p>И-мэйл: info@duurengoyl.mn</p>
                </div>
              </div>
            </div>
            <div className="mt-12 border-t border-white/5 pt-6 text-center text-[10px] text-white/20 tracking-wider">
              &copy; 2026 Дүүрэн Гоёл. Бүх эрх хуулиар хамгаалагдсан.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
