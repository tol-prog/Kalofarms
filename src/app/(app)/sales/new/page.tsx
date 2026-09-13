import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Egg, Wheat, ArrowRight } from "lucide-react";

export default function SalesPickerPage() {
  return (
    <div className="max-w-xl">
      <PageHeader title="Log Sale" description="Choose what was sold." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/sales/eggs/new" className="kf-card p-5 flex flex-col gap-3 hover:bg-[--color-table-row-hover]">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--color-sidebar-active-bg)" }}>
            <Egg size={19} className="text-[--color-primary]" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Egg Sale</h2>
            <p className="text-xs text-gray-500">Reduces egg inventory</p>
          </div>
          <span className="text-xs font-medium text-[--color-primary] flex items-center gap-1 mt-auto">
            Log egg sale <ArrowRight size={13} />
          </span>
        </Link>
        <Link href="/sales/feed/new" className="kf-card p-5 flex flex-col gap-3 hover:bg-[--color-table-row-hover]">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "#eef2fb" }}>
            <Wheat size={19} style={{ color: "#3454a8" }} />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Feed Sale</h2>
            <p className="text-xs text-gray-500">Reduces the specific feed type sold</p>
          </div>
          <span className="text-xs font-medium text-[--color-primary] flex items-center gap-1 mt-auto">
            Log feed sale <ArrowRight size={13} />
          </span>
        </Link>
      </div>
    </div>
  );
}
