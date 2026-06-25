import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useNavigate } from 'react-router-dom'
import { Loader2, LockKeyhole } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/form'
import { useAuth } from '@/store/AuthContext'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { token, login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (token) return <Navigate to="/" replace />

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    try {
      await login(values.email, values.password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  })

  return (
    <div className="grid min-h-svh place-items-center bg-background p-4 text-foreground">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-md bg-primary text-primary-foreground">
            <LockKeyhole className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Admin Login</h1>
            <p className="text-sm text-muted-foreground">Use a seeded admin account.</p>
          </div>
        </div>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <Field label="Email" error={errors.email?.message}>
            <Input autoComplete="email" type="email" {...register('email')} />
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <Input autoComplete="current-password" type="password" {...register('password')} />
          </Field>
          {error ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Sign in
          </Button>
        </form>
      </div>
    </div>
  )
}
