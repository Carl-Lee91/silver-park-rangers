import { AdminShell } from "@/widgets/admin-shell";

export default function Layout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
