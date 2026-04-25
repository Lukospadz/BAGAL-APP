import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/context/AuthContext'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})
type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { signInWithPassword, isAdmin } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  if (isAdmin) {
    navigate('/admin', { replace: true })
    return null
  }

  async function onSubmit({ email, password }: FormValues) {
    const { error } = await signInWithPassword(email, password)
    if (error) {
      setError('password', { message: 'Invalid email or password' })
    }
  }

  return (
    <div className="min-h-screen bg-green-dark flex items-center justify-center p-4">
      <div className="bg-cream rounded-xl p-8 max-w-sm w-full shadow-lg">
        <div className="text-center mb-6">
          <h2 className="font-serif text-2xl text-green-dark">Sign in to BAGAL</h2>
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
              autoComplete="current-password"
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
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <Link
          to="/"
          className="mt-4 block text-center font-sans text-xs text-green-mid hover:underline"
        >
          ← Back to leaderboard
        </Link>
      </div>
    </div>
  )
}
