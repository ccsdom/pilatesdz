import { getPageAccess } from "@/lib/auth/page-access";
import { AccessErrorView } from "@/features/auth/access-error";
import { CrmRoleProvider } from "@/features/auth/crm-role";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const result = await getPageAccess(["admin", "manager"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  return <CrmRoleProvider value={result.access.role}>{children}</CrmRoleProvider>;
}
