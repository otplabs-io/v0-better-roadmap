import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Check your email
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            We sent you a confirmation link. Please check your email to verify
            your account before signing in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/auth/login"
            className="text-sm text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
