import localFont from 'next/font/local';
import './globals.css';
const geist = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist',
  weight: '100 900',
  display: 'swap',
});
export const metadata = {
  title: 'Gather — A space for your people',
  description:
    'Bring your conversations together. Private messages, shared circles, and a little more connection.',
};
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={geist.variable}>{children}</body>
    </html>
  );
}
