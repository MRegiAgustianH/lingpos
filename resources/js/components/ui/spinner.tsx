import { BoxIcon } from '@/components/ui/box-icon';

import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <BoxIcon
      name="bx-loader-alt"
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props as any}
    />
  )
}

export { Spinner }
