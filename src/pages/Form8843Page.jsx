import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fillForm8843 } from '../utils/form8843Fields'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'f1_form8843_v2'

const STEP_META = [
  { label: 'Your Information', sub: 'Personal details & US address', section: 'Part I' },
  { label: 'Your School',      sub: 'Academic institution',          section: 'Part III, Line 9' },
  { label: 'Your DSO',         sub: 'Designated School Official',    section: 'Part III, Line 10' },
  { label: 'Visa & Dates',     sub: 'Visa type and entry dates',     section: 'Part I' },
]

const LABELS = {
  firstName:            'First Name',
  middleInitial:        'Middle Initial',
  lastName:             'Last Name',
  usStreet:             'US Street Address',
  usCity:               'City',
  usState:              'State',
  usZip:                'ZIP Code',
  countryOfCitizenship: 'Country of Citizenship',
  taxYear:              'Tax Year',
  schoolName:           'School / University Name',
  schoolStreet:         'School Street Address',
  schoolCity:           'School City',
  schoolState:          'School State',
  schoolZip:            'School ZIP Code',
  schoolPhone:          'School Phone Number',
  dsoName:              'DSO Full Name',
  dsoStreet:            'DSO Office Address',
  dsoCity:              'DSO Office City',
  dsoState:             'DSO Office State',
  dsoZip:               'DSO Office ZIP',
  dsoPhone:             'DSO Phone Number',
  firstEntryDate:       'Date of First U.S. Entry',
  currentEntryDate:     'Date of Most Recent U.S. Entry',
}

const REQUIRED_BY_STEP = {
  0: ['firstName', 'lastName', 'usStreet', 'usCity', 'usState', 'usZip', 'countryOfCitizenship'],
  1: ['schoolName', 'schoolStreet', 'schoolCity', 'schoolState', 'schoolZip', 'schoolPhone'],
  2: ['dsoName', 'dsoPhone'],
  3: ['firstEntryDate', 'currentEntryDate'],
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial data
// ─────────────────────────────────────────────────────────────────────────────

function blankData() {
  return {
    firstName: '', middleInitial: '', lastName: '',
    usStreet: '', usCity: '', usState: '', usZip: '',
    countryOfCitizenship: '', taxYear: '2025', visaType: 'F-1',
    firstEntryDate: '', currentEntryDate: '',
    schoolName: '', schoolStreet: '', schoolCity: '', schoolState: '', schoolZip: '', schoolPhone: '',
    dsoName: '', dsoStreet: '', dsoCity: '', dsoState: '', dsoZip: '', dsoPhone: '',
  }
}

function getInitialData() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try { return { ...blankData(), ...JSON.parse(saved) } } catch {}
  }
  const storedName = localStorage.getItem('f1_user_name') || ''
  const parts = storedName.trim().split(' ')
  return {
    ...blankData(),
    firstName: parts.slice(0, -1).join(' ') || storedName,
    lastName: parts.length > 1 ? parts[parts.length - 1] : '',
  }
}

function hasSavedProgress() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return false
  try {
    const p = JSON.parse(saved)
    return !!(p.firstName?.trim() || p.lastName?.trim() || p.schoolName?.trim())
  } catch { return false }
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────────────────────────────────────

