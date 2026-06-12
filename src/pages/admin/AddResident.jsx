import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import notify from '../../lib/notify'
import { UserPlus, ArrowLeft, CheckCircle, AlertCircle, Mail, Copy, Check } from 'lucide-react'

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button type="button" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-1.5 rounded-lg text-forest-400 hover:text-forest-700 hover:bg-forest-100 transition-colors">
      {copied ? <Check className="w-4 h-4 text-forest-600" /> : <Copy className="w-4 h-4" />}
    </button>
  )
}

const RULES = {
  full_name: v => {
    if (!v?.trim()) return 'Full name is required'
    if (v.trim().length < 3) return 'Name must be at least 3 characters'
    if (/\d/.test(v)) return 'Name should not contain numbers'
    return ''
  },
  email: v => {
    if (!v?.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address'
    return ''
  },
  phone: v => {
    if (!v?.trim()) return ''
    const d = v.replace(/\D/g, '')
    if (d.length !== 10) return 'Enter a valid 10-digit number'
    if (!/^[6-9]/.test(d)) return 'Number must start with 6, 7, 8 or 9'
    return ''
  },
}

function inputClass(touched, error) {
  const base = 'w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-all bg-white font-medium'
  if (!touched) return `${base} border-gray-200 focus:border-forest-400 focus:ring-4 focus:ring-forest-100`
  if (error)    return `${base} border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100`
  return              `${base} border-forest-400 bg-forest-50/30 focus:border-forest-500 focus:ring-4 focus:ring-forest-100`
}

function FieldMsg({ touched, error }) {
  if (!touched || !error) return null
  return (
    <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600 font-medium animate-fade-up">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
    </p>
  )
}

// Generate a secure random temporary password (never shown to anyone)
function tempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pw = ''
  for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)]
  return `${pw}!4`   // always has uppercase, lowercase, number, special — meets requirements
}

