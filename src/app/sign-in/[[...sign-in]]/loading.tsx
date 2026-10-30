import { AuthCardLoading } from "@/components/auth/auth-card-loading";
import { AuthShell } from "@/components/auth/auth-shell";

export default function SignInLoading() {
  return (
    <AuthShell>
      <AuthCardLoading />
    </AuthShell>
  );
}
