import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Download, ShieldCheck } from 'lucide-react'
import pdfFontUrl from '@fontsource/inter/files/inter-latin-400-normal.woff?url'
import {
  blank8843,
  restore8843,
  validate8843,
  visaYears,
  presenceYears,
} from '../utils/form8843Model.js'
import { TAX_YEAR, canGenerate8843, SOURCES, filingDeadline } from '../data/taxSeason.js'
import { readStored, writeStored, removeStored, seasonKey } from '../utils/storage.js'
import { FormPreview } from '../components/form8843/FormPreview'
import DisclaimerBanner from '../components/DisclaimerBanner'
import SeasonNotice from '../components/SeasonNotice'
import useAuth from '../hooks/useAuth'

const STEPS = ['Your information', 'Your addresses', 'Your school', 'Your DSO', 'Visa & presence']
const FIELDS = [
  [
    ['firstName', 'First name'],
    ['middleInitial', 'Middle initial (optional)'],
    ['lastName', 'Last name'],
    ['countryOfCitizenship', 'Country or countries of citizenship'],
    ['passportCountry', 'Passport issuing country'],
    ['passportNumber', 'Passport number'],
    ['tinOrSSN', 'SSN or ITIN, if you have one (optional)'],
  ],
  [
    ['foreignAddress', 'Address in country of residence'],
    ['usStreet', 'US street address, if applicable'],
    ['usCity', 'US city'],
    ['usState', 'US state'],
    ['usZip', 'US ZIP code'],
  ],
  [
    ['schoolName', 'School / university name'],
    ['schoolStreet', 'School street address'],
    ['schoolCity', 'School city'],
    ['schoolState', 'School state'],
    ['schoolZip', 'School ZIP code'],
    ['schoolPhone', 'School phone'],
  ],
  [
    ['dsoName', 'DSO / academic director name'],
    ['dsoStreet', 'DSO office street address'],
    ['dsoCity', 'DSO office city'],
    ['dsoState', 'DSO office state'],
    ['dsoZip', 'DSO office ZIP code'],
    ['dsoPhone', 'DSO phone'],
  ],
  [
    ['currentEntryDate', 'Most recent F-1 entry by year-end (MM/DD/YYYY)'],
    ['currentImmigrationStatus', 'Status at year-end; include date and previous status if changed'],
  ],
]
const inputClass =
  'mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-headline placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
