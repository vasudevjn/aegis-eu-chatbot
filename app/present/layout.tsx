import type { Metadata } from "next";
import { AI_NAME, AI_TAGLINE } from "@/config";

export const metadata: Metadata = {
  title: `${AI_NAME} · Presentation`,
  description: `${AI_NAME}, the ${AI_TAGLINE}: problem, solution, live demo and how it is built.`,
};

export default function PresentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
