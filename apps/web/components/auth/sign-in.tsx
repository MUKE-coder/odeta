'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInSchema, type SignInInput } from '@/lib/auth-schemas'
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
import { Icons, AppLogoIcon } from '@/components/icons'
import { signIn, getOAuthURL } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

export function SignIn() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: SignInInput) {
    setIsLoading(true)
    try {
      await signIn(data.email, data.password)
      toast.success("Signed in successfully!")
      router.push("/dashboard")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed"
      form.setError('root', { message })
      toast.error(message)
      setIsLoading(false)
    }
  }

  function handleSocialSignIn(provider: "google" | "github") {
    window.location.href = getOAuthURL(provider)
  }

  return (
    <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
      <div className="bg-card m-auto h-fit w-full max-w-md rounded-lg border p-0.5 shadow-md">
        <div className="p-8 pb-6">
          <Link href="/" aria-label="go home">
            <AppLogoIcon className="h-10 fill-current text-black dark:text-white sm:h-12" />
          </Link>
          <h1 className="mb-1 mt-4 text-xl font-semibold">Sign in to Odeta</h1>
          <p className="text-sm text-muted-foreground">Welcome back! Sign in to continue</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" disabled={isLoading} onClick={() => handleSocialSignIn("google")}>
              <Icons.google className="h-4 w-4" />
              <span>Google</span>
            </Button>
            <Button type="button" variant="outline" disabled={isLoading} onClick={() => handleSocialSignIn("github")}>
              <Icons.gitHub className="h-4 w-4" />
              <span>Github</span>
            </Button>
          </div>

          <hr className="my-4 border-dashed" />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm">Password</FormLabel>
                      <Button asChild variant="link" size="sm">
                        <Link href="/auth/forgot-password" className="text-sm">
                          Forgot your Password?
                        </Link>
                      </Button>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="pr-10"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </Form>
        </div>

        <div className="rounded-lg border bg-muted p-3">
          <p className="text-center text-sm">
            Don&apos;t have an account?
            <Button asChild variant="link" className="ml-3 px-2">
              <Link href="/auth/sign-up">Create account</Link>
            </Button>
          </p>
        </div>
      </div>
    </section>
  )
}
