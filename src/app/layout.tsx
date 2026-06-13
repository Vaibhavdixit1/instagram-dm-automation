import type { Metadata } from "next";
import { ToastContainer } from "react-toastify";
import "react-toastify/ReactToastify.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "instagram-dm-automation",
  description: "Instagram keyword DM automation for creators.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <ToastContainer position="top-right" autoClose={5000} theme="colored" />
      </body>
    </html>
  );
}
