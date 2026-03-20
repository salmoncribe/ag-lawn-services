"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      onClick={() => startTransition(() => logoutAction())}
      disabled={isPending}
    >
      <LogOut className="h-4 w-4" />
      {isPending ? "Signing out..." : "Logout"}
    </Button>
  );
}
