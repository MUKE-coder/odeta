'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgetPasswordSchema, type ForgetPasswordInput } from '@/lib/auth-schemas'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AppLogoIcon } from '@/components/icons'
import { forgotPassword } from '@/lib/auth-client'
import { toast } from 'sonner'
import { ArrowLeft, Mail } from 'lucide-react'

export function ForgetPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<ForgetPasswordInput>({
    resolver: zodResolver(forgetPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(data: ForgetPasswordInput) {
    setIsLoading(true)
    try {
      await forgotPassword(data.email)
      setIsSubmitted(true)
      toast.success("Password reset email sent!")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
        <div className="bg-card m-auto h-fit w-full max-w-md rounded-lg border p-0.5 shadow-md">
          <div className="p-8 text-center">
            <Mail className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mb-2 mt-4 text-xl font-semibold">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              If an account with that email exists, we&apos;ve sent a password reset link.
            </p>
            <Button asChild variant="link" className="mt-4">
              <Link href="/auth/sign-in">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Link>
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
      <div className="bg-card m-auto h-fit w-full max-w-md rounded-lg border p-0.5 shadow-md">
        <div className="p-8 pb-6">
          <Link href="/" aria-label="go home">
            <AppLogoIcon className="h-10 fill-current text-black dark:text-white sm:h-12" />
          </Link>
          <h1 className="mb-1 mt-4 text-xl font-semibold">Forgot your password?</h1>
          <p className="text-sm text-muted-foreground">Enter your email and we&apos;ll send you a reset link</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="block text-sm">Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
          </Form>
        </div>

        <div className="rounded-lg border bg-muted p-3">
          <p className="text-center text-sm">
            Remember your password?
            <Button asChild variant="link" className="ml-3 px-2">
              <Link href="/auth/sign-in">Sign in</Link>
            </Button>
          </p>
        </div>
      </div>
    </section>
  )
}
