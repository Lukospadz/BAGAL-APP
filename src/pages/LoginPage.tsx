import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/context/AuthContext'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})
type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { signInWithEmail, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [sent, setSent] = useState(false)
  const [sentTo, setSentTo] = useState('')

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

  async function onSubmit({ email }: FormValues) {
    const { error } = await signInWithEmail(email)
    if (error) {
      setError('email', { message: error })
      return
    }
    setSentTo(email)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-green-dark flex items-center justify-center p-4">
        <div className="bg-cream rounded-xl p-8 max-w-sm w-full text-center shadow-lg">
          <div className="text-4xl mb-4">✉️</div>
          <h2 className="font-serif text-xl text-green-dark mb-2">Check your email</h2>
          <p className="font-sans text-sm text-green-mid">
            We sent a magic link to <strong>{sentTo}</strong>. Click it to sign in.
          </p>
          <Link
            to="/"
            className="mt-6 block font-sans text-xs text-green-mid hover:underline"
          >
            ← Back to leaderboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-green-dark flex items-center justify-center p-4">
      <div className="bg-cream rounded-xl p-8 max-w-sm w-full shadow-lg">
        <div className="text-center mb-6">
          <h2 className="font-serif text-2xl text-green-dark">Sign in to BAGAL</h2>
          <p className="font-sans text-sm text-green-mid mt-1">
            We'll email you a magic link — no password needed.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full mt-4"
          >
            {isSubmitting ? 'Sending…' : 'Send magic link'}
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
