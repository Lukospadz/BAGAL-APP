import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/context/AuthContext'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { signInWithPassword, signUp, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [signedUp, setSignedUp] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  if (isAdmin) {
    navigate('/admin', { replace: true })
    return null
  }

  function switchMode(next: 'signin' | 'signup') {
    setMode(next)
    reset()
  }

  async function onSubmit({ email, password }: FormValues) {
    if (mode === 'signup') {
      const { error } = await signUp(email, password)
      if (error) {
        setError('password', { message: error })
        return
      }
      setSignedUp(true)
      return
    }
    const { error } = await signInWithPassword(email, password)
    if (error) {
      setError('password', { message: 'Invalid email or password' })
    }
  }

  if (signedUp) {
    return (
      <div className="min-h-screen bg-green-dark flex items-center justify-center p-4">
        <div className="bg-cream rounded-xl p-8 max-w-sm w-full text-center shadow-lg">
          <div className="text-4xl mb-4">⛳</div>
          <h2 className="font-serif text-xl text-green-dark mb-2">Account created!</h2>
          <p className="font-sans text-sm text-green-mid">
            You're in. Ask the admin to link your account to your player profile, then sign in.
          </p>
          <button
            onClick={() => { setSignedUp(false); setMode('signin') }}
            className="btn-primary w-full mt-6"
          >
            Sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-green-dark flex items-center justify-center p-4">
      <div className="bg-cream rounded-xl p-8 max-w-sm w-full shadow-lg">
        <div className="text-center mb-6">
          <h2 className="font-serif text-2xl text-green-dark">
            {mode === 'signin' ? 'Sign in to BAGAL' : 'Create account'}
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label className="field-label">Email address</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="field-input"
              {...register('email')}
            />
            {errors.email && (
              <p className="font-sans text-xs text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="field-label">Password</label>
            <input
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder="••••••••"
              className="field-input"
              {...register('password')}
            />
            {errors.password && (
              <p className="font-sans text-xs text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full"
          >
            {isSubmitting
              ? mode === 'signin' ? 'Signing in…' : 'Creating account…'
              : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="mt-4 text-center">
          {mode === 'signin' ? (
            <button
              onClick={() => switchMode('signup')}
              className="font-sans text-xs text-green-mid hover:underline"
            >
              New here? Create an account
            </button>
          ) : (
            <button
              onClick={() => switchMode('signin')}
              className="font-sans text-xs text-green-mid hover:underline"
            >
              Already have an account? Sign in
            </button>
          )}
        </div>

        <Link
          to="/"
          className="mt-3 block text-center font-sans text-xs text-green-mid/60 hover:underline"
        >
          ← Back to leaderboard
        </Link>
      </div>
    </div>
  )
}