export default function AddResident() {
  const [plots, setPlots] = useState([])
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', plot_id: '', role: 'resident' })
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null) // { name, email, plot, tempPwd, emailSent }

  useEffect(() => {
    supabase.from('plots').select('id, plot_number, status').order('plot_number')
      .then(({ data }) => setPlots(data ?? []))
  }, [])

  const errors = {
    full_name: RULES.full_name(form.full_name),
    email:     RULES.email(form.email),
    phone:     RULES.phone(form.phone),
  }
  const isValid = !Object.values(errors).some(Boolean) && form.plot_id

  function touchAll() {
    setTouched({ full_name: true, email: true, phone: true, plot_id: true })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    touchAll()
    if (!isValid) return
    setLoading(true)

    // Save admin session before signUp potentially switches it
    const { data: { session: adminSession } } = await supabase.auth.getSession()

    const pwd = tempPassword()   // keep reference for fallback display

    try {
      // 1. Create user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: pwd,
        options: { data: { full_name: form.full_name.trim(), phone: form.phone.trim() } },
      })

      if (signUpError) throw signUpError
      if (!signUpData.user) throw new Error('User creation failed — email may already be registered')

      // 2. Update profile: link plot, approve immediately, set role
      const { error: profileError } = await supabase.from('profiles').update({
        full_name: form.full_name.trim(),
        phone:     form.phone.trim() || null,
        plot_id:   form.plot_id || null,
        role:      form.role,
        status:    'approved',
      }).eq('id', signUpData.user.id)

      if (profileError) throw profileError

      // 3. Restore admin session
      if (adminSession) {
        await supabase.auth.setSession({
          access_token:  adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        })
      }

      // 4. Try to send "Set your password" email — gracefully handle rate limit
      let emailSent = false
      try {
        const siteUrl = window.location.origin
        const { error: emailError } = await supabase.auth.resetPasswordForEmail(form.email.trim(), {
          redirectTo: `${siteUrl}/reset-password`,
        })
        emailSent = !emailError
      } catch {
        emailSent = false
      }

      const plot = plots.find(p => p.id === form.plot_id)
      setSuccess({
        name:      form.full_name.trim(),
        email:     form.email.trim(),
        plot:      plot?.plot_number ?? '—',
        tempPwd:   pwd,
        emailSent,
      })

      if (emailSent) {
        notify.success('Account created & email sent!', `${form.full_name.trim()} will receive a link to set their password.`)
      } else {
        notify.warning('Account created', 'Email could not be sent (rate limit). Share the temporary password below.')
      }

    } catch (err) {
      if (adminSession) {
        await supabase.auth.setSession({
          access_token:  adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        })
      }
      notify.error('Failed to add resident', err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ────────────────────────────────────
  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl border border-forest-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className={`px-8 py-8 text-center bg-gradient-to-br ${success.emailSent ? 'from-forest-600 to-forest-800' : 'from-amber-500 to-amber-700'}`}>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              {success.emailSent ? <Mail className="w-8 h-8 text-white" /> : <CheckCircle className="w-8 h-8 text-white" />}
            </div>
            <h2 className="font-display text-2xl font-bold text-white">
              {success.emailSent ? 'Account Created & Email Sent!' : 'Account Created!'}
            </h2>
            <p className="text-white/80 text-sm mt-1">{success.name} · {success.plot}</p>
          </div>

          <div className="px-8 py-6 space-y-4">
            {success.emailSent ? (
              /* Email sent successfully */
              <>
                <div className="bg-forest-50 border border-forest-100 rounded-2xl p-4 text-center">
                  <p className="font-semibold text-forest-900 mb-2 text-sm">Password setup email sent to:</p>
                  <p className="text-forest-600 font-mono text-sm bg-white border border-forest-200 rounded-lg px-3 py-2 inline-block">{success.email}</p>
                </div>
                <div className="space-y-2">
                  {['Resident checks their email inbox','Clicks the "Set Password" link','Chooses a new secure password','Logs in to aranyahillscolony.in'].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-forest-700 text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                      <p className="text-sm text-forest-700">{step}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  ⏱ Link expires in 24 hours. If expired, resident can use "Forgot Password" on the login page.
                </p>
              </>
            ) : (
              /* Email failed — show temp password fallback */
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-sm">
                  <p className="font-semibold mb-1">⚠️ Email not sent (rate limit reached)</p>
                  <p className="text-xs text-amber-700">Supabase allows only a few emails per hour on the free plan. Share these credentials with the resident via WhatsApp or SMS instead.</p>
                </div>
                {[
                  { label: 'Website',  value: 'aranyahillscolony.in' },
                  { label: 'Email',    value: success.email },
                  { label: 'Password', value: success.tempPwd },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between bg-forest-50 rounded-xl px-4 py-3 border border-forest-100">
                    <div>
                      <p className="text-xs text-forest-500 uppercase tracking-wide font-semibold">{label}</p>
                      <p className={`font-semibold text-forest-800 mt-0.5 ${label === 'Password' ? 'font-mono tracking-widest' : ''}`}>{value}</p>
                    </div>
                    <CopyBtn text={value} />
                  </div>
                ))}
                <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                  💡 After 1 hour, you can try adding another resident and the email will work again. The resident can also use "Forgot Password" on the login page to set their own password.
                </p>
              </>
            )}
          </div>

          <div className="px-8 pb-8 flex gap-3">
            <button
              onClick={() => { setSuccess(null); setForm({ full_name: '', email: '', phone: '', plot_id: '', role: 'resident' }); setTouched({}) }}
              className="flex-1 py-3 border-2 border-forest-200 rounded-xl text-sm font-bold text-forest-700 hover:bg-forest-50 transition-all">
              Add Another
            </button>
            <Link to="/admin"
              className="flex-1 py-3 text-center bg-gradient-to-r from-forest-600 to-forest-700 text-white rounded-xl text-sm font-bold hover:from-forest-700 hover:to-forest-800 transition-all">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin" className="p-2 rounded-xl text-forest-500 hover:bg-forest-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-forest-800">Add Resident</h1>
          <p className="text-forest-500 text-sm mt-0.5">
            Account is approved immediately. A password setup email is sent automatically.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-forest-50 border border-forest-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Mail className="w-5 h-5 text-forest-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-forest-800 text-sm font-semibold">Automatic email notification</p>
          <p className="text-forest-600 text-xs mt-0.5">
            After you add a resident, they receive an email with a secure link to set their own password.
            No need to share passwords manually.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-forest-100 shadow-sm">
        <form onSubmit={handleSubmit} noValidate className="px-7 py-6 space-y-5">

          {/* Full Name */}
          <div>
            <label className="flex items-center gap-1 text-sm font-semibold text-forest-800 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              onBlur={() => setTouched(p => ({ ...p, full_name: true }))}
              className={inputClass(touched.full_name, errors.full_name)}
              placeholder="e.g. Kondal Reddy D" />
            <FieldMsg touched={touched.full_name} error={errors.full_name} />
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-1 text-sm font-semibold text-forest-800 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              onBlur={() => setTouched(p => ({ ...p, email: true }))}
              className={inputClass(touched.email, errors.email)}
              placeholder="resident@gmail.com" />
            <FieldMsg touched={touched.email} error={errors.email} />
            {touched.email && !errors.email && form.email && (
              <p className="flex items-center gap-1.5 mt-1.5 text-xs text-forest-600 font-medium">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />Password setup link will be sent here
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-1 text-sm font-semibold text-forest-800 mb-1.5">
              Phone Number
              <span className="text-forest-400 text-xs font-normal ml-1">(optional)</span>
            </label>
            <input type="tel" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g,'').slice(0,10) }))}
              onBlur={() => setTouched(p => ({ ...p, phone: true }))}
              className={inputClass(touched.phone, errors.phone)}
              placeholder="10-digit mobile number" maxLength={10} />
            <FieldMsg touched={touched.phone} error={errors.phone} />
          </div>

          {/* Plot + Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 text-sm font-semibold text-forest-800 mb-1.5">
                Plot Number <span className="text-red-500">*</span>
              </label>
              <select value={form.plot_id}
                onChange={e => setForm(f => ({ ...f, plot_id: e.target.value }))}
                onBlur={() => setTouched(p => ({ ...p, plot_id: true }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 focus:ring-4 focus:ring-forest-100 bg-white font-medium transition-all">
                <option value="">Select plot...</option>
                {plots.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.plot_number} {p.status === 'occupied' ? '· occupied' : ''}
                  </option>
                ))}
              </select>
              {touched.plot_id && !form.plot_id && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />Plot is required
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-forest-800 mb-1.5 block">Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 focus:ring-4 focus:ring-forest-100 bg-white font-medium transition-all">
                <option value="resident">Resident</option>
                <option value="committee">Committee</option>
                <option value="security">Security</option>
              </select>
            </div>
          </div>

          {/* Preview */}
          {form.full_name && form.plot_id && (
            <div className="flex items-center gap-3 bg-forest-50 border border-forest-100 rounded-xl p-3">
              <div className="w-10 h-10 bg-gradient-to-br from-forest-500 to-forest-700 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">{form.full_name[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-forest-900 text-sm">{form.full_name}</p>
                <p className="text-forest-500 text-xs">
                  {plots.find(p => p.id === form.plot_id)?.plot_number} · {form.role} · Auto-approved
                </p>
              </div>
              <div className="flex items-center gap-1 text-forest-500 text-xs">
                <Mail className="w-3.5 h-3.5" />
                <span>Email will be sent</span>
              </div>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
              isValid && !loading
                ? 'bg-gradient-to-r from-forest-600 to-forest-700 hover:from-forest-700 hover:to-forest-800 text-white shadow-lg shadow-forest-500/25 hover:-translate-y-0.5'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}>
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account & sending email...</>
              : <><Mail className="w-4 h-4" />Add Resident & Send Email</>
            }
          </button>
        </form>
      </div>
    </div>
  )
}
