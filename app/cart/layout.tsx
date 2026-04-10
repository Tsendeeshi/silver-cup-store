import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Сагс",
  description: "Таны сонгосон бүтээгдэхүүнүүд. Дүүрэн Гоёл мөнгөн эдлэлийн дэлгүүр.",
  robots: { index: false },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
