import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const confirmSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
})

type ConfirmValues = z.infer<typeof confirmSchema>

export default function ConfirmPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as { email?: string; username?: string } | null)?.email
  const username = (location.state as { email?: string; username?: string } | null)?.username

  const [resendMessage, setResendMessage] = useState<string | null>(null)

  const form = useForm<ConfirmValues>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { code: "" },
  })

  // Opened /confirm directly (no email in state): send the user back.
  if (!email || !username) return <Navigate to="/register" replace />

  async function onSubmit(values: ConfirmValues) {
    try {
      await confirmSignUp({
        username: username!,
        confirmationCode: values.code,
      })
      navigate("/login")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed."
      form.setError("root", { message })
    }
  }

  async function onResend() {
    setResendMessage(null)
    try {
      await resendSignUpCode({ username: username! })
      setResendMessage("A new code has been sent to your email.")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not resend code."
      setResendMessage(message)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent a 6-digit code to {email}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="code"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="code">Verification code</FieldLabel>
                    <Input
                      {...field}
                      id="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {form.formState.errors.root && (
                <p className="text-sm text-destructive" role="alert">
                  {form.formState.errors.root.message}
                </p>
              )}

              {resendMessage && (
                <p className="text-sm text-muted-foreground" role="status">
                  {resendMessage}
                </p>
              )}

              <Button type="submit" disabled={form.formState.isSubmitting}>
                Verify
              </Button>
              <Button type="button" variant="ghost" onClick={onResend}>
                Resend code
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
