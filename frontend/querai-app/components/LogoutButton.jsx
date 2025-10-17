"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/app/actions/auth";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? "Logging out..." : "Logout"}
    </Button>
  );
}

export default function LogoutButton() {
  return (
    <form action={signOut}>
      <SubmitButton />
    </form>
  );
}
