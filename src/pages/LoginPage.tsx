import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/context/AuthContext'
import { usePlayers } from '@/hooks/usePlayers'
import { supabase } from '@/lib/supabase'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { signInWithPassword, signUp, refreshProfile, user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [pickingPlayer, setPickingPlayer] = useState(false)

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
      setPickingPlayer(true)
      return
    }
    const { error } = await signInWithPassword(email, password)
    if (error) {
      setError('password', { message: 'Invalid email or password' })
    }
  }

  if (pickingPlayer) {
    return (
      <PickPlayerScreen
        userId={user?.id}
        onDone={async () => {
          await refreshProfile()
          navigate('/', { replace: true })
        }}
      />
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

function PickPlayerScreen({
  userId,
  onDone,
}: {
  userId: string | undefined
  onDone: () => void
}) {
  const { data: players } = usePlayers()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pick(playerId: string) {
    if (!userId) return
    setSaving(true)
    setError(null)
    const { error } = await supabase
      .from('profiles')
      .update({ player_id: playerId })
      .eq('id', userId)
    if (error) {
      setError('Something went wrong. Try again.')
      setSaving(false)
      return
    }
    onDone()
  }

  return (
    <div className="min-h-screen bg-green-dark flex items-center justify-center p-4">
      <div className="bg-cream rounded-xl p-8 max-w-sm w-full shadow-lg">
        <div className="text-center mb-6">
          <h2 className="font-serif text-2xl text-green-dark mb-1">Who are you?</h2>
          <p className="font-sans text-sm text-green-mid">Pick your player profile</p>
        </div>

        <div className="space-y-2">
          {players?.map((player) => (
            <button
              key={player.id}
              onClick={() => pick(player.id)}
              disabled={saving}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-bone bg-white hover:bg-bone transition-colors disabled:opacity-50"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-sans text-sm font-bold text-white flex-shrink-0"
                style={{ backgroundColor: player.color }}
              >
                {player.initials}
              </div>
              <span className="font-serif text-base text-green-dark">{player.name}</span>
            </button>
          ))}
        </div>

        {error && (
          <p className="font-sans text-xs text-red-600 mt-3 text-center">{error}</p>
        )}
      </div>
    </div>
  )
}
