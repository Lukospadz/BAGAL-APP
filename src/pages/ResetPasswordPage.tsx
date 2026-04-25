import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }
    try { await refreshProfile() } catch (_) { /* ignore */ }
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-green-dark flex items-center justify-center p-4">
      <div className="bg-cream rounded-xl p-8 max-w-sm w-full shadow-lg">
        <div className="text-center mb-6">
          <h2 className="font-serif text-2xl text-green-dark">Set new password</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">New password</label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Confirm password</label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className="field-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && <p className="font-sans text-xs text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving…' : 'Set password'}
          </button>
        </form>
      </div>
    </div>
  )
}
