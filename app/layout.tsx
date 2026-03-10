// app/layout.tsx
export const metadata = {
  title: "Why Diaspora Voting Matters | #FixPolitics",
  description:
    "20M Nigerians abroad remit $20.93B annually — and cannot vote. Sign the petition and download the full policy report.",
  openGraph: {
    title: "Why Diaspora Voting Matters Beyond Policy",
    description: "Sign the petition. Download the report. Demand democratic inclusion.",
    images: ["https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}