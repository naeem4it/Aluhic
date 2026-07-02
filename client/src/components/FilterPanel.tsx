import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";

interface FilterPanelProps {
  onFilterChange?: (filters: { dateFrom?: string; dateTo?: string }) => void;
}

export function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const applyFilters = () => {
    const newFilters: Record<string, string> = {};
    if (dateFrom) newFilters.dateFrom = dateFrom;
    if (dateTo) newFilters.dateTo = dateTo;
    setFilters(newFilters);
    
    if (onFilterChange) {
      onFilterChange({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
    }
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setFilters({});
    
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  const removeFilter = (key: string) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);

    if (key === "dateFrom") setDateFrom("");
    if (key === "dateTo") setDateTo("");
    
    if (onFilterChange) {
      onFilterChange({
        dateFrom: key === "dateFrom" ? undefined : dateFrom || undefined,
        dateTo: key === "dateTo" ? undefined : dateTo || undefined,
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Filters</CardTitle>
        <Filter className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="date-from">From Date</Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              data-testid="input-date-from"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date-to">To Date</Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              data-testid="input-date-to"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={applyFilters} className="flex-1" data-testid="button-apply-filters">
            Apply Filters
          </Button>
          <Button
            variant="outline"
            onClick={clearFilters}
            data-testid="button-clear-filters"
          >
            Clear
          </Button>
        </div>

        {Object.keys(filters).length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {Object.entries(filters).map(([key, value]) => (
              <Badge
                key={key}
                variant="secondary"
                className="gap-1"
                data-testid={`badge-filter-${key}`}
              >
                {key}: {value}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeFilter(key)}
                />
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
