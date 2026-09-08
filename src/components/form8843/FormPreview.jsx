import { visaYears } from '../../utils/form8843Model.js'
import { cn } from '../../utils/cn'
import {
  buildNameField,
  buildUsAddress,
  buildSchoolLine,
  buildDsoLine,
} from '../../utils/form8843Display'

// Wizard step → preview section that lights up while the user types.
const STEP_SECTIONS = ['identity', 'address', 'school', 'dso', 'days']

function Section({ active, className, children }) {
  return (
    <div
      className={cn(
        'motion-preview-field',
        active && 'ring-1 ring-[#3b82f6] bg-blue-50 rounded-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}

function LabeledBox({ label, value, className }) {
  return (
    <div className={cn('border border-gray-400 px-1 pb-1 pt-0.5', className)}>
      <p className="text-[7px] leading-tight text-gray-500">{label}</p>
      {value ? (
        <p className="text-[9px] font-semibold leading-tight break-words">{value}</p>
      ) : (
        <div className="mt-[7px] border-b border-dotted border-gray-300" />
      )}
    </div>
  )
}

function NumberedLine({ num, label, value }) {
  return (
    <div className="flex items-end gap-1.5 py-[3px]">
      <span className="w-4 shrink-0 text-[8px] font-bold">{num}</span>
      <span className="text-[8px] leading-tight text-gray-700">{label}</span>
      <span className="min-w-[40px] flex-1 border-b border-dotted border-gray-300 px-1">
        {value ? (
          <span className="text-[9px] font-semibold leading-tight break-words">{value}</span>
        ) : (
          ' '
        )}
      </span>
    </div>
  )
}

function CheckBox({ checked }) {
  return (
    <span className="flex h-[11px] w-[11px] items-center justify-center border border-gray-500 text-[8px] font-bold leading-none">
      {checked ? 'X' : ' '}
    </span>
  )
}

function YesNoLine({ num, label, answer }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 py-[3px]">
      <span className="w-4 shrink-0 text-[8px] font-bold">{num}</span>
      <span className="flex-1 text-[8px] leading-tight text-gray-700">{label}</span>
      <span className="flex shrink-0 items-center gap-1">
        <span className="text-[7px]">Yes</span>
        <CheckBox checked={answer === 'yes'} />
        <span className="ml-1 text-[7px]">No</span>
        <CheckBox checked={answer === 'no'} />
      </span>
    </div>
  )
}

function DayBox({ year, value }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      {year && <span className="text-[7px] text-gray-600">{year}</span>}
      <span className="flex h-[14px] w-9 items-center border border-gray-400 px-1 text-[9px] font-semibold">
        {value || ' '}
      </span>
    </div>
  )
}

function PartDivider({ part, title }) {
  return (
    <div className="mt-2 flex items-baseline gap-2 border-t border-gray-400 pt-1">
      <span className="bg-black px-1 text-[8px] font-bold text-white">{part}</span>
      <span className="text-[8px] font-bold">{title}</span>
    </div>
  )
}

export function FormPreview({ formData, activeStep, showReview }) {
  const active = showReview ? null : (STEP_SECTIONS[activeStep] ?? null)

  const nameField = buildNameField(formData)
  const usAddress = buildUsAddress(formData)
  const schoolLine = buildSchoolLine(formData)
  const dsoLine = buildDsoLine(formData)
  const taxYear = String(formData.taxYear)

  return (
    <div
      className="w-full rounded-sm bg-white p-3 text-black shadow-2xl"
      style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
    >
      <Section active={active === 'identity'}>
        {/* Header row */}
        <div className="flex items-stretch gap-2 border-b-2 border-gray-700 pb-1">
          <div className="w-16 shrink-0">
            <p className="text-[7px] leading-tight">Form</p>
            <p className="text-[14px] font-bold leading-none">8843</p>
            <p className="mt-0.5 text-[6px] leading-tight text-gray-500">
              Preparation preview — not for filing
            </p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-[9px] font-bold leading-tight">
              Statement for Exempt Individuals and Individuals With a Medical Condition
            </p>
            <p className="mt-0.5 text-[6px] text-gray-500">For use by alien individuals only.</p>
          </div>
          <div className="w-12 shrink-0 border border-gray-500 p-0.5 text-center">
            <p className="text-[6px] text-gray-500">Tax year</p>
            <p className="text-[12px] font-bold leading-tight">{taxYear}</p>
          </div>
        </div>

        {/* Name + TIN row */}
        <div className="mt-1 flex gap-1">
          <LabeledBox label="Your first name and initial" value={nameField} className="flex-1" />
          <LabeledBox label="Last name" value={formData.lastName} className="flex-1" />
          <LabeledBox
            label="Your U.S. taxpayer identification number, if any"
            value={formData.tinOrSSN ? `Ending ${formData.tinOrSSN.slice(-4)}` : ''}
            className="w-[30%] shrink-0"
          />
        </div>
      </Section>

      <Section active={active === 'address'} className="mt-1">
        <div className="flex flex-col gap-1">
          <LabeledBox
            label="Address in country of residence (see instructions)"
            value={formData.foreignAddress}
          />
          <LabeledBox label="Address in the United States (see instructions)" value={usAddress} />
        </div>
      </Section>

      <PartDivider part="Part I" title="General Information" />

      <Section active={active === 'identity'}>
        <NumberedLine
          num="1a"
          label="Type of U.S. visa and date you entered the United States"
          value={formData.currentEntryDate ? `F-1, ${formData.currentEntryDate}` : ''}
        />
        <NumberedLine
          num="1b"
          label="Current nonimmigrant status"
          value={formData.currentImmigrationStatus}
        />
        <NumberedLine
          num="2"
          label="Of what country or countries were you a citizen during the tax year?"
          value={formData.countryOfCitizenship}
        />
        <NumberedLine
          num="3a"
          label="What country or countries issued you a passport?"
          value={formData.passportCountry}
        />
        <NumberedLine
          num="3b"
          label="Enter your passport number(s)"
          value={formData.passportNumber ? 'Provided' : ''}
        />
      </Section>

      <Section active={active === 'days'}>
        <div className="flex flex-wrap items-center gap-1.5 py-[3px]">
          <span className="w-4 shrink-0 text-[8px] font-bold">4a</span>
          <span className="flex-1 text-[8px] leading-tight text-gray-700">
            Enter the actual number of days you were present in the United States during:
          </span>
          <DayBox year={taxYear} value={formData.daysCurrent} />
          <DayBox year={Number(taxYear) - 1} value={formData.daysPrevious} />
          <DayBox year={Number(taxYear) - 2} value={formData.daysPrior} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 py-[3px]">
          <span className="w-4 shrink-0 text-[8px] font-bold">4b</span>
          <span className="flex-1 text-[8px] leading-tight text-gray-700">
            Enter the number of days in {taxYear} you claim you can exclude for purposes of the
            substantial presence test
          </span>
          <DayBox value={formData.daysToExclude} />
        </div>
      </Section>

      <PartDivider part="Part III" title="Students" />

      <Section active={active === 'school'}>
        <NumberedLine
          num="9"
          label={`Academic institution attended during ${taxYear}: name, address and phone`}
          value={schoolLine}
        />
      </Section>

      <Section active={active === 'dso'}>
        <NumberedLine
          num="10"
          label={`Academic program director during ${taxYear}: name, address and phone`}
          value={dsoLine}
        />
      </Section>

      <Section active={active === 'days'}>
        <NumberedLine
          num="11"
          label="F/J/M/Q visa history"
          value={visaYears(taxYear)
            .map((y) => `${y}: ${formData.visaHistory?.[y] || '—'}`)
            .join(', ')}
        />
        <YesNoLine
          num="12"
          label="Were you exempt as a teacher, trainee or student for any part of more than five calendar years?"
          answer={formData.line12Answer}
        />
        <YesNoLine
          num="13"
          label={`During ${taxYear}, did you apply, take affirmative steps to apply, or have a pending application for US lawful permanent residence?`}
          answer={formData.line13Answer}
        />
        <NumberedLine
          num="14"
          label="If you checked the 'Yes' box on line 13, explain"
          value={formData.line13Answer === 'yes' ? formData.line14Explanation : ''}
        />
      </Section>
    </div>
  )
}