function formatPhone(raw) {
  const d = raw.replace(/\D/g, '').slice(0, 10)
  if (!d.length) return ''
  if (d.length <= 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

function formatDate(raw) {
  const d = raw.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components (at module scope to prevent remounting on re-render)
// ─────────────────────────────────────────────────────────────────────────────

const inputBase =
  'w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none transition-colors'

function Field({ name, placeholder, type = 'text', readOnly = false, value, onChange, error, required, helper, maxLength }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-400">
        {LABELS[name]}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        maxLength={maxLength}
        className={`${inputBase} ${readOnly ? 'cursor-not-allowed opacity-50' : ''} ${
          error ? 'border-red-500/60 focus:border-red-500/60' : ''
        }`}
      />
      {error  && <p className="mt-1 text-xs text-red-400">{error}</p>}
      {!error && helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
    </div>
  )
}

function InfoBanner({ children }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3">
      <span className="shrink-0">ℹ️</span>
      <p className="text-xs leading-5 text-blue-300">{children}</p>
    </div>
  )
}

function SummaryCard({ title, icon, rows, onEdit }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <h4 className="text-sm font-semibold text-white">{title}</h4>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10"
        >
          Edit
        </button>
      </div>
      <dl className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="mt-0.5 break-words text-xs font-medium text-slate-200">{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Success screen (shown after PDF downloads)
// ─────────────────────────────────────────────────────────────────────────────

function SuccessScreen({ taxYear, onReset, onDownloadAgain }) {
  const [copied, setCopied] = useState(false)
  const irsAddress = `Department of the Treasury\nInternal Revenue Service Center\nAustin, TX 73301-0215`

  function copyAddress() {
    navigator.clipboard.writeText(irsAddress).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="step-enter mx-auto max-w-2xl space-y-6 py-8">
      {/* Checkmark */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-green-500/30 bg-green-500/10">
          <svg className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Your Form 8843 is ready!
        </h1>
        <p className="text-sm text-slate-400">
          Your completed Form 8843 for tax year {taxYear || '2025'} has been downloaded to your device.
        </p>
      </div>

      {/* What's next */}
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">What's next?</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Card 1 */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-2 text-2xl">✍️</div>
          <h3 className="text-sm font-semibold text-white">Sign & Date Your Form</h3>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">
            Sign the bottom of page 1 before filing. The IRS will reject unsigned forms.
          </p>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-2 text-2xl">📬</div>
          <h3 className="mb-2 text-sm font-semibold text-white">Mail to the IRS</h3>
          <p className="mb-2 text-xs text-slate-400">If filing separately (no income), mail to:</p>
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-[11px] leading-5 text-slate-300 whitespace-pre">
            {irsAddress}
          </div>
          <button
            type="button"
            onClick={copyAddress}
            className="mt-2 w-full rounded-lg border border-white/20 bg-white/5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10"
          >
            {copied ? '✓ Copied!' : 'Copy Address'}
          </button>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-2 text-2xl">📅</div>
          <h3 className="text-sm font-semibold text-white">Filing Deadline</h3>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">
            Form 8843 is due by{' '}
            <span className="font-semibold text-slate-200">June 15, 2026</span>{' '}
            (or April 15 if you have US income).
          </p>
        </div>
      </div>

      {/* Privacy note */}
      <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs leading-5 text-slate-500">
        🔒 Your data was not stored on our servers. It existed only in your browser session.
      </p>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onDownloadAgain}
          className="rounded-xl border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10"
        >
          Download Again
        </button>
        <Link
          to="/"
          className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-6 py-2.5 text-center text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        >
          Go to Home
        </Link>
      </div>

      <button type="button" onClick={onReset} className="block w-full text-center text-xs text-slate-600 underline hover:text-slate-400">
        Fill out another form
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function Form8843Page() {
  const [step, setStep]                           = useState(0)
  const [showReview, setShowReview]               = useState(false)
  const [formData, setFormData]                   = useState(getInitialData)
  const [showRestoreBanner, setShowRestoreBanner] = useState(hasSavedProgress)
  const [errors, setErrors]                       = useState({})
  const [generating, setGenerating]               = useState(false)
  const [success, setSuccess]                     = useState(false)
  const [genError, setGenError]                   = useState('')
  const [lastFilledBytes, setLastFilledBytes]     = useState(null)

  // Auto-save on every field change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
  }, [formData])

  // ── Field setters — clear error on change ─────────────────────────────────

  const set = (f) => (e) => {
    setFormData((p) => ({ ...p, [f]: e.target.value }))
    if (errors[f]) setErrors((p) => ({ ...p, [f]: undefined }))
  }

  const setUpper = (f) => (e) => {
    const v = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2)
    setFormData((p) => ({ ...p, [f]: v }))
    if (errors[f]) setErrors((p) => ({ ...p, [f]: undefined }))
  }

  const setZip = (f) => (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 5)
    setFormData((p) => ({ ...p, [f]: v }))
    if (errors[f]) setErrors((p) => ({ ...p, [f]: undefined }))
  }

  const setPhone = (f) => (e) => {
    const v = formatPhone(e.target.value)
    setFormData((p) => ({ ...p, [f]: v }))
    if (errors[f]) setErrors((p) => ({ ...p, [f]: undefined }))
  }

  const setDate = (f) => (e) => {
    const v = formatDate(e.target.value)
    setFormData((p) => ({ ...p, [f]: v }))
    if (errors[f]) setErrors((p) => ({ ...p, [f]: undefined }))
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  function validate(stepIndex) {
    const next = {}
    const letters = /^[a-zA-Z\s'-]+$/

    if (stepIndex === 0) {
      if (!formData.firstName.trim())              next.firstName = 'Required'
      else if (formData.firstName.length > 20)     next.firstName = 'Max 20 characters'
      else if (!letters.test(formData.firstName))  next.firstName = 'Letters only (hyphens and apostrophes allowed)'

      if (formData.middleInitial && !/^[a-zA-Z]$/.test(formData.middleInitial))
        next.middleInitial = 'Single letter only'

      if (!formData.lastName.trim())               next.lastName = 'Required'
      else if (formData.lastName.length > 25)      next.lastName = 'Max 25 characters'
      else if (!letters.test(formData.lastName))   next.lastName = 'Letters only (hyphens and apostrophes allowed)'

      if (!formData.usStreet.trim())               next.usStreet = 'Required'
      else if (formData.usStreet.length > 35)      next.usStreet = 'Max 35 characters'

      if (!formData.usCity.trim())                 next.usCity = 'Required'
      else if (formData.usCity.length > 22)        next.usCity = 'Max 22 characters'

      if (!formData.usState)                       next.usState = 'Required'
      else if (!/^[A-Z]{2}$/.test(formData.usState)) next.usState = 'Enter 2-letter state code (e.g. CA)'

      if (!formData.usZip)                         next.usZip = 'Required'
      else if (!/^\d{5}$/.test(formData.usZip))   next.usZip = 'Must be exactly 5 digits'

      if (!formData.countryOfCitizenship.trim())   next.countryOfCitizenship = 'Required'
      else if (!letters.test(formData.countryOfCitizenship)) next.countryOfCitizenship = 'Letters only'
    }

    if (stepIndex === 1) {
      if (!formData.schoolName.trim())             next.schoolName = 'Required'
      else if (formData.schoolName.length > 60)    next.schoolName = 'Max 60 characters'

      if (!formData.schoolStreet.trim())           next.schoolStreet = 'Required'
      else if (formData.schoolStreet.length > 35)  next.schoolStreet = 'Max 35 characters'

      if (!formData.schoolCity.trim())             next.schoolCity = 'Required'
      else if (formData.schoolCity.length > 22)    next.schoolCity = 'Max 22 characters'

      if (!formData.schoolState)                   next.schoolState = 'Required'
      else if (!/^[A-Z]{2}$/.test(formData.schoolState)) next.schoolState = '2-letter state code (e.g. CA)'

      if (!formData.schoolZip)                     next.schoolZip = 'Required'
      else if (!/^\d{5}$/.test(formData.schoolZip)) next.schoolZip = 'Must be exactly 5 digits'

      if (!formData.schoolPhone.trim())            next.schoolPhone = 'Required'
      else if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(formData.schoolPhone))
        next.schoolPhone = 'Enter full 10-digit number, e.g. (310) 825-4321'
    }

    if (stepIndex === 2) {
      if (!formData.dsoName.trim())                next.dsoName = 'Required'
      else if (formData.dsoName.length > 50)       next.dsoName = 'Max 50 characters'

      if (!formData.dsoPhone.trim())               next.dsoPhone = 'Required'
      else if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(formData.dsoPhone))
        next.dsoPhone = 'Enter full 10-digit number, e.g. (310) 825-0000'
    }

    if (stepIndex === 3) {
      const today   = new Date(); today.setHours(0, 0, 0, 0)
      const minDate = new Date(2019, 0, 1)
      const parse   = (str) => {
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return null
        const [m, d, y] = str.split('/').map(Number)
        const dt = new Date(y, m - 1, d)
        return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d ? dt : null
      }

      const firstDate = parse(formData.firstEntryDate)
      if (!formData.firstEntryDate.trim())         next.firstEntryDate = 'Required'
      else if (!firstDate)                         next.firstEntryDate = 'Enter a valid date as MM/DD/YYYY'
      else if (firstDate < minDate)                next.firstEntryDate = 'Date must be 01/01/2019 or later'
      else if (firstDate > today)                  next.firstEntryDate = 'Date cannot be in the future'

      const curDate = parse(formData.currentEntryDate)
      if (!formData.currentEntryDate.trim())       next.currentEntryDate = 'Required'
      else if (!curDate)                           next.currentEntryDate = 'Enter a valid date as MM/DD/YYYY'
      else if (curDate > today)                    next.currentEntryDate = 'Date cannot be in the future'
      else if (firstDate && !next.firstEntryDate && curDate < firstDate)
        next.currentEntryDate = 'Must be on or after your first U.S. entry date'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  function handleNext() {
    if (!validate(step)) return
    if (step === 3) { setShowReview(true) }
    else            { setStep((s) => s + 1); setErrors({}) }
  }

  function handleBack() {
    setErrors({})
    if (showReview) { setShowReview(false) }
    else            { setStep((s) => s - 1) }
  }

  function goToStep(n) {
    setErrors({})
    setShowReview(false)
    setStep(n)
  }

  // ── Generate ───────────────────────────────────────────────────────────────

  async function generatePDF() {
    const res = await fetch('/form8843.pdf')
    if (!res.ok) throw new Error('Could not load base PDF.')
    const pdfBytes = await res.arrayBuffer()
    const filled   = await fillForm8843(pdfBytes, formData)
    setLastFilledBytes(filled)
    return filled
  }

  function triggerDownload(bytes) {
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `Form_8843_${formData.taxYear || '2025'}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleGenerate() {
    setGenerating(true)
    setGenError('')
    try {
      const filled = await generatePDF()
      triggerDownload(filled)
      setSuccess(true)
      localStorage.removeItem(STORAGE_KEY)
    } catch (err) {
      setGenError(err.message || 'Failed to generate PDF. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  function handleDownloadAgain() {
    if (lastFilledBytes) {
      triggerDownload(lastFilledBytes)
    } else {
      generatePDF().then(triggerDownload).catch(() => {})
    }
  }

  function handleReset() {
    const storedName = localStorage.getItem('f1_user_name') || ''
    const parts = storedName.trim().split(' ')
    setFormData({
      ...blankData(),
      firstName: parts.slice(0, -1).join(' ') || storedName,
      lastName: parts.length > 1 ? parts[parts.length - 1] : '',
    })
    setStep(0)
    setShowReview(false)
    setSuccess(false)
    setErrors({})
    setGenError('')
    setLastFilledBytes(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  // fp() builds the 4 common props for a named field
  const fp = (name) => ({
    value:    formData[name] ?? '',
    onChange: set(name),
    error:    errors[name],
    required: REQUIRED_BY_STEP[step]?.includes(name) ?? false,
  })

  // ── Render ─────────────────────────────────────────────────────────────────

  const progressPct = showReview ? 100 : ((step + 1) / 4) * 100

  // Full-page success screen
  if (success) {
    return (
      <div className="relative min-h-screen bg-[#0f172a] text-slate-100">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-32 top-20  h-96 w-96 rounded-full bg-blue-600/15   blur-3xl" />
          <div className="absolute -right-24 top-40 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />
        </div>
        <div className="relative z-10 px-4 sm:px-8">
          <SuccessScreen
            taxYear={formData.taxYear}
            onReset={handleReset}
            onDownloadAgain={handleDownloadAgain}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#0f172a] text-slate-100">
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(14px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .step-enter { animation: slideIn 0.22s ease-out; }
      `}</style>

      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20  h-96 w-96 rounded-full bg-blue-600/15   blur-3xl" />
        <div className="absolute -right-24 top-40 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-cyan-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen">

        {/* ── LEFT SIDEBAR (desktop only) ───────────────────────────────── */}
        <aside className="hidden lg:flex w-72 flex-shrink-0 flex-col border-r border-white/10 bg-white/[0.02] px-6 py-8">
          {/* Logo */}
          <Link to="/" className="mb-10 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-blue-500/30">
              F1
            </div>
            <span className="text-base font-semibold text-slate-100">F1 Tax Helper</span>
          </Link>

          {/* Form title */}
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Form 8843 — Tax Year 2025
          </p>

          {/* Step indicators */}
          <div className="space-y-1">
            {STEP_META.map((meta, i) => {
              const isDone    = showReview || i < step
              const isCurrent = !showReview && i === step
              return (
                <div
                  key={meta.label}
                  className={`flex items-start gap-3 rounded-xl p-3 transition-colors ${
                    isCurrent ? 'bg-white/10' : isDone ? 'opacity-75' : 'opacity-35'
                  }`}
                >
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    isDone    ? 'bg-green-500/20 text-green-400'
                    : isCurrent ? 'bg-gradient-to-br from-blue-500 to-violet-500 text-white'
                    : 'bg-white/10 text-slate-500'
                  }`}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${isCurrent ? 'text-white' : 'text-slate-400'}`}>
                      {meta.label}
                    </p>
                    <p className="text-[11px] text-slate-600">{meta.section}</p>
                  </div>
                </div>
              )
            })}

            {/* Review step */}
            <div className={`flex items-start gap-3 rounded-xl p-3 transition-colors ${showReview ? 'bg-white/10' : 'opacity-35'}`}>
              <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                showReview ? 'bg-gradient-to-br from-blue-500 to-violet-500 text-white' : 'bg-white/10 text-slate-500'
              }`}>
                ★
              </div>
              <div>
                <p className={`text-xs font-semibold ${showReview ? 'text-white' : 'text-slate-400'}`}>
                  Review & Generate
                </p>
                <p className="text-[11px] text-slate-600">Final check</p>
              </div>
            </div>
          </div>

          {/* IRS notice */}
          <div className="mt-auto rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
            <p className="text-[11px] leading-5 text-yellow-400/80">
              Form 8843 is an informational statement — not a tax return. F-1 students with no US income must still file it by the tax deadline.
            </p>
          </div>
        </aside>

        {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Topbar */}
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-xl">
            <div className="flex h-14 items-center justify-between px-4 sm:px-8">
              <Link to="/" className="flex items-center gap-2 lg:hidden">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-bold text-white">
                  F1
                </div>
                <span className="text-sm font-semibold">F1 Tax Helper</span>
              </Link>
              <Link to="/" className="hidden text-sm text-slate-400 transition-colors hover:text-slate-200 lg:block">
                ← Back to Home
              </Link>
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-slate-600 sm:block">Tax Year 2025 · Form 8843</span>
                <button
                  type="button"
                  onClick={() => localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))}
                  className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10"
                >
                  Save Progress
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 w-full bg-white/5">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </header>

          {/* Data safety badge */}
          <div className="border-b border-green-500/10 bg-green-500/5 px-4 py-2 sm:px-8">
            <div className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 shrink-0 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm-3.75 8.25v-3a3.75 3.75 0 117.5 0v3h-7.5z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-green-400">
                Your data never leaves your browser. We don't store any information you enter here.
              </p>
            </div>
          </div>

          {/* Restore banner */}
          {showRestoreBanner && (
            <div className="border-b border-blue-500/20 bg-blue-500/10 px-4 py-2.5 sm:px-8">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-blue-300">📋 Saved progress found. Continue where you left off?</p>
                <div className="flex shrink-0 items-center gap-3">
                  <button onClick={() => setShowRestoreBanner(false)} className="text-xs font-semibold text-blue-300 underline">
                    Yes, restore
                  </button>
                  <span className="text-xs text-slate-700">·</span>
                  <button
                    onClick={() => { setShowRestoreBanner(false); handleReset() }}
                    className="text-xs text-slate-500 underline"
                  >
                    Start fresh
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Scroll area */}
          <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 lg:px-10">
            <div className="max-w-2xl">

              {/* Page title */}
              <div className="mb-6">
                <div className="mb-2 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-widest text-blue-100/80">
                  Free · No Login Required
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  {showReview ? 'Review & Generate' : STEP_META[step].label}
                </h1>
                {!showReview && (
                  <p className="mt-1 text-sm text-slate-500">
                    {STEP_META[step].section} · {STEP_META[step].sub}
                  </p>
                )}
              </div>

              {/* Mobile step bar — hidden on lg (sidebar handles it there) */}
              <div className="mb-6 lg:hidden">
                <div className="flex gap-1">
                  {STEP_META.map((m, i) => (
                    <div
                      key={m.label}
                      className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors ${
                        (!showReview && i === step) ? 'bg-white/10 text-blue-300'
                        : (showReview || i < step)  ? 'text-green-400'
                        : 'text-slate-700'
                      }`}
                    >
                      <span className="text-xs">
                        {showReview || i < step ? '✓' : i + 1}
                      </span>
                      <span className="hidden sm:block">{m.label.split(' ')[0]}</span>
                    </div>
                  ))}
                  <div className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium ${showReview ? 'bg-white/10 text-blue-300' : 'text-slate-700'}`}>
                    <span className="text-xs">★</span>
                    <span className="hidden sm:block">Review</span>
                  </div>
                </div>
              </div>

              {/* ── STEP 0: Your Information ───────────────────────────── */}
              {step === 0 && !showReview && (
                <div key="step0" className="step-enter space-y-5">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <h2 className="mb-4 text-sm font-semibold text-white">
                      Personal Details
                      <span className="ml-2 text-xs font-normal text-slate-500">as shown on your passport</span>
                    </h2>
                    <div className="space-y-4">
                      <div className="grid grid-cols-[1fr_80px] gap-3">
                        <Field
                          name="firstName" placeholder="e.g. Kiran" maxLength={20}
                          helper="As shown on your passport"
                          {...fp('firstName')}
                        />
                        <Field
                          name="middleInitial" placeholder="K" maxLength={1}
                          value={formData.middleInitial}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase()
                            setFormData((p) => ({ ...p, middleInitial: v }))
                            if (errors.middleInitial) setErrors((p) => ({ ...p, middleInitial: undefined }))
                          }}
                          error={errors.middleInitial}
                          required={false}
                        />
                      </div>
                      <Field
                        name="lastName" placeholder="e.g. Shahi" maxLength={25}
                        helper="As shown on your passport"
                        {...fp('lastName')}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <h2 className="mb-4 text-sm font-semibold text-white">US Mailing Address</h2>
                    <div className="space-y-4">
                      <Field
                        name="usStreet" placeholder="e.g. 123 Main St, Apt 4B" maxLength={35}
                        helper="Your current US address"
                        {...fp('usStreet')}
                      />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <Field name="usCity" placeholder="e.g. Los Angeles" maxLength={22} {...fp('usCity')} />
                        <Field
                          name="usState" placeholder="CA" maxLength={2}
                          {...fp('usState')} onChange={setUpper('usState')}
                          helper="2-letter code"
                        />
                        <Field
                          name="usZip" placeholder="90024" maxLength={5}
                          {...fp('usZip')} onChange={setZip('usZip')}
                          helper="5-digit ZIP"
                        />
                      </div>
                      <Field
                        name="countryOfCitizenship" placeholder="e.g. India"
                        helper="Country that issued your passport"
                        {...fp('countryOfCitizenship')}
                      />
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-400">Tax Year</label>
                        <div className="inline-flex h-11 items-center rounded-xl border border-blue-500/30 bg-blue-500/10 px-4">
                          <span className="text-sm font-bold text-blue-300">2025</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 1: Your School ────────────────────────────────── */}
              {step === 1 && !showReview && (
                <div key="step1" className="step-enter space-y-5">
                  <InfoBanner>
                    F-1 students complete Part III of Form 8843. Enter your school's official information exactly as it appears on your I-20.
                  </InfoBanner>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <h2 className="mb-4 text-sm font-semibold text-white">Academic Institution Information</h2>
                    <div className="space-y-4">
                      <Field
                        name="schoolName" placeholder="e.g. University of California, Los Angeles"
                        maxLength={60} helper="Full official name of your institution"
                        {...fp('schoolName')}
                      />
                      <Field
                        name="schoolStreet" placeholder="e.g. 405 Hilgard Ave" maxLength={35}
                        {...fp('schoolStreet')}
                      />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <Field name="schoolCity" placeholder="e.g. Los Angeles" maxLength={22} {...fp('schoolCity')} />
                        <Field
                          name="schoolState" placeholder="CA" maxLength={2}
                          {...fp('schoolState')} onChange={setUpper('schoolState')}
                          helper="2-letter code"
                        />
                        <Field
                          name="schoolZip" placeholder="90024" maxLength={5}
                          {...fp('schoolZip')} onChange={setZip('schoolZip')}
                          helper="5-digit ZIP"
                        />
                      </div>
                      <Field
                        name="schoolPhone" placeholder="(310) 825-4321" type="tel"
                        helper="Main campus or international office number"
                        {...fp('schoolPhone')} onChange={setPhone('schoolPhone')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Your DSO ───────────────────────────────────── */}
              {step === 2 && !showReview && (
                <div key="step2" className="step-enter space-y-5">
                  <InfoBanner>
                    Your DSO (Designated School Official) is listed on your I-20 document. Enter their contact information as it appears there.
                  </InfoBanner>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <h2 className="mb-4 text-sm font-semibold text-white">Designated School Official (DSO)</h2>
                    <div className="space-y-4">
                      <Field
                        name="dsoName" placeholder="e.g. Jane Smith" maxLength={50}
                        helper="Name of your international student advisor"
                        {...fp('dsoName')}
                      />
                      <Field
                        name="dsoPhone" placeholder="(310) 825-0000" type="tel"
                        helper="Found on your I-20 or school website"
                        {...fp('dsoPhone')} onChange={setPhone('dsoPhone')}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <h2 className="mb-1 text-sm font-semibold text-white">DSO Office Address</h2>
                    <p className="mb-4 text-xs text-slate-500">Optional — enter if available on your I-20</p>
                    <div className="space-y-4">
                      <Field
                        name="dsoStreet" placeholder="e.g. 405 Hilgard Ave, Suite 200" maxLength={35}
                        value={formData.dsoStreet} onChange={set('dsoStreet')}
                        error={errors.dsoStreet} required={false}
                      />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <Field
                          name="dsoCity" placeholder="e.g. Los Angeles" maxLength={22}
                          value={formData.dsoCity} onChange={set('dsoCity')}
                          error={errors.dsoCity} required={false}
                        />
                        <Field
                          name="dsoState" placeholder="CA" maxLength={2}
                          value={formData.dsoState} onChange={setUpper('dsoState')}
                          error={errors.dsoState} required={false}
                          helper="2-letter code"
                        />
                        <Field
                          name="dsoZip" placeholder="90024" maxLength={5}
                          value={formData.dsoZip} onChange={setZip('dsoZip')}
                          error={errors.dsoZip} required={false}
                          helper="5-digit ZIP"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Visa & Dates ───────────────────────────────── */}
              {step === 3 && !showReview && (
                <div key="step3" className="step-enter space-y-5">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <h2 className="mb-4 text-sm font-semibold text-white">Visa Information</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-400">Visa Type</label>
                        <div className="flex h-11 items-center rounded-xl border border-violet-500/30 bg-violet-500/10 px-4">
                          <span className="text-sm font-semibold text-violet-300">F-1 Student Visa</span>
                        </div>
                      </div>
                      <Field
                        name="firstEntryDate" placeholder="MM/DD/YYYY"
                        helper="Found on your I-94 at cbp.dhs.gov — your very first entry to the US ever"
                        {...fp('firstEntryDate')} onChange={setDate('firstEntryDate')}
                      />
                      <Field
                        name="currentEntryDate" placeholder="MM/DD/YYYY"
                        helper="Your most recent entry to the US"
                        {...fp('currentEntryDate')} onChange={setDate('currentEntryDate')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── REVIEW SCREEN ──────────────────────────────────────── */}
              {showReview && (
                <div key="review" className="step-enter space-y-4">
                  <p className="text-sm text-slate-400">
                    Check your details below. Click <strong className="text-slate-300">Edit</strong> on any card to make changes.
                  </p>

                  <SummaryCard
                    title="Personal Information" icon="👤"
                    onEdit={() => goToStep(0)}
                    rows={[
                      ['Full Name', `${formData.firstName}${formData.middleInitial ? ' ' + formData.middleInitial + '.' : ''} ${formData.lastName}`.trim()],
                      ['US Address', [formData.usStreet, formData.usCity, `${formData.usState} ${formData.usZip}`].filter(Boolean).join(', ')],
                      ['Country of Citizenship', formData.countryOfCitizenship],
                      ['Tax Year', formData.taxYear || '2025'],
                    ]}
                  />

                  <SummaryCard
                    title="School Information" icon="🏫"
                    onEdit={() => goToStep(1)}
                    rows={[
                      ['School Name', formData.schoolName],
                      ['School Address', [formData.schoolStreet, formData.schoolCity, `${formData.schoolState} ${formData.schoolZip}`].filter(Boolean).join(', ')],
                      ['School Phone', formData.schoolPhone],
                    ]}
                  />

                  <SummaryCard
                    title="DSO & Visa" icon="📋"
                    onEdit={() => goToStep(2)}
                    rows={[
                      ['DSO Name', formData.dsoName],
                      ['DSO Phone', formData.dsoPhone],
                      ['Visa Type', 'F-1 Student Visa'],
                      ['First U.S. Entry', formData.firstEntryDate],
                      ['Most Recent Entry', formData.currentEntryDate],
                    ]}
                  />

                  {/* Generate area */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={generating}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {generating ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Generating your Form 8843…
                        </>
                      ) : 'Generate & Download Form 8843 →'}
                    </button>

                    {genError && <p className="mt-2 text-center text-xs text-red-400">{genError}</p>}

                    <div className="mt-3 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3">
                      <p className="text-xs leading-5 text-yellow-400">
                        ⚠️ Review all information carefully. Errors on Form 8843 can affect your immigration status.
                      </p>
                    </div>
                    <p className="mt-2 text-center text-xs text-slate-600">
                      Your form will be downloaded as a PDF. Sign and date it before filing.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="mt-8 flex items-center justify-between">
                {step > 0 || showReview ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10"
                  >
                    ← Back
                  </button>
                ) : <div />}

                {!showReview && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    {step === 3 ? 'Review →' : 'Next →'}
                  </button>
                )}
              </div>

            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
