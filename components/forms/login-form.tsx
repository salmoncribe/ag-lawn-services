"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { KeyRound } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginValues } from "@/lib/schemas";

type LoginFormProps = {
  callbackUrl: string;
};

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  const onSubmit = async (values: LoginValues) => {
    setError("");

    const result = await signIn("credentials", {
      username: values.username,
      password: values.password,
      redirect: false
    });

    if (result?.error) {
      setError("Invalid username or password.");
      return;
    }

    router.push(callbackUrl || "/dashboard");
    router.refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <Card className="overflow-hidden border-white/50 bg-white/90">
        <CardHeader className="space-y-4 border-b border-[#ecdfcc] pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-[2.3rem]">Account login</CardTitle>
              <p className="text-sm text-muted-foreground">
                Secure portal access for scheduling and account activity.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="Enter username" {...register("username")} />
              {errors.username ? (
                <p className="text-sm text-red-600">{errors.username.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                {...register("password")}
              />
              {errors.password ? (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              ) : null}
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Access Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
