"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              We&apos;ve sent you a verification link. Please check your email to complete your registration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium">What&apos;s next?</p>
              <ol className="mt-2 list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Open the email we sent you</li>
                <li>Click the verification link</li>
                <li>You&apos;ll be redirected to your dashboard</li>
              </ol>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              Didn&apos;t receive the email? Check your spam folder or{" "}
              <Link href="/auth/sign-up" className="underline underline-offset-4">
                try signing up again
              </Link>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/login">
                Back to Login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
