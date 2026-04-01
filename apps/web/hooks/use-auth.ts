'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getMe, clearTokens, getAccessToken, type AuthUser } from '@/lib/auth-client'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchUser = useCallback(async () => {
    try {
      const userData = await getMe()
      setUser(userData)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const logout = useCallback(async () => {
    clearTokens()
    setUser(null)
    router.push('/auth/sign-in')
  }, [router])

  const isAuthenticated = !!user && !!getAccessToken()

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
    refetch: fetchUser,
  }
}
