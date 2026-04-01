'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AppLogoIcon } from '@/components/icons'
import { Mail } from 'lucide-react'

export function VerifyEmail() {
  return (
    <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
      <div className="bg-card m-auto h-fit w-full max-w-md rounded-lg border p-0.5 shadow-md">
        <div className="p-8 text-center">
          <Link href="/" aria-label="go home">
            <AppLogoIcon className="mx-auto h-10 fill-current text-black dark:text-white sm:h-12" />
          </Link>
          <Mail className="mx-auto mt-6 h-12 w-12 text-primary" />
          <h1 className="mb-2 mt-4 text-xl font-semibold">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a verification link to your email address.
            Click the link to verify your account.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/auth/sign-in">Back to sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
