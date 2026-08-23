import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: React.ReactNode;
  variant?: "app" | "auth";
  className?: string;
  as?: "main" | "div";
};

const base = "mx-auto w-full px-4 md:px-6 lg:px-8";

const variants = {
  app: cn(
    base,
    "max-w-md flex-1 pt-6 pb-28 md:max-w-2xl md:pb-32 lg:max-w-5xl lg:pb-8 lg:pt-8",
  ),
  auth: cn(
    base,
    "flex min-h-dvh max-w-md flex-col justify-center py-8 md:max-w-lg",
  ),
};

export function PageContainer({
  children,
  variant = "app",
  className,
  as: Component = variant === "app" ? "main" : "div",
}: PageContainerProps) {
  return <Component className={cn(variants[variant], className)}>{children}</Component>;
}
