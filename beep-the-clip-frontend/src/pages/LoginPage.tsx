import { signIn } from "aws-amplify/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FieldGroup } from "@/components/ui/field"
import { FormInput } from "@/components/form-input"

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: LoginValues) {
    try {
      await signIn({
        username: values.email,
        password: values.password,
      })
      // Session tokens are automatically stored in localStorage by Amplify.
      // TODO: navigate to dashboard (future milestone)
    } catch (err) {
      if (err instanceof Error && err.name === "UserNotConfirmedException") {
        navigate("/confirm", { state: { email: values.email } })
        return
      }
      const message = err instanceof Error ? err.message : "Sign in failed."
      form.setError("root", { message })
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Sign in to review your videos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <FormInput
                control={form.control}
                name="email"
                label="Email"
                type="email"
                autoComplete="email"
              />
              <FormInput
                control={form.control}
                name="password"
                label="Password"
                type="password"
                autoComplete="current-password"
              />

              {form.formState.errors.root && (
                <p className="text-sm text-destructive" role="alert">
                  {form.formState.errors.root.message}
                </p>
              )}

              <Button type="submit" disabled={form.formState.isSubmitting}>
                Sign in
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                No account yet?{" "}
                <Link to="/register" className="underline underline-offset-4">
                  Create one
                </Link>
              </p>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
