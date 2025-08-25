"use client"

import type { Column } from "@tanstack/react-table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

import { Button } from "@/components/ui/button"

type Props<TData> = {
  column: Column<TData, unknown>
  title: string
}

export function DataTableColumnHeader<TData>({ column, title }: Props<TData>) {
  const sorted = column.getIsSorted()
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className="-ml-3 h-8"
    >
      {title}
      {sorted === false && <ArrowUpDown className="ml-2 h-4 w-4" />}
      {sorted === "asc" && <ArrowUp className="ml-2 h-4 w-4" />}
      {sorted === "desc" && <ArrowDown className="ml-2 h-4 w-4" />}
    </Button>
  )
}
