import { AuthCardLoading } from "@/components/auth/auth-card-loading";
import { AuthShell } from "@/components/auth/auth-shell";

export default function ForbiddenLoading() {
  return (
    <AuthShell>
      <AuthCardLoading />
    </AuthShell>
  );
}
