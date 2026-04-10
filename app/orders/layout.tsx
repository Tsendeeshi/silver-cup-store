import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Захиалга шалгах",
  description: "Захиалгын дугаараар захиалгын явцыг шалгана уу. Дүүрэн Гоёл.",
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
