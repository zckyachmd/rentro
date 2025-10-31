import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      expand
      visibleToasts={6}
      gap={12}
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
        ),
        info: <InfoIcon className="size-4 text-sky-600 dark:text-sky-400" />,
        warning: (
          <TriangleAlertIcon className="size-4 text-amber-600 dark:text-amber-400" />
        ),
        error: <OctagonXIcon className="size-4 text-rose-600 dark:text-rose-400" />,
        loading: <Loader2Icon className="size-4 animate-spin text-primary" />,
        close: <XIcon className="size-3.5 text-muted-foreground" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      // Default UI tweaks: add close button and style actions
      toastOptions={{
        closeButton: true,
        duration: 4500,
        classNames: {
          // Container (polished surface + micro-interactions)
          toast:
            "group/toast pointer-events-auto rounded-lg border border-border/50 bg-popover/85 backdrop-blur supports-[backdrop-filter]:backdrop-blur-xl shadow-md ring-1 ring-black/5 dark:ring-white/5 transition-all will-change-transform hover:shadow-lg hover:-translate-y-0.5",
          // Variant overlays to add subtle accents when richColors is enabled
          success:
            "ring-emerald-500/15 data-[rich-colors=true]:shadow-emerald-500/10 data-[rich-colors=true]:bg-gradient-to-br data-[rich-colors=true]:from-emerald-500/10 data-[rich-colors=true]:to-emerald-500/5",
          info:
            "ring-sky-500/15 data-[rich-colors=true]:shadow-sky-500/10 data-[rich-colors=true]:bg-gradient-to-br data-[rich-colors=true]:from-sky-500/10 data-[rich-colors=true]:to-sky-500/5",
          warning:
            "ring-amber-500/15 data-[rich-colors=true]:shadow-amber-500/10 data-[rich-colors=true]:bg-gradient-to-br data-[rich-colors=true]:from-amber-500/10 data-[rich-colors=true]:to-amber-500/5",
          error:
            "ring-rose-500/15 data-[rich-colors=true]:shadow-rose-500/10 data-[rich-colors=true]:bg-gradient-to-br data-[rich-colors=true]:from-rose-500/10 data-[rich-colors=true]:to-rose-500/5",
          loading: "ring-primary/10",
          default: "ring-border/40",

          // Text
          title: "text-sm font-medium",
          description: "text-xs text-muted-foreground",

          // Icon wrapper — only backdrop and ring; color handled by SVG
          icon:
            [
              "rounded-full p-1.5 ring-1 transition-transform group-hover/toast:scale-110",
              // base
              "bg-background/70 ring-border/40",
              // variant tints (no text color here)
              "group-[data-type=success]/toast:ring-emerald-500/30 group-[data-type=success]/toast:bg-emerald-500/10",
              "group-[data-type=info]/toast:ring-sky-500/30 group-[data-type=info]/toast:bg-sky-500/10",
              "group-[data-type=warning]/toast:ring-amber-500/30 group-[data-type=warning]/toast:bg-amber-500/10",
              "group-[data-type=error]/toast:ring-rose-500/30 group-[data-type=error]/toast:bg-rose-500/10",
            ].join(' '),

          // Action buttons — icon-only, force transparent background in all states
          actionButton:
            "inline-flex items-center justify-center size-8 rounded-md text-foreground/70 hover:text-foreground bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent focus-visible:bg-transparent border-0 outline-none ring-0 focus:ring-0 focus-visible:ring-0 shadow-none [&_*]:bg-transparent [&_*]:shadow-none [&_*]:border-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
          cancelButton:
            "inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent focus-visible:bg-transparent border-0 outline-none ring-0 focus:ring-0 focus-visible:ring-0 shadow-none [&_*]:bg-transparent [&_*]:shadow-none [&_*]:border-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
          closeButton:
            "inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] size-7",

          // Layout bits
          content: "grid gap-1",
          loader:
            "h-0.5 rounded-full bg-primary/60 opacity-80 group-hover/toast:opacity-100",
        },
      }}
      offset={16}
      {...props}
    />
  )
}

export { Toaster }
