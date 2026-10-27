"use client";

import { useMemo, useState } from "react";
import { Hourglass, Sprout, TriangleAlert, Truck } from "lucide-react";
import StatCard from "@/components/ui/stat-card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Progress from "@/components/ui/progress";
import Tabs, { TabPanel } from "@/components/ui/tabs";
import DataTable from "@/components/ui/table";
import Pagination from "@/components/ui/pagination";
import Modal from "@/components/ui/modal";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Skeleton from "@/components/ui/skeleton";
import Tooltip from "@/components/ui/tooltip";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useShellAction } from "@/components/layout/shell-context";

const ROWS = [
  { id: "MS-8842", feed: "Boma Rhodes Hay (80 Bales)", total: 22400, status: "Escrow Secured", tone: "warning" },
  { id: "MS-8819", feed: "Dairy Meal 16% CP (20 Bags)", total: 52000, status: "Dispatching", tone: "info" },
  { id: "MS-8790", feed: "Silage Bunker Lot #2 (4 Tons)", total: 36000, status: "Delivered", tone: "mint" },
];

export default function DashboardPreview() {
  const { toast } = useToast();
  const [tab, setTab] = useState("a");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: "total", dir: "desc" });

  useShellAction("quick-action", () => setOpen(true));

  const rows = useMemo(
    () => [...ROWS].sort((a, b) => (sort.dir === "asc" ? 1 : -1) * (a[sort.key] > b[sort.key] ? 1 : -1)),
    [sort]
  );

  const columns = [
    { key: "id", label: "Order ID", card: "title", className: "font-mono font-bold text-primary" },
    { key: "feed", label: "Feed", className: "font-title-md text-on-surface" },
    { key: "total", label: "Total (KES)", sortable: true, render: (r) => r.total.toLocaleString("en-KE") },
    { key: "status", label: "Status", render: (r) => <Badge tone={r.tone}>{r.status}</Badge> },
    {
      key: "action",
      label: "Action",
      align: "right",
      card: "actions",
      render: () => (
        <Button variant="outline" size="sm" onClick={() => toast({ title: "Dispatch tracking opened" })}>
          Track Dispatch
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary md:text-headline-lg">Phase 2 preview</h1>

      <section className="grid grid-cols-1 gap-space-md md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Feed Stock" value="12,480" unit="kg" icon={Sprout} tone="mint">
          <p className="mt-1 text-xs font-medium text-secondary">+4.2% vs last week</p>
        </StatCard>
        <StatCard label="Feed Autonomy" value="18" unit="Days" icon={Hourglass} tone="amber">
          <p className="mt-1 text-xs font-semibold text-amber-800">Buffer threshold: 21 days min</p>
        </StatCard>
        <StatCard label="Shortage Risk" icon={TriangleAlert} tone="orange">
          <Badge tone="warning" size="md">Medium</Badge>
        </StatCard>
        <StatCard label="Pending Co-op Orders" value="3" unit="Orders" icon={Truck} tone="sky" />
      </section>

      <Card className="space-y-4 p-space-lg">
        <CardHeader>
          <CardTitle>Primitives</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setOpen(true)}>Open modal</Button>
            <Button variant="forest" onClick={() => toast({ title: "Saved", description: "Toast works." })}>Toast</Button>
            <Button variant="brand" loading>Loading</Button>
            <Tooltip label="Tooltip text">
              <Button variant="outline">Hover or focus me</Button>
            </Tooltip>
          </div>
        </CardHeader>
        <Progress value={72} tone="lime" label="Feed reserve" />
        <Tabs
          label="Preview tabs"
          idPrefix="demo"
          value={tab}
          onChange={setTab}
          variant="segmented"
          items={[
            { value: "a", label: "All" },
            { value: "b", label: "Critical" },
            { value: "c", label: "Co-op" },
          ]}
        />
        <TabPanel value="a" active={tab} idPrefix="demo">Tab A panel</TabPanel>
        <TabPanel value="b" active={tab} idPrefix="demo">Tab B panel</TabPanel>
        <TabPanel value="c" active={tab} idPrefix="demo">Tab C panel</TabPanel>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-24" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <DataTable
          caption="Recent purchase orders"
          columns={columns}
          rows={rows}
          getRowKey={(r) => r.id}
          sort={sort}
          onSort={(key) => setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }))}
        />
        <Pagination page={page} pageCount={3} onPageChange={setPage} total={28} pageSize={10} onPageSizeChange={() => {}} noun="orders" />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Preview modal"
        description="Full-screen sheet on mobile, centered dialog from sm"
        icon={Sprout}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="brand" form="preview-form" type="submit">Save</Button>
          </div>
        }
      >
        <form
          id="preview-form"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
            toast({ title: "Saved" });
          }}
        >
          <Input label="Farm name" required placeholder="Muguga Highland Shamba" />
          <Select label="County" options={["Kiambu", "Nakuru", "Uasin Gishu"]} />
        </form>
      </Modal>
    </div>
  );
}