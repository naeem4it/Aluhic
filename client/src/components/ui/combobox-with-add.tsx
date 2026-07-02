import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxWithAddProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  onAddNew: (name: string) => Promise<ComboboxOption | null>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  "data-testid"?: string;
}

export function ComboboxWithAdd({
  options,
  value,
  onChange,
  onAddNew,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
  isLoading = false,
  className,
  "data-testid": testId,
}: ComboboxWithAddProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const selectedOption = options.find((option) => option.value === value);
  
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const canAddNew = search.trim().length > 0 && 
    !options.some(opt => opt.label.toLowerCase() === search.toLowerCase().trim());

  const handleAddNew = async () => {
    if (!canAddNew || isAdding) return;
    
    setIsAdding(true);
    try {
      const newOption = await onAddNew(search.trim());
      if (newOption) {
        onChange(newOption.value);
        setOpen(false);
        setSearch("");
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
          disabled={disabled || isLoading}
          data-testid={testId}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : selectedOption ? (
            selectedOption.label
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
            data-testid={testId ? `${testId}-search` : undefined}
          />
          <CommandList>
            <CommandEmpty>
              {canAddNew ? (
                <div className="py-2 text-center text-sm text-muted-foreground">
                  Press Enter or click below to add "{search.trim()}"
                </div>
              ) : (
                emptyMessage
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  data-testid={testId ? `${testId}-option-${option.value}` : undefined}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {canAddNew && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleAddNew}
                    disabled={isAdding}
                    className="text-primary cursor-pointer"
                    data-testid={testId ? `${testId}-add-new` : undefined}
                  >
                    {isAdding ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Add "{search.trim()}"
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
