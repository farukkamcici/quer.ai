import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Querai",
  description: "Querai is an explainable natural language data analytics platform that transforms user questions into secure, transparent SQL queries and interactive visual insights.",
  icons: {
    icon: "/icon-light.svg",
    shortcut: "/icon-light.svg",
    apple: "/icon-light.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Initialize theme before hydration to avoid FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function(){
              try {
                var saved = localStorage.getItem('theme');
                // Default to dark when no explicit preference is saved
                var t = saved || 'dark';
                document.documentElement.setAttribute('data-theme', t);
                if (t === 'dark') { document.documentElement.classList.add('dark'); } else { document.documentElement.classList.remove('dark'); }
              } catch(e){}
            })();
          `,
          }}
        />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
