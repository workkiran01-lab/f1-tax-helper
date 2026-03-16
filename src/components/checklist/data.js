export const SECTIONS = [
  {
    id: 'identity',
    title: 'Identity Documents',
    description: 'Proof of who you are and your F-1 visa status.',
    items: [
      {
        id: 'passport',
        name: 'Passport',
        description: 'Photo page of your valid passport.',
        details:
          'Your passport confirms your legal identity and citizenship. Tax forms and treaty benefits often depend on your country of residence.',
      },
      {
        id: 'f1-visa',
        name: 'F-1 Visa / I-20',
        description: 'Your current I-20 or F-1 visa documentation.',
        details:
          'Your I-20 and F-1 visa show you are a nonresident student for immigration purposes, which affects which tax forms you use (typically Form 1040-NR and Form 8843).',
      },
      {
        id: 'ssn-itin',
        name: 'SSN or ITIN',
        description: 'Social Security Number or Individual Taxpayer ID.',
        details:
          'The IRS uses your SSN or ITIN to match your income and tax filings. Most students with US income need one of these before filing.',
      },
    ],
  },
  {
    id: 'income',
    title: 'Income Documents',
    description: 'Records of money you earned in the US.',
    items: [
      {
        id: 'w2',
        name: 'Form W-2',
        description: 'Wage statement from on-campus or employer.',
        details:
          'Employers issue Form W-2 to report your salary and tax withheld. You usually receive one from each US employer by the end of January.',
      },
      {
        id: '1099',
        name: 'Form 1099',
        description: 'Freelance, contract, or other non-employee income.',
        details:
          'Form 1099 reports income such as contract work, rideshare, tutoring, or interest. This income is often not taxed in advance, so it matters for your final bill.',
      },
      {
        id: '1042s',
        name: 'Form 1042-S',
        description: 'Scholarships, fellowships, or treaty-based income.',
        details:
          'Form 1042-S reports income paid to nonresidents, including taxable scholarships and amounts covered by tax treaties. Many F-1 students receive this from their school.',
      },
      {
        id: 'bank-statements',
        name: 'Bank Statements',
        description: 'Interest or other income from US (and some foreign) accounts.',
        details:
          'Interest is sometimes taxable for nonresidents. Having your bank statements handy helps you answer questions about worldwide income accurately.',
      },
    ],
  },
  {
    id: 'education',
    title: 'Education Documents',
    description: 'Records from your university or college.',
    items: [
      {
        id: '1098t',
        name: 'Form 1098-T',
        description: 'Tuition statement from your school.',
        details:
          'Form 1098-T summarizes tuition and certain fees billed or paid. For many F-1 students it is informational, but it is still useful when completing tax software or working with an advisor.',
      },
      {
        id: 'scholarship-letters',
        name: 'Scholarship Letters',
        description: 'Award letters or grant notifications.',
        details:
          'These letters show how much scholarship or fellowship you received and whether it was for tuition, housing, or stipends—which can affect whether it is taxable.',
      },
      {
        id: 'enrollment-proof',
        name: 'Proof of Enrollment',
        description: 'Enrollment verification or transcript.',
        details:
          'Enrollment verification from your registrar confirms you were a full-time student on F-1 status, which is important for certain tax treaty and FICA exemptions.',
      },
    ],
  },
]

