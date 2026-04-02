'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Icons, AppLogoIcon } from '@/components/icons'
import { getOAuthURL } from '@/lib/auth-client'

export function SignIn() {
  function handleGoogleSignIn() {
    window.location.href = getOAuthURL("google")
  }

  return (
    <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
      <div className="bg-card m-auto h-fit w-full max-w-sm rounded-lg border p-0.5 shadow-md">
        <div className="p-8 pb-6">
          <Link href="/" aria-label="go home">
            <AppLogoIcon className="h-10 fill-current text-black dark:text-white sm:h-12" />
          </Link>
          <h1 className="mb-1 mt-4 text-xl font-semibold">Sign in to Odeta</h1>
          <p className="text-sm text-muted-foreground">Welcome back! Sign in with your Google account to continue.</p>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full mt-6"
            onClick={handleGoogleSignIn}
          >
            <Icons.google className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <div className="rounded-lg border bg-muted p-3">
          <p className="text-center text-sm">
            Don&apos;t have an account?
            <Button asChild variant="link" className="ml-1 px-2">
              <Link href="/auth/sign-up">Create one</Link>
            </Button>
          </p>
        </div>
      </div>
    </section>
  )
}
