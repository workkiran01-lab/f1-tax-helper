import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fillForm8843 } from '../utils/form8843Fields'

const STEPS = ['Personal Information', 'School Information', 'Visa Information']

const REQUIRED_BY_STEP = {
  0: ['firstName', 'lastName', 'address', 'city', 'state', 'zip', 'country'],
  1: ['schoolName', 'schoolAddress', 'schoolCity', 'schoolState', 'schoolZip', 'schoolPhone', 'dsoName', 'dsoPhone'],
  2: ['usEntryDate', 'currentEntryDate'],
}

const LABELS = {
  firstName: 'First Name',
  middleInitial: 'Middle Initial',
  lastName: 'Last Name',
  address: 'Street Address',
  city: 'City',
  state: 'State',
  zip: 'ZIP Code',
  country: 'Country of Citizenship',
  taxYear: 'Tax Year',
  schoolName: 'School / University Name',
  schoolAddress: 'School Street Address',
  schoolCity: 'School City',
  schoolState: 'School State',
  schoolZip: 'School ZIP Code',
  schoolPhone: 'School Phone Number',
  dsoName: 'DSO Name',
  dsoAddress: 'DSO Street Address',
  dsoPhone: 'DSO Phone Number',
  usEntryDate: 'First U.S. Entry Date',
  currentEntryDate: 'Current Entry Date',
}

const storedName = localStorage.getItem('f1_user_name') || ''

