import { SalesEntryForm } from "@/components/SalesEntryForm";

export default function Entry() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">New Sales Entry</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Record your daily sales transactions
        </p>
      </div>
      <SalesEntryForm />
    </div>
  );
}