function Field({ name, label, value, onChange, error, multiline = false, ...rest }) {
  const Input = multiline ? 'textarea' : 'input'
  return (
    <div className={multiline ? 'sm:col-span-2' : ''}>
      <label htmlFor={name} className="text-xs font-medium text-body">
        {label}
      </label>
      <Input
        id={name}
        name={name}
        value={value || ''}
        onChange={onChange}
        className={inputClass}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        {...(multiline ? { rows: 3 } : { type: 'text' })}
        {...rest}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
function YesNo({ name, label, data, set, error }) {
  return (
    <fieldset className="rounded-xl border border-border p-4">
      <legend className="px-1 text-sm text-body">{label}</legend>
      <div className="mt-2 flex gap-5">
        {['yes', 'no'].map((value) => (
          <label key={value} className="flex items-center gap-2 text-sm capitalize">
            <input
              type="radio"
              name={name}
              value={value}
              checked={data[name] === value}
              onChange={() => set(name, value)}
              className="accent-primary"
            />
            {value}
          </label>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </fieldset>
  )
}
export default function Form8843Page() {
  const { user } = useAuth()
  const uid = user?.id || 'guest'
  const [year, setYear] = useState(TAX_YEAR)
  const key = seasonKey('8843-draft-v4', uid, year)
  const [data, setData] = useState(() => restore8843(readStored(key, null, 'sessionStorage'), year))
  const [loadedKey, setLoadedKey] = useState(key)
  const [step, setStep] = useState(0)
  const [review, setReview] = useState(false)
  const [errors, setErrors] = useState({})
  const [generating, setGenerating] = useState(false)
  const [notice, setNotice] = useState('')
  const [success, setSuccess] = useState(false)
  const heading = useRef(null)
  const generatingRef = useRef(false)
  const ready = canGenerate8843(year)

  useEffect(() => {
    setData(restore8843(readStored(key, null, 'sessionStorage'), year))
    setLoadedKey(key)
    setStep(0)
    setReview(false)
    setErrors({})
    setSuccess(false)
  }, [key, year])
  useEffect(() => {
    if (key === loadedKey && !success && !writeStored(key, data, 'sessionStorage'))
      setNotice(
        'Draft saving is unavailable in this browser. Keep this tab open while preparing your form.',
      )
  }, [data, key, loadedKey, success])
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [step, review])
  function set(name, value) {
    setData((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: undefined }))
  }
  function next() {
    const result = validate8843(data, step)
    setErrors(result)
    if (Object.keys(result).length) {
      setNotice('Check the highlighted fields before continuing.')
      return
    }
    setNotice('')
    if (step === 4) setReview(true)
    else setStep(step + 1)
  }
  function clear() {
    if (!window.confirm('Clear this form draft from this tab?')) return
    removeStored(key, 'sessionStorage')
    setData(blank8843(year))
    setStep(0)
    setReview(false)
    setErrors({})
    setSuccess(false)
    setNotice('Draft cleared.')
  }
  async function generate() {
    if (!ready || generatingRef.current) return
    const result = validate8843(data)
    if (Object.keys(result).length) {
      setErrors(result)
      setReview(false)
      setStep(0)
      setNotice('Review the form before downloading.')
      return
    }
    generatingRef.current = true
    setGenerating(true)
    setNotice('')
    try {
      const [{ fillForm8843 }, response, fontResponse] = await Promise.all([
        import('../utils/form8843Fields.js'),
        fetch('/form8843.pdf'),
        fetch(pdfFontUrl),
      ])
      if (!response.ok || !fontResponse.ok)
        throw new Error('Could not load the official form or its font. Please try again.')
      const [pdfBytes, fontBytes] = await Promise.all([
        response.arrayBuffer(),
        fontResponse.arrayBuffer(),
      ])
      const bytes = await fillForm8843(pdfBytes, data, fontBytes)
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `Form_8843_${year}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      writeStored(seasonKey('8843-generated', uid, year), true)
      removeStored(key, 'sessionStorage')
      setSuccess(true)
    } catch (error) {
      setNotice(error.message || 'The download failed. Please try again.')
    } finally {
      generatingRef.current = false
      setGenerating(false)
    }
  }
  return (
    <div className="min-h-screen bg-background text-body">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="border border-border px-2 py-1 font-mono text-xs font-bold text-primary">
              F1
            </span>
            <span className="text-sm font-medium text-headline">Tax Helper</span>
          </Link>
          <button
            type="button"
            onClick={clear}
            className="text-xs text-muted-foreground hover:text-body"
          >
            Clear data
          </button>
        </div>
      </header>
      <DisclaimerBanner />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <SeasonNotice />
        </div>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              to="/"
              className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Back home
            </Link>
            <h1 className="text-2xl font-semibold text-headline sm:text-3xl">
              Your Form 8843, one step at a time.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              For F-1 students claiming eligible day exclusions. Use your records for the selected
              income year. Your form stays in this tab and is filled on your device.
            </p>
          </div>
          <label className="text-xs text-muted-foreground">
            Income year
            <select
              aria-label="Income year"
              disabled={generating}
              value={year}
              onChange={(e) => {
                setYear(Number(e.target.value))
                setNotice('')
              }}
              className={inputClass}
            >
              <option value={2026}>2026 · prepare for 2027</option>
              <option value={2025}>2025 · prior-year filing</option>
            </select>
          </label>
        </div>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <section className="min-w-0 rounded-2xl border border-border bg-surface p-5 sm:p-8">
            {success ? (
              <div className="animate-fade-up space-y-5">
                <Check className="h-10 w-10 text-success" />
                <h2 className="text-xl font-semibold text-headline">
                  Your {year} form has downloaded.
                </h2>
                <p className="text-sm leading-relaxed">
                  Review every entry and any supporting statements. When filing standalone, print,
                  sign and date page 2. If filing a tax return, attach Form 8843 as instructed. This
                  app does not submit anything to the IRS.
                </p>
                <p className="text-sm text-warning">
                  For {year}, the usual standalone no-return deadline was{' '}
                  {filingDeadline(false, year)}. If filing late, review the IRS instructions or seek
                  qualified help; generating a form does not establish eligibility.
                </p>
                <a
                  href={SOURCES.form8843}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-primary hover:underline"
                >
                  Check the IRS filing and mailing instructions →
                </a>
                <button
                  className="btn-ghost"
                  onClick={() => {
                    setSuccess(false)
                    setReview(true)
                  }}
                >
                  Review or download again
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="mb-3 flex justify-between text-xs text-muted-foreground">
                    <span>{review ? 'Final review' : `Step ${step + 1} of ${STEPS.length}`}</span>
                    <span>Tax year {year}</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label="Form preparation progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={review ? 100 : step * 20}
                    className="h-1 overflow-hidden rounded-full bg-border"
                  >
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${review ? 100 : step * 20}%` }}
                    />
                  </div>
                </div>
                <div key={`${step}:${review}`} className="animate-fade-up">
                  <h2
                    ref={heading}
                    tabIndex={-1}
                    className="mb-6 text-xl font-semibold text-headline outline-none"
                  >
                    {review ? 'Review your information' : STEPS[step]}
                  </h2>
                  {notice && (
                    <p
                      role="alert"
                      className="mb-5 rounded-xl border border-warning/30 bg-warning-soft p-3 text-sm text-warning"
                    >
                      {notice}
                    </p>
                  )}
                  {review ? (
                    <div className="space-y-5">
                      {FIELDS.map((fields, index) => (
                        <div key={index} className="rounded-xl border border-border p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-headline">{STEPS[index]}</h3>
                            <button
                              onClick={() => {
                                setStep(index)
                                setReview(false)
                              }}
                              className="text-xs text-primary"
                            >
                              Edit
                            </button>
                          </div>
                          <dl className="space-y-2 text-sm">
                            {fields.map(([name, label]) => (
                              <div key={name} className="grid gap-1 sm:grid-cols-2">
                                <dt className="text-muted-foreground">{label}</dt>
                                <dd className="break-words">
                                  {name === 'tinOrSSN' && data[name]
                                    ? `Ending ${data[name].slice(-4)}`
                                    : data[name] || 'Not provided'}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      ))}
                      <div className="rounded-xl border border-border p-4 text-sm">
                        <p>
                          {presenceYears(year)
                            .map(
                              (y, i) =>
                                `${y}: ${data[['daysCurrent', 'daysPrevious', 'daysPrior'][i]]} days`,
                            )
                            .join(' · ')}
                        </p>
                        <p className="mt-2">
                          {year} days excluded: {data.daysToExclude}
                        </p>
                        <p className="mt-2">
                          Prior visa history:{' '}
                          {visaYears(year)
                            .map((y) => `${y}: ${data.visaHistory[y]}`)
                            .join(', ')}
                        </p>
                        <p className="mt-2">
                          Line 12 (more than five exempt years): {data.line12Answer}. Line 13
                          (permanent-residence steps): {data.line13Answer}.
                        </p>
                        {[data.visaChanges, data.line12Explanation, data.line14Explanation]
                          .filter(Boolean)
                          .map((v, i) => (
                            <p key={i} className="mt-2 whitespace-pre-wrap break-words">
                              {v}
                            </p>
                          ))}
                      </div>
                      {!ready && (
                        <p className="rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-warning">
                          Preparation only. The final {year} IRS form is not yet verified for
                          download. Your draft stays in this tab. Review your actual full-year
                          information before filing.
                        </p>
                      )}
                      <button
                        onClick={generate}
                        disabled={!ready || generating}
                        className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Download className="h-4 w-4" />
                        {generating
                          ? 'Preparing PDF…'
                          : ready
                            ? `Generate & download ${year} form`
                            : 'Awaiting final 2026 IRS form'}
                      </button>
                    </div>
                  ) : (
                    <>
                      {step === 1 && (
                        <p className="mb-5 text-sm text-muted-foreground">
                          For a standalone form, enter your address in your country of residence and
                          your US address if applicable. No US address? Leave those four fields
                          blank.
                        </p>
                      )}
                      {step === 3 && (
                        <button
                          onClick={() =>
                            setData((p) => ({
                              ...p,
                              dsoStreet: p.schoolStreet,
                              dsoCity: p.schoolCity,
                              dsoState: p.schoolState,
                              dsoZip: p.schoolZip,
                            }))
                          }
                          className="mb-5 text-sm text-primary hover:underline"
                        >
                          Use my school's address for the DSO office
                        </button>
                      )}
                      <div className="grid gap-5 sm:grid-cols-2">
                        {FIELDS[step].map(([name, label]) => (
                          <Field
                            key={name}
                            name={name}
                            label={label}
                            value={data[name]}
                            error={errors[name]}
                            onChange={(e) => set(name, e.target.value)}
                            multiline={name === 'foreignAddress'}
                            autoComplete={
                              ['tinOrSSN', 'passportNumber'].includes(name) ? 'off' : undefined
                            }
                          />
                        ))}
                      </div>
                      {step === 4 && (
                        <div className="mt-7 space-y-6">
                          <div>
                            <h3 className="mb-3 text-sm font-semibold text-headline">
                              Actual presence · Part I, line 4
                            </h3>
                            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                              Count actual days for each year. Enter 0 when you were absent. Line 4b
                              uses only eligible excluded days in {year}, never the sum of all three
                              years.
                            </p>
                            <div className="grid gap-4 sm:grid-cols-2">
                              {['daysCurrent', 'daysPrevious', 'daysPrior', 'daysToExclude'].map(
                                (name, i) => (
                                  <Field
                                    key={name}
                                    name={name}
                                    label={
                                      i < 3
                                        ? `Days present in ${year - i}`
                                        : `Eligible days to exclude in ${year}`
                                    }
                                    value={data[name]}
                                    error={errors[name]}
                                    onChange={(e) => set(name, e.target.value)}
                                    inputMode="numeric"
                                    maxLength={3}
                                  />
                                ),
                              )}
                            </div>
                          </div>
                          <div>
                            <h3 className="mb-3 text-sm font-semibold text-headline">
                              Visa history · Part III, line 11
                            </h3>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                              {visaYears(year).map((y) => (
                                <div key={y}>
                                  <label htmlFor={`visa-${y}`} className="text-xs text-body">
                                    {y}
                                  </label>
                                  <select
                                    id={`visa-${y}`}
                                    value={data.visaHistory[y]}
                                    onChange={(e) =>
                                      set('visaHistory', {
                                        ...data.visaHistory,
                                        [y]: e.target.value,
                                      })
                                    }
                                    className={inputClass}
                                    aria-invalid={Boolean(errors[`visa-${y}`])}
                                  >
                                    <option value="">Select</option>
                                    {[
                                      'F-1',
                                      'F-2',
                                      'J-1',
                                      'J-2',
                                      'M-1',
                                      'Q-1',
                                      'None',
                                      'Changed',
                                    ].map((v) => (
                                      <option key={v}>{v}</option>
                                    ))}
                                  </select>
                                  {errors[`visa-${y}`] && (
                                    <p className="mt-1 text-xs text-danger">
                                      {errors[`visa-${y}`]}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                            <p className="mt-3 text-xs text-muted-foreground">
                              None means no F/J/M/Q status that year. Select Changed for multiple
                              visa types and provide the dates below.
                            </p>
                          </div>
                          <Field
                            name="visaChanges"
                            label="Visa changes and dates, if any (attached statement)"
                            value={data.visaChanges}
                            onChange={(e) => set('visaChanges', e.target.value)}
                            error={errors.visaChanges}
                            multiline
                          />
                          <YesNo
                            name="line12Answer"
                            label="Line 12: Were you exempt as a teacher, trainee or student for any part of more than five calendar years?"
                            data={data}
                            set={set}
                            error={errors.line12Answer}
                          />
                          {data.line12Answer === 'yes' && (
                            <Field
                              name="line12Explanation"
                              label="Facts supporting continued student day exclusions (attached statement). Review eligibility with a qualified preparer."
                              value={data.line12Explanation}
                              onChange={(e) => set('line12Explanation', e.target.value)}
                              error={errors.line12Explanation}
                              multiline
                            />
                          )}
                          <YesNo
                            name="line13Answer"
                            label={`Line 13: During ${year}, did you apply, take affirmative steps to apply, or have a pending application for US lawful permanent residence?`}
                            data={data}
                            set={set}
                            error={errors.line13Answer}
                          />
                          {data.line13Answer === 'yes' && (
                            <Field
                              name="line14Explanation"
                              label="Line 14: Explain the application or steps taken (attached statement)"
                              value={data.line14Explanation}
                              onChange={(e) => set('line14Explanation', e.target.value)}
                              error={errors.line14Explanation}
                              multiline
                            />
                          )}
                        </div>
                      )}
                      <button onClick={next} className="btn-primary mt-8 w-full justify-center">
                        {step === 4 ? 'Review my information' : 'Continue →'}
                      </button>
                    </>
                  )}
                  {(step > 0 || review) && (
                    <button
                      className="mt-5 text-sm text-muted-foreground hover:text-body"
                      onClick={() => {
                        if (review) setReview(false)
                        else setStep(step - 1)
                        setErrors({})
                        setNotice('')
                      }}
                    >
                      ← Back
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
          <aside className="min-w-0 lg:sticky lg:top-24">
            <div className="mb-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <span>Live preview · {year}</span>
              <span>Preparation only</span>
            </div>
            <FormPreview formData={data} activeStep={step} showReview={review} />
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              This preview is a guide, not an IRS form. Closing the tab or clearing data removes the
              saved draft. Downloaded PDFs stay on your device.
            </p>
          </aside>
        </div>
      </main>
    </div>
  )
}
