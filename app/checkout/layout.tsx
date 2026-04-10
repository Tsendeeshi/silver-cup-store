import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Захиалга баталгаажуулах",
  description: "Захиалгаа баталгаажуулж, төлбөрөө төлнө үү.",
  robots: { index: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
