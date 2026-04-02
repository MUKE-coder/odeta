'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Icons, AppLogoIcon } from '@/components/icons'
import { getOAuthURL } from '@/lib/auth-client'
import { Sparkles } from 'lucide-react'

export function SignUp() {
  function handleGoogleSignUp() {
    window.location.href = getOAuthURL("google")
  }

  return (
    <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
      <div className="bg-card m-auto h-fit w-full max-w-sm rounded-lg border p-0.5 shadow-md">
        <div className="p-8 pb-6">
          <Link href="/" aria-label="go home">
            <AppLogoIcon className="h-10 fill-current text-black dark:text-white sm:h-12" />
          </Link>
          <h1 className="mb-1 mt-4 text-xl font-semibold">Create your Odeta account</h1>
          <p className="text-sm text-muted-foreground">Start building apps in minutes — 100 free credits included.</p>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full mt-6"
            onClick={handleGoogleSignUp}
          >
            <Icons.google className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>

          <div className="mt-4 flex items-center gap-2 justify-center text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>100 free credits on sign up</span>
          </div>
        </div>

        <div className="rounded-lg border bg-muted p-3">
          <p className="text-center text-sm">
            Already have an account?
            <Button asChild variant="link" className="ml-1 px-2">
              <Link href="/auth/sign-in">Sign in</Link>
            </Button>
          </p>
        </div>
      </div>
    </section>
  )
}
