// app/layout.tsx
export const metadata = {
  title: "Why Diaspora Voting Matters | #FixPolitics",
  description:
    "20M Nigerians abroad remit $20.93B annually — and cannot vote. Sign the petition and download the full policy report.",
  openGraph: {
    title: "Why Diaspora Voting Matters Beyond Policy",
    description: "Sign the petition. Download the report. Demand democratic inclusion.",
    images: ["/nigeriansindiaspora.jpeg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}