import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function OrgChart() {
  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <header className="sticky top-0 z-50 border-b-4 border-[#C9A961] bg-[#000000]/97 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/"><Button variant="outline" size="sm" className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 text-xs"><ArrowLeft className="w-3 h-3 mr-1" /> Terminal</Button></Link>
            <div>
              <h1 className="text-[#C9A961] text-xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Organization Chart</h1>
              <p className="text-[#8A7548] text-xs">Armstrong Arikat Private Wealth Group — 39 Professionals</p>
            </div>
          </div>
          <Link href="/team"><Button variant="outline" size="sm" className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 text-xs">View Team Directory</Button></Link>
        </div>
      </header>
      <main className="p-4 flex justify-center">
        <img src="/manus-storage/aa_org_credentials_ccc54fd9.png" alt="Armstrong Arikat Organization Chart" className="w-full max-w-[1400px] rounded-lg" />
      </main>
    </div>
  );
}
