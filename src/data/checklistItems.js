import { SOURCES } from './taxSeason.js'

// The single document checklist for the app. My Taxes renders it and the Home
// journey counts it, so both always agree.
export function buildFilingItems({ hasIncome, hasW2, hasScholarship, needsReview }) {
  if (needsReview)
    return [
      {
        id: 'residency-review',
        name: 'Confirm tax residency before selecting forms',
        description:
          'Review countable days, prior exempt years and status changes with a qualified tax preparer. Gather income records while you review.',
        required: true,
        link: SOURCES.presence,
        external: true,
        linkLabel: 'IRS residency test',
      },
    ]
  const items = [
    {
      id: 'form-8843',
      name: 'Form 8843',
      description:
        'Required when claiming eligible student day exclusions, including with no income',
      required: true,
      link: '/form-8843',
      linkLabel: 'Prepare it here',
    },
  ]
  if (hasIncome)
    items.push({
      id: 'form-1040nr',
      name: 'Form 1040-NR',
      description:
        'Review filing requirements for taxable US income; exempt income and withholding can affect whether a return is required',
      required: true,
      link: null,
    })
  if (hasW2)
    items.push({
      id: 'w2',
      name: 'W-2 Form',
      description: 'Generally furnished by your employer by February 1, 2027',
      required: true,
      link: null,
    })
  if (hasScholarship)
    items.push({
      id: '1042s',
      name: 'Form 1042-S',
      description: "Foreign Person's US Source Income — received from your university",
      required: true,
      link: null,
    })
  items.push({
    id: '1099int',
    name: 'Form 1099-INT',
    description:
      'If issued; certain bank interest is exempt for nonresidents. A $10 reporting threshold does not determine taxability.',
    required: false,
    link: null,
  })
  items.push({
    id: '1098t',
    name: 'Form 1098-T',
    description: 'Tuition statement from your university, for your records',
    required: false,
    link: null,
  })
  return items
}

export const IDENTITY_ITEMS = [
  {
    id: 'passport',
    name: 'Passport (copy)',
    description: 'Photo page and any US visa stamps',
    required: true,
    link: null,
  },
  {
    id: 'f1-visa',
    name: 'F-1 Visa stamp',
    description: 'Page in your passport showing the F-1 visa',
    required: true,
    link: null,
  },
  {
    id: 'i20',
    name: 'I-20 (all pages)',
    description: 'All pages of your current I-20 from your school',
    required: true,
    link: null,
  },
  {
    id: 'i94',
    name: 'I-94 Arrival/Departure Record',
    description: 'Your most recent I-94 from CBP',
    required: true,
    link: 'https://i94.cbp.dhs.gov',
    linkLabel: 'Get yours at cbp.dhs.gov',
    external: true,
  },
  {
    id: 'ssn-itin',
    name: 'SSN or ITIN',
    description: 'If you have one — required for 1040-NR filing',
    required: false,
    link: null,
  },
]

export function checklistItems(profile) {
  const filing = buildFilingItems(profile)
  return { filing, identity: IDENTITY_ITEMS, ids: [...filing, ...IDENTITY_ITEMS].map((i) => i.id) }
}
