import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, User, CreditCard, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface PersonRole {
  id: string;
  roleType: string;
  designation: string | null;
  department: string | null;
  organizationId: string;
  status: string;
}

export interface PersonSearchResult {
  id: string;
  cnic: string | null;
  phone: string | null;
  firstName: string;
  lastName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  bloodGroup: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  isActive: boolean;
  roles: PersonRole[];
  displayLabel: string;
}

interface PersonSearchProps {
  onSelect: (person: PersonSearchResult) => void;
  onClear?: () => void;
  selectedPerson?: PersonSearchResult | null;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  organizationId?: string; // Optional: override organization for search
}

export default function PersonSearch({
  onSelect,
  onClear,
  selectedPerson,
  placeholder = "Search by name, phone, or CNIC...",
  disabled = false,
  className,
  organizationId,
}: PersonSearchProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchByCnic, setSearchByCnic] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use provided organizationId or user's organizationId
  const effectiveOrgId = organizationId || user?.organizationId;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Build query URL with all required parameters - use full URL as queryKey[0] for default fetcher
  const searchType = searchByCnic ? "cnic" : "all";
  const queryUrl = debouncedQuery.length >= 2 && effectiveOrgId
    ? `/api/persons/search-with-roles?query=${encodeURIComponent(debouncedQuery)}&searchType=${searchType}&organizationId=${effectiveOrgId}`
    : "";
  
  const { data: searchResults = [], isLoading } = useQuery<PersonSearchResult[]>({
    queryKey: [queryUrl], // Full URL as queryKey for default fetcher
    enabled: debouncedQuery.length >= 2 && !!effectiveOrgId && !!queryUrl,
  });

  const handleSelect = (person: PersonSearchResult) => {
    onSelect(person);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchQuery("");
    onClear?.();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  // If a person is selected, show their info
  if (selectedPerson) {
    return (
      <Card className={cn("p-3 bg-muted/50", className)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">
                {selectedPerson.firstName} {selectedPerson.lastName}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedPerson.roles && selectedPerson.roles.length > 0 ? (
                  selectedPerson.roles.map((role, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {(role.designation || role.roleType || "Staff").replace(/_/g, " ")}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {selectedPerson.phone && `Phone: ${selectedPerson.phone}`}
                    {selectedPerson.cnic && !selectedPerson.phone && `CNIC: ${selectedPerson.cnic}`}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleClear}
            disabled={disabled}
            data-testid="button-clear-person"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchByCnic ? "Enter CNIC (XXXXX-XXXXXXX-X)..." : placeholder}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => searchQuery.length >= 2 && setIsOpen(true)}
            disabled={disabled}
            className="pl-9 pr-9"
            data-testid="input-person-search"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox
            id="search-by-cnic"
            checked={searchByCnic}
            onCheckedChange={(checked) => setSearchByCnic(checked === true)}
            disabled={disabled}
            data-testid="checkbox-search-cnic"
          />
          <Label htmlFor="search-by-cnic" className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1">
            <CreditCard className="h-3 w-3" />
            Search by CNIC only
          </Label>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && debouncedQuery.length >= 2 && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto shadow-lg">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Searching...
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No matching persons found
            </div>
          ) : (
            <ul className="divide-y">
              {searchResults.map((person) => (
                <li
                  key={person.id}
                  className="p-3 hover-elevate cursor-pointer"
                  onClick={() => handleSelect(person)}
                  data-testid={`person-result-${person.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{person.displayLabel}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                        {person.cnic && <span>CNIC: {person.cnic}</span>}
                        {person.phone && !person.cnic && <span>Phone: {person.phone}</span>}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