function getInitialData() {
  const nameParts = storedName.trim().split(' ')
  return {
    firstName: nameParts.slice(0, -1).join(' ') || storedName,
    middleInitial: '',
    lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    taxYear: '2025',
    schoolName: '',
    schoolAddress: '',
    schoolCity: '',
    schoolState: '',
    schoolZip: '',
    schoolPhone: '',
    dsoName: '',
    dsoAddress: '',
    dsoPhone: '',
    usEntryDate: '',
    currentEntryDate: '',
  }
}

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (!digits.length) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function formatDate(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

const inputClass =
  'w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none'

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
        className={`${inputClass} ${readOnly ? 'cursor-not-allowed opacity-60' : ''} ${
          error ? 'border-red-500/60' : ''
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      {!error && helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words text-xs font-medium text-slate-200">{value || '—'}</dd>
    </div>
  )
}

export default function Form8843Page() {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState(getInitialData)
  const [errors, setErrors] = useState({})
  const [generating, setGenerating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [genError, setGenError] = useState('')

  const set = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))

  const setUpper = (field) => (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2)
    setFormData((prev) => ({ ...prev, [field]: val }))
  }

  const setDigits = (field) => (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 5)
    setFormData((prev) => ({ ...prev, [field]: val }))
  }

  const setPhone = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: formatPhone(e.target.value) }))

  const setDate = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: formatDate(e.target.value) }))

  function validate(stepIndex) {
    const next = {}
    const lettersOnly = /^[a-zA-Z\s'-]+$/

    if (stepIndex === 0) {
      if (!formData.firstName.trim()) next.firstName = 'Required'
      else if (formData.firstName.length > 20) next.firstName = 'Max 20 characters'
      else if (!lettersOnly.test(formData.firstName)) next.firstName = 'Letters only'

      if (formData.middleInitial && !/^[a-zA-Z]$/.test(formData.middleInitial))
        next.middleInitial = 'Single letter only'

      if (!formData.lastName.trim()) next.lastName = 'Required'
      else if (formData.lastName.length > 25) next.lastName = 'Max 25 characters'
      else if (!lettersOnly.test(formData.lastName)) next.lastName = 'Letters only'

      if (!formData.address.trim()) next.address = 'Required'
      else if (formData.address.length > 35) next.address = 'Max 35 characters'

      if (!formData.city.trim()) next.city = 'Required'
      else if (formData.city.length > 20) next.city = 'Max 20 characters'
      else if (!lettersOnly.test(formData.city)) next.city = 'Letters only'

      if (!formData.state) next.state = 'Required'
      else if (!/^[A-Z]{2}$/.test(formData.state)) next.state = '2 uppercase letters (e.g. CA)'

      if (!formData.zip) next.zip = 'Required'
      else if (!/^\d{5}$/.test(formData.zip)) next.zip = '5 digits required'

      if (!formData.country.trim()) next.country = 'Required'
      else if (formData.country.length > 30) next.country = 'Max 30 characters'
      else if (!lettersOnly.test(formData.country)) next.country = 'Letters only'
    }

    if (stepIndex === 1) {
      if (!formData.schoolName.trim()) next.schoolName = 'Required'
      else if (formData.schoolName.length > 60) next.schoolName = 'Max 60 characters'

      if (!formData.schoolAddress.trim()) next.schoolAddress = 'Required'
      else if (formData.schoolAddress.length > 35) next.schoolAddress = 'Max 35 characters'

      if (!formData.schoolCity.trim()) next.schoolCity = 'Required'
      else if (formData.schoolCity.length > 20) next.schoolCity = 'Max 20 characters'
      else if (!lettersOnly.test(formData.schoolCity)) next.schoolCity = 'Letters only'

      if (!formData.schoolState) next.schoolState = 'Required'
      else if (!/^[A-Z]{2}$/.test(formData.schoolState)) next.schoolState = '2 uppercase letters'

      if (!formData.schoolZip) next.schoolZip = 'Required'
      else if (!/^\d{5}$/.test(formData.schoolZip)) next.schoolZip = '5 digits required'

      if (!formData.schoolPhone.trim()) next.schoolPhone = 'Required'
      else if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(formData.schoolPhone))
        next.schoolPhone = 'Enter full 10-digit number'

      if (!formData.dsoName.trim()) next.dsoName = 'Required'
      else if (formData.dsoName.length > 40) next.dsoName = 'Max 40 characters'

      if (!formData.dsoPhone.trim()) next.dsoPhone = 'Required'
      else if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(formData.dsoPhone))
        next.dsoPhone = 'Enter full 10-digit number'
    }

    if (stepIndex === 2) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const minDate = new Date(2019, 0, 1)

      const parseDate = (str) => {
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return null
        const [m, d, y] = str.split('/').map(Number)
        const dt = new Date(y, m - 1, d)
        if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null
        return dt
      }

      const usDate = parseDate(formData.usEntryDate)
      if (!formData.usEntryDate.trim()) {
        next.usEntryDate = 'Required'
      } else if (!usDate) {
        next.usEntryDate = 'Enter a valid date (MM/DD/YYYY)'
      } else if (usDate < minDate) {
        next.usEntryDate = 'Must be 01/01/2019 or later'
      } else if (usDate > today) {
        next.usEntryDate = 'Cannot be in the future'
      }

      const curDate = parseDate(formData.currentEntryDate)
      if (!formData.currentEntryDate.trim()) {
        next.currentEntryDate = 'Required'
      } else if (!curDate) {
        next.currentEntryDate = 'Enter a valid date (MM/DD/YYYY)'
      } else if (curDate > today) {
        next.currentEntryDate = 'Cannot be in the future'
      } else if (usDate && !next.usEntryDate && curDate < usDate) {
        next.currentEntryDate = 'Must be on or after your first U.S. entry date'
      }
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleNext() {
    if (validate(step)) setStep((s) => s + 1)
  }

  function handleBack() {
    setErrors({})
    setStep((s) => s - 1)
  }

  async function handleGenerate() {
    if (!validate(2)) return
    setGenerating(true)
    setGenError('')
    try {
      const res = await fetch('/form8843.pdf')
      if (!res.ok) throw new Error('Could not load base PDF.')
      const pdfBytes = await res.arrayBuffer()
      const filled = await fillForm8843(pdfBytes, formData)
      const blob = new Blob([filled], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Form_8843_${formData.taxYear || '2025'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      setSuccess(true)
    } catch (err) {
      setGenError(err.message || 'Failed to generate PDF. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const fp = (name) => ({
    value: formData[name],
    onChange: set(name),
    error: errors[name],
    required: REQUIRED_BY_STEP[step]?.includes(name) ?? false,
  })

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f172a] text-slate-100">
      {/* Blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl animate-pulse [animation-duration:9s]" />
        <div className="absolute -right-20 top-36 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl animate-pulse [animation-duration:11s]" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl animate-pulse [animation-duration:13s]" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-blue-500/30">
              F1
            </div>
            <span className="text-base font-semibold tracking-wide text-slate-100 sm:text-lg">
              F1 Tax Helper
            </span>
          </Link>
          <Link to="/" className="text-sm text-slate-400 transition-colors hover:text-slate-200">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {/* Title */}
        <div className="mb-8 text-center">
          <span className="mb-3 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/90">
            Free — No Login Required
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Generate{' '}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              Form 8843
            </span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Fill in your details and download a completed Form 8843 PDF instantly.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="text-xs font-semibold text-slate-300">{STEPS[step]}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <div className="mt-3 flex gap-2">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={`flex-1 rounded-full py-1 text-center text-xs font-medium transition-colors ${
                  i === step
                    ? 'bg-gradient-to-r from-blue-500/20 to-violet-500/20 text-blue-300'
                    : i < step
                    ? 'text-slate-400'
                    : 'text-slate-600'
                }`}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-xl sm:p-10">

          {/* ── STEP 0: Personal Information ── */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_80px] gap-4">
                <Field name="firstName" placeholder="e.g. Kiran" maxLength={20} {...fp('firstName')} />
                <Field
                  name="middleInitial"
                  placeholder="K"
                  maxLength={1}
                  value={formData.middleInitial}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase()
                    setFormData((prev) => ({ ...prev, middleInitial: val }))
                  }}
                  error={errors.middleInitial}
                  required={false}
                />
              </div>
              <Field name="lastName" placeholder="e.g. Shahi" maxLength={25} {...fp('lastName')} />
              <Field name="address" placeholder="e.g. 123 Main St, Apt 4B" maxLength={35} {...fp('address')} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field name="city" placeholder="e.g. Los Angeles" maxLength={20} {...fp('city')} />
                <Field
                  name="state"
                  placeholder="CA"
                  maxLength={2}
                  {...fp('state')}
                  onChange={setUpper('state')}
                  helper="2-letter abbreviation (e.g. CA, NY, TX)"
                />
                <Field
                  name="zip"
                  placeholder="90024"
                  maxLength={5}
                  {...fp('zip')}
                  onChange={setDigits('zip')}
                  helper="5-digit ZIP code"
                />
              </div>
              <Field name="country" placeholder="e.g. India" maxLength={30} {...fp('country')} />
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Tax Year</label>
                <input
                  type="text"
                  value="2025"
                  readOnly
                  className={`${inputClass} cursor-not-allowed opacity-60`}
                />
              </div>
            </div>
          )}

          {/* ── STEP 1: School Information ── */}
          {step === 1 && (
            <div className="space-y-4">
              <Field
                name="schoolName"
                placeholder="e.g. University of California, Los Angeles"
                maxLength={60}
                {...fp('schoolName')}
              />
              <Field
                name="schoolAddress"
                placeholder="e.g. 405 Hilgard Ave"
                maxLength={35}
                {...fp('schoolAddress')}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field name="schoolCity" placeholder="e.g. Los Angeles" maxLength={20} {...fp('schoolCity')} />
                <Field
                  name="schoolState"
                  placeholder="CA"
                  maxLength={2}
                  {...fp('schoolState')}
                  onChange={setUpper('schoolState')}
                  helper="2-letter abbreviation (e.g. CA, NY, TX)"
                />
                <Field
                  name="schoolZip"
                  placeholder="90024"
                  maxLength={5}
                  {...fp('schoolZip')}
                  onChange={setDigits('schoolZip')}
                  helper="5-digit ZIP code"
                />
              </div>
              <Field
                name="schoolPhone"
                placeholder="(310) 825-4321"
                type="tel"
                {...fp('schoolPhone')}
                onChange={setPhone('schoolPhone')}
                helper="Include area code"
              />
              <div className="border-t border-white/10 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                  DSO Information
                </p>
                <div className="space-y-4">
                  <Field name="dsoName" placeholder="e.g. Jane Smith" maxLength={40} {...fp('dsoName')} />
                  <Field
                    name="dsoAddress"
                    placeholder="e.g. 405 Hilgard Ave, Suite 200 (optional)"
                    maxLength={35}
                    value={formData.dsoAddress}
                    onChange={set('dsoAddress')}
                    error={errors.dsoAddress}
                    required={false}
                  />
                  <Field
                    name="dsoPhone"
                    placeholder="(310) 825-0000"
                    type="tel"
                    {...fp('dsoPhone')}
                    onChange={setPhone('dsoPhone')}
                    helper="Include area code"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Visa Information ── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Summary card */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">
                    Review your information before generating
                  </h3>
                  <button
                    type="button"
                    onClick={() => { setErrors({}); setStep(0) }}
                    className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Personal Info
                    </p>
                    <dl className="space-y-2">
                      <SummaryRow
                        label="Name"
                        value={`${formData.firstName}${formData.middleInitial ? ' ' + formData.middleInitial + '.' : ''} ${formData.lastName}`.trim()}
                      />
                      <SummaryRow
                        label="Address"
                        value={`${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`}
                      />
                      <SummaryRow label="Country of Citizenship" value={formData.country} />
                      <SummaryRow label="Tax Year" value={formData.taxYear || '2025'} />
                    </dl>
                  </div>
                  <div>
                    <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
                      School Info
                    </p>
                    <dl className="space-y-2">
                      <SummaryRow label="School" value={formData.schoolName} />
                      <SummaryRow
                        label="School Address"
                        value={`${formData.schoolAddress}, ${formData.schoolCity}, ${formData.schoolState} ${formData.schoolZip}`}
                      />
                      <SummaryRow label="School Phone" value={formData.schoolPhone} />
                      <SummaryRow label="DSO Name" value={formData.dsoName} />
                      {formData.dsoAddress && (
                        <SummaryRow label="DSO Address" value={formData.dsoAddress} />
                      )}
                      <SummaryRow label="DSO Phone" value={formData.dsoPhone} />
                    </dl>
                  </div>
                </div>
              </div>

              {/* Visa type */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Visa Type</label>
                <input
                  type="text"
                  value="F-1"
                  readOnly
                  className={`${inputClass} cursor-not-allowed opacity-60`}
                />
              </div>

              <Field
                name="usEntryDate"
                placeholder="MM/DD/YYYY"
                {...fp('usEntryDate')}
                onChange={setDate('usEntryDate')}
                helper="Found on your I-94 at cbp.dhs.gov"
              />
              <Field
                name="currentEntryDate"
                placeholder="MM/DD/YYYY"
                {...fp('currentEntryDate')}
                onChange={setDate('currentEntryDate')}
                helper="Date of your most recent entry to the US"
              />

              <div className="pt-2">
                {success ? (
                  <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-4 text-center">
                    <p className="text-sm font-semibold text-green-400">
                      ✓ Your Form 8843 has been downloaded!
                    </p>
                    <p className="mt-1 text-xs text-green-400/70">
                      Review carefully before filing. Save a copy for your records.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setSuccess(false); setStep(0); setFormData(getInitialData()) }}
                      className="mt-3 text-xs text-slate-400 underline hover:text-slate-200"
                    >
                      Fill out another form
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {generating ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Generating PDF…
                      </>
                    ) : (
                      'Generate & Download PDF →'
                    )}
                  </button>
                )}

                {genError && (
                  <p className="mt-2 text-center text-xs text-red-400">{genError}</p>
                )}
              </div>

              {/* Disclaimer */}
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3">
                <p className="text-xs leading-5 text-yellow-400">
                  ⚠️ Review your completed form carefully before filing. This tool is for guidance only
                  and does not constitute professional tax advice. Verify with{' '}
                  <a
                    href="https://www.irs.gov"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-yellow-300"
                  >
                    irs.gov
                  </a>
                  .
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}
            {step < STEPS.length - 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
