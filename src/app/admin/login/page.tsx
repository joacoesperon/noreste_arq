import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar" };

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <Image src="/images/logo.png" alt="noreste arq" width={120} height={35} className="h-auto w-28" priority />
        <LoginForm next={next ?? "/admin"} />
      </div>
    </main>
  );
}
