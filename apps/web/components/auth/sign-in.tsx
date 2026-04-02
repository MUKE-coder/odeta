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
    <section className="flex min-h-screen items-center justify-center px-4 py-16 md:py-32">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-white/5 p-0.5 shadow-2xl backdrop-blur-sm">
        <div className="p-8 pb-6">
          <AppLogoIcon className="h-10 fill-current text-white sm:h-12" />
          <h1 className="mb-1 mt-4 text-xl font-semibold text-white">Sign in to Odeta</h1>
          <p className="text-sm text-zinc-400">Welcome back! Sign in with your Google account to continue.</p>

          <Button
            type="button"
            size="lg"
            className="w-full mt-6 bg-white text-black hover:bg-zinc-200 font-medium"
            onClick={handleGoogleSignIn}
          >
            <Icons.google className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>

          <p className="mt-4 text-center text-xs text-zinc-500">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <div className="rounded-b-lg border-t border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-sm text-zinc-400">
            Don&apos;t have an account?
            <Button asChild variant="link" className="ml-1 px-2 text-white">
              <Link href="/auth/sign-up">Create one</Link>
            </Button>
          </p>
        </div>
      </div>
    </section>
  )
}
