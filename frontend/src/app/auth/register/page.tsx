import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";

export default function RegisterPage(): React.ReactElement {
  return (
    <div className="min-h-dvh bg-bg-base text-text-primary">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 md:px-6 md:py-16">
        <AuthForm mode="register" />
      </main>
    </div>
  );
}
