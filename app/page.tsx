import { Metadata } from "next";
import { FinancialDashboard } from "@/components/dashboard/financial-dashboard";

export const metadata: Metadata = {
  title: "Eugene Intelligence - Professional Financial Analysis Platform",
  description: "Professional-grade financial analysis platform powered by AI. Real-time market data, portfolio management, research automation, and institutional-quality analytics.",
};

export default function HomePage() {
  return <FinancialDashboard />;
}