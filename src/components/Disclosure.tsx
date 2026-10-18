import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface Props {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  /** Replaces the default plain-text trigger look, e.g. when the title is a whole list row. */
  triggerClassName?: string;
  chevron?: boolean;
}

/** Collapsible section with a chevron trigger: the dashboard's one way to fold detail away. */
export function Disclosure({ title, children, defaultOpen, className, triggerClassName, chevron = true }: Props) {
  return (
    <Collapsible defaultOpen={defaultOpen} className={className}>
      <CollapsibleTrigger
        className={cn(
          "group flex min-h-8 w-full cursor-pointer items-center gap-2 rounded-md text-left text-[13px] font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          triggerClassName,
        )}
      >
        {chevron && (
          <ChevronRight className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-90" aria-hidden="true" />
        )}
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}
