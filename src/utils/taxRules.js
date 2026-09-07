import { TAX_YEAR, filingDeadline, SOURCES } from '../data/taxSeason.js'

export function computeStatusResult(answers) {
  const { visa, years, income, status_change, compliance, days } = answers
  const student = ['f1', 'opt', 'j1-student'].includes(visa)
  const eligibleYears = ['1-2', '3-4', '5'].includes(years)
  const hasIncome = income !== 'none'
  const hasW2 = ['w2', 'both'].includes(income)
  const hasScholarship = ['scholarship', 'both'].includes(income)
  const eligible =
    student && eligibleYears && status_change === 'no' && compliance === 'yes' && days !== 'zero'
  const common = {
    taxYear: TAX_YEAR,
    checkedAt: new Date().toISOString(),
    hasIncome,
    hasW2,
    hasScholarship,
  }
  if (!eligible)
    return {
      ...common,
      status: 'Residency review needed',
      badge: 'review',
      forms: [],
      deadline: 'Confirm your filing status and deadline before choosing a return.',
      message:
        days === 'zero'
          ? 'With no US presence this year, this student day-exclusion screen cannot determine a filing obligation. Prior residency or US-source income may still matter.'
          : 'This short screen cannot determine your residency. Review countable days across three years, prior exempt years, visa category and any status changes. A sixth year or a pending green-card application does not automatically make you a resident. Do not choose Form 1040 or 1040-NR from this screen alone.',
    }
  const forms = [
    {
      id: 'form-8843',
      name: 'Form 8843',
      description:
        'Documents eligible student days excluded from the substantial presence test, including when you have no income.',
      cta: 'Prepare form →',
      ctaLink: visa === 'j1-student' ? SOURCES.form8843 : '/form-8843',
    },
  ]
  if (hasIncome)
    forms.push({
      id: 'form-1040nr',
      name: 'Review Form 1040-NR',
      description:
        'Generally needed for taxable US income; scholarships, exempt income and withholding can affect filing requirements.',
      cta: 'IRS instructions →',
      ctaLink: SOURCES.nonresidentReturn,
    })
  if (hasW2)
    forms.push({
      id: 'w2',
      name: 'W-2',
      description:
        'Collect your employer wage statement and any treaty-exempt wage statement (1042-S).',
    })
  if (hasScholarship)
    forms.push({
      id: '1042s',
      name: 'Form 1042-S, if issued',
      description: 'Review taxable scholarship and fellowship amounts with your payer.',
    })
  return {
    ...common,
    status: 'Likely Nonresident Alien (NRA)',
    badge: 'nra',
    forms,
    deadline: `${filingDeadline(hasW2)} (expected)`,
    message:
      'Eligible F-1 / J-1 student days are excluded during the first five calendar years, including year five. Spending 183 or more actual days in the US does not override that exclusion. This is a screening result, not a final residency determination.',
  }
}

export function questionnaireResidency(years) {
  return Number.isInteger(years) && years >= 1 && years <= 5
    ? 'Likely Nonresident Alien'
    : 'Residency review needed'
}

export function buildActionItems(answers, treatyMessage) {
  const review = answers.residencyStatus !== 'Likely Nonresident Alien'
  const items = []
  if (review) {
    items.push(
      'Residency review needed: calculate the substantial presence test using countable days over three years and review prior exempt years and status changes before choosing Form 1040 or 1040-NR. More than five calendar years does not automatically mean resident.',
    )
  } else {
    items.push(
      'Likely nonresident, assuming you maintained eligible F-1 student status throughout the tax year, have no green card or relevant status changes, and counted every prior exempt student, teacher or trainee calendar year. Confirm these assumptions with the status checker.',
    )
    items.push(
      answers.hasUSIncome === false
        ? `If you qualify to exclude student days and had no US-source income or other return requirement, generally file only Form 8843 by ${filingDeadline(false)} (expected). No SSN or ITIN is needed solely for Form 8843.`
        : 'If you qualify to exclude student days, file Form 8843. Review Form 1040-NR requirements for wages and other taxable US income, including amounts covered by a treaty.',
    )
  }
  if (answers.hasUSIncome)
    items.push(
      `Expected individual 1040-NR deadline: ${filingDeadline(answers.incomeTypes?.includes('w2'))}. April applies to employee wages subject to US income tax withholding; otherwise June generally applies. Confirm the type of income, including treaty-exempt wages.`,
    )
  if (answers.incomeTypes?.includes('1042s'))
    items.push(
      'Review Form 1042-S and scholarship records. Qualified tuition and required course expenses may be tax-free; room, board and services generally are not. A scholarship does not automatically require a return or automatically qualify for a treaty exemption.',
    )
  if (answers.incomeTypes?.includes('1099'))
    items.push(
      'Review the specific 1099 type: a 1099 does not always mean self-employment. Report taxable income and check work authorization with your DSO if you performed services.',
    )
  if (answers.incomeTypes?.includes('investment'))
    items.push(
      'Investment income needs separate review. Certain nonresident bank interest is exempt; dividends and capital gains have different rules. The capital-gains 183-day rule is distinct from the residency test.',
    )
  if (treatyMessage) items.push(treatyMessage)
  items.push(
    'Federal tax residency differs from immigration status and state tax residency. Review state filing requirements separately.',
  )
  return items
}
