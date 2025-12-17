import { SignupForm } from "@/components/auth/signup-form";
import Link from "next/link";
import { Logo } from "@/components/icons";

export default function SignupPage() {
  return (
    <div className="mx-auto grid w-[350px] gap-6">
      <div className="grid gap-2 text-center">
        <Logo className="justify-center"/>
        <h1 className="text-3xl font-bold">Sign Up</h1>
        <p className="text-balance text-muted-foreground">
          Create an account to start organizing your tasks
        </p>
      </div>
      <SignupForm />
      <div className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Login
        </Link>
      </div>
    </div>
  );
}
