// Content for the public tax guide and FAQ. Every date, address and source comes from
// src/data/taxSeason.js, so the pages cannot drift from the app's reviewed season data, and
// each section lists the IRS pages it rests on. When a rule changes, update taxSeason.js and
// the sentence here together, then add a REVIEW_LOG entry.
import {
  TAX_YEAR,
  FILING_YEAR,
  SOURCES,
  DEADLINE_NOTE,
  FORM_8843_MAILING,
  deadlineDate,
} from './taxSeason.js'
import { SUPPORT_EMAIL, formatDate } from './site.js'

export const CONTENT_REVIEWED = '2026-11-16'

const src = (label, key) => ({ label, url: SOURCES[key] })

export const GUIDE_INTRO = `A plain-language walk through the ${FILING_YEAR} filing season, which covers income earned in ${TAX_YEAR}. It follows IRS sources, linked in each section. It is general information, not tax or legal advice, and it does not cover every situation.`

export const GUIDE_SCOPE =
  '**What this app does:** fills in Form 8843 in your browser, gives a first status check, keeps a document checklist and answers questions in chat. **What it does not do:** prepare, file or e-file Form 1040-NR or any state return, or send anything to the IRS.'

// Blocks: p (text), ul (items), dates (ids from DEADLINES), mailing, yearOpen, note (text),
// cta ({to, label}).
export const GUIDE_SECTIONS = [
  {
    id: 'status',
    title: 'Step 1: Check whether you are a nonresident for tax purposes',
    blocks: [
      {
        type: 'p',
        text: 'Students on F, J, M or Q visas are usually treated as nonresidents for tax purposes in their first years in the US. Days spent as an exempt individual do not count toward the substantial presence test, the IRS test that decides whether you are a resident for tax purposes.',
      },
      {
        type: 'p',
        text: 'The student exemption has a limit. You are generally not an exempt student if you were an exempt individual (as a teacher, trainee, student, exchange visitor or cultural exchange visitor on an F, J, M or Q visa) for any part of more than 5 calendar years. Any part of a calendar year counts, so a year in which you arrived late still counts as a year.',
      },
      {
        type: 'p',
        text: 'Past that limit, or after a change of status, your days may count and you could be a resident for tax purposes. The IRS describes an exception for students who can show they do not intend to reside permanently in the US and who have complied with their visa. Whether it applies to you needs a careful review, so this app asks you to get one instead of guessing.',
      },
      {
        type: 'p',
        text: 'The [status check](/status-checker) gives a first screen. It cannot settle sixth-year or changed-status cases.',
      },
    ],
    sources: [
      src('Substantial presence test', 'presence'),
      src('Exempt individual who is a student', 'student'),
      src("Determining an individual's tax residency status", 'residencyStatus'),
      src('Closer connection exception for foreign students', 'closerConnectionStudents'),
    ],
  },
  {
    id: 'form-8843',
    title: 'Step 2: File Form 8843 to exclude your days',
    blocks: [
      {
        type: 'p',
        text: 'Form 8843, Statement for Exempt Individuals and Individuals With a Medical Condition, is how an exempt individual tells the IRS which days to exclude when applying the substantial presence test. The IRS says that if you qualify to exclude days as a student, you must file a fully completed Form 8843.',
      },
      {
        type: 'ul',
        items: [
          '**No US income and no other return:** mail Form 8843 by itself.',
          '**You also file Form 1040-NR:** attach Form 8843 to that return. Do not sign the form or fill in its addresses in that case; the IRS says to do that only when filing it by itself.',
          '**Timing matters:** the exclusion generally depends on filing Form 8843 by the due date of your return. Without a timely form, the days cannot be excluded unless you show by clear and convincing evidence that you took reasonable steps to comply.',
        ],
      },
      { type: 'dates', ids: ['form8843-alone'] },
      { type: 'p', text: 'A standalone Form 8843 is mailed to:' },
      { type: 'mailing' },
      { type: 'yearOpen' },
      { type: 'cta', to: '/form-8843', label: 'Prepare Form 8843' },
    ],
    sources: [
      src('About Form 8843', 'form8843'),
      src('Where to file forms beginning with the number 8', 'whereToFile'),
      src('Exempt individual who is a student', 'student'),
      src('Substantial presence test', 'presence'),
    ],
  },
  {
    id: 'documents',
    title: 'Step 3: Gather your income documents',
    blocks: [
      {
        type: 'p',
        text: `Which forms you receive depends on how you were paid. Expected dates for the ${FILING_YEAR} season:`,
      },
      { type: 'dates', ids: ['w2', 'form1042s'] },
      {
        type: 'ul',
        items: [
          '**Form W-2** reports wages from an employer, for example a campus job.',
          '**Form 1042-S** reports US-source income paid to a foreign person, such as a scholarship or fellowship, and any treaty exemption claimed. Box 2 shows gross income, which is not always taxable income; check the exemption code and ask the payer if something looks wrong.',
          '**Form 1099-INT** may report bank interest. Certain interest paid to nonresidents is exempt, and a small amount on the form does not by itself decide whether it is taxable.',
        ],
      },
    ],
    sources: [
      src('Instructions for Form 1042-S', 'form1042s'),
      src('Foreign students, scholars, teachers, researchers and exchange visitors', 'foreignStudents'),
      src('Withholding on scholarships and fellowships paid to nonresident aliens', 'scholarshipWithholding'),
    ],
  },
  {
    id: 'return',
    title: 'Step 4: Work out whether you need Form 1040-NR',
    blocks: [
      {
        type: 'p',
        text: 'Form 1040-NR is the income tax return for nonresident aliens. Whether you must file depends on your US income, how it is taxed and whether tax was withheld; some income is exempt, for example under a tax treaty. The "Who must file" part of the Form 1040-NR instructions is the place to check, or ask a qualified preparer.',
      },
      { type: 'dates', ids: ['return-wages', 'return-no-wages'] },
      {
        type: 'note',
        tone: 'important',
        text: '**This app does not prepare, file or e-file Form 1040-NR**, or any state return. It can point you to the forms to look at. To prepare the return itself, use the IRS instructions, your school\'s international student office, or a qualified tax preparer or software built for nonresidents. The "Filing options" list in My Taxes names some third-party services to compare.',
      },
    ],
    sources: [
      src('Instructions for Form 1040-NR', 'nonresidentReturn'),
      src('Taxation of nonresident aliens', 'nonresidentTaxation'),
      src('Publication 519, U.S. Tax Guide for Aliens', 'pub519'),
    ],
  },
  {
    id: 'scholarships',
    title: 'Scholarships and fellowships',
    blocks: [
      {
        type: 'p',
        text: 'A scholarship or fellowship can be partly tax-free and partly taxable. If you are a candidate for a degree, the part used for tuition and fees, and for the fees, books, supplies and equipment your courses require, is generally tax-free. The part used for room and board, travel or other expenses is taxable.',
      },
      {
        type: 'p',
        text: 'The part that pays you for teaching, research or other services is taxable, even if every student in your program must do that work. It is treated like pay, not like a scholarship.',
      },
      {
        type: 'p',
        text: 'As a nonresident you are generally taxed only on US-source income. The source of a scholarship generally follows the residence of the payer: a grant from a US university or organization for study in the US is US source, while one from a foreign government or company is foreign source. A grant for activities outside the US is not US source.',
      },
      {
        type: 'ul',
        items: [
          '**Withholding:** the payer generally withholds 14%, or a lower treaty rate, from the taxable part of a US-source scholarship paid to an F, J, M or Q student; 30% applies in some other cases. The part that pays for services is withheld on like wages.',
          '**Form 1042-S:** the payer reports a US-source scholarship and any tax withheld on Form 1042-S. The IRS instructions say the part that is tax-free as a qualified scholarship (tuition and required course costs) is not reported on it, so a tuition-only award may not come with one. Box 2 shows gross income, which is not always taxable income.',
          '**Treaties:** some tax treaties exempt scholarship income. You claim reduced withholding by giving the payer Form W-8BEN, or Form 8233 if you also claim a treaty exemption for pay from the same payer. Whether a treaty applies depends on its terms; [look up your country](/tax-treaties).',
          '**A taxable scholarship can mean a return:** whether you must file Form 1040-NR depends on your US income and withholding; see [Step 4](/tax-guide#return). This app does not prepare Form 1040-NR.',
        ],
      },
      { type: 'dates', ids: ['form1042s'] },
    ],
    sources: [
      src('Publication 519, U.S. Tax Guide for Aliens', 'pub519'),
      src('Withholding on scholarships and fellowships paid to nonresident aliens', 'scholarshipWithholding'),
      src('Instructions for Form 1042-S', 'form1042s'),
      src('Taxation of nonresident aliens', 'nonresidentTaxation'),
    ],
  },
  {
    id: 'fica',
    title: 'Social Security and Medicare tax (FICA)',
    blocks: [
      {
        type: 'p',
        text: 'Nonresident students on F-1, J-1 or M-1 status are generally exempt from Social Security and Medicare tax on wages for work that US immigration rules allow and that is closely tied to the purpose of the visa, such as on-campus work, work authorized off campus and practical training. The exemption does not cover F-2, J-2 or M-2 spouses and children, and it changes if you become a resident for tax purposes.',
      },
      {
        type: 'p',
        text: 'If these taxes were withheld in error, ask your employer for a refund first. If you cannot get a full refund, the IRS describes filing Form 843 (Claim for Refund and Request for Abatement) together with Form 8316, with supporting documents.',
      },
    ],
    sources: [
      src('Foreign student liability for Social Security and Medicare taxes', 'fica'),
      src('About Form 843', 'form843'),
    ],
  },
  {
    id: 'treaties',
    title: 'Tax treaties',
    blocks: [
      {
        type: 'p',
        text: "Some countries have an income tax treaty with the US that can reduce or exempt tax on certain student income. Your country of citizenship alone does not decide it: your residence before you arrived, the purpose and length of your stay, the type of income and the treaty's saving clause all matter.",
      },
      {
        type: 'p',
        text: 'Form 8833 is not required for every treaty claim; many student, trainee and scholarship claims fall under a disclosure exception, so check the IRS instructions. Forms 8233 and W-8BEN are given to the payer to claim reduced withholding. They are not attachments to your return.',
      },
      {
        type: 'p',
        text: 'This app has reviewed treaty notes for only a few countries. [Look up your country](/tax-treaties). Not reviewed does not mean there is no treaty.',
      },
    ],
    sources: [
      src('United States income tax treaties, A to Z', 'treaties'),
      src('Tax treaty tables', 'treatyTables'),
      src('Claiming tax treaty benefits', 'treatyDisclosure'),
      src('Publication 901, U.S. Tax Treaties', 'pub901'),
    ],
  },
  {
    id: 'state',
    title: 'State taxes',
    blocks: [
      {
        type: 'p',
        text: "State income tax rules are separate from federal rules and differ by state. This app does not cover state returns. The IRS lists each state's tax agency on its State government websites page.",
      },
    ],
    sources: [src('State government websites', 'stateLinks')],
  },
  {
    id: 'limits',
    title: 'What this app does not do',
    blocks: [
      {
        type: 'ul',
        items: [
          'It does not prepare, file or e-file Form 1040-NR or any other return.',
          'It does not submit anything to the IRS. You print, sign and mail Form 8843 yourself.',
          'It does not decide residency for sixth-year students, changes of status or other complex histories; it tells you to get a review.',
          'It does not cover state returns.',
          'Its treaty notes cover a few countries; every other country is marked not reviewed.',
          'It gives educational information, not tax or legal advice.',
        ],
      },
    ],
    sources: [],
  },
]

export const REVIEW_LOG = [
  {
    date: '2026-11-16',
    text: 'Added the scholarships and fellowships section and its FAQ answer, checked against Publication 519 (chapters 2, 3 and 8), the Form 1042-S instructions and the IRS page on withholding on scholarships paid to nonresident aliens.',
  },
  {
    date: '2026-11-16',
    text: "Guide, FAQ and treaty lookup published. Every IRS link in the app was checked; the treaty directory link was corrected after the IRS moved that page.",
  },
  {
    date: '2026-11-15',
    text: 'The 2026 Form 8843 was enabled after the IRS posted the final form. The standalone mailing address was reviewed against the IRS where-to-file page.',
  },
  {
    date: '2026-09-07',
    text: 'Treaty guidance corrected: scholarship exemptions and Form 8833 requirements had been overstated, and the India standard deduction amounts were fixed. Countries not yet reviewed are marked as needing review, not as having no treaty.',
  },
]

const mailing = FORM_8843_MAILING.standalone.join(', ')

// FAQ answers use the same text rules as the guide: [label](/path or IRS address) and **bold**.
export const FAQ_ITEMS = [
  {
    id: 'no-income',
    q: 'Do I have to file anything if I had no income?',
    a: `If you were an exempt student and want to exclude your days from the substantial presence test, the IRS says to file Form 8843, even without income. With no US income and no other return to file, mail it by itself. That is generally the only form. [Prepare Form 8843](/form-8843).`,
  },
  {
    id: 'when-due',
    q: 'When is Form 8843 due?',
    a: `For ${TAX_YEAR}, the expected date for a form filed by itself is ${deadlineDate('form8843-alone')}. If you attach it to Form 1040-NR, it follows that return: ${deadlineDate('return-wages')} if you had wages subject to US income tax withholding, otherwise ${deadlineDate('return-no-wages')}. ${DEADLINE_NOTE}`,
  },
  {
    id: 'where-mail',
    q: 'Where do I mail a standalone Form 8843?',
    a: `${mailing}. That is what the IRS [where-to-file page](${SOURCES.whereToFile}) listed when this app last checked (${formatDate(FORM_8843_MAILING.reviewed)}). Addresses change, so confirm it on the form instructions or the IRS page before you mail. If you attach the form to Form 1040-NR, mail both together to the address in the return instructions.`,
  },
  {
    id: 'sign',
    q: 'Do I sign Form 8843?',
    a: 'Sign and date it only when you file it by itself. If you attach it to Form 1040-NR, do not sign it or fill in its addresses; the IRS says to do that only when filing it by itself.',
  },
  {
    id: 'ssn',
    q: 'Do I need an SSN or ITIN to file Form 8843?',
    a: 'The form asks for your US taxpayer identification number "if any", so you do not need one just for Form 8843. Never type an SSN or passport number into the chat. The Form 8843 tool fills the PDF in your browser.',
  },
  {
    id: 'prepare-1040nr',
    q: 'Can F1 Tax Helper prepare or file my Form 1040-NR?',
    a: `No. This app prepares Form 8843 only. It does not prepare, file or e-file Form 1040-NR or any state return. Start with the [Form 1040-NR instructions](${SOURCES.nonresidentReturn}), your school's international student office or a qualified tax preparer. The [guide](/tax-guide#return) explains when a return is needed.`,
  },
  {
    id: 'scholarship',
    q: 'Is my scholarship taxable?',
    a: 'Often only part of it is. If you are a degree candidate, the part used for tuition, required fees, books, supplies and equipment is generally tax-free. The part used for room, board or travel is taxable, and so is any part that pays you for teaching or research. As a nonresident you are generally taxed only on US-source scholarships; one from a foreign government or company is generally foreign source. A US payer reports a US-source scholarship on Form 1042-S, leaving out the tax-free part for tuition and required course costs. The [guide](/tax-guide#scholarships) explains withholding and treaties.',
  },
  {
    id: 'fica',
    q: 'Do I owe Social Security and Medicare tax on my campus job?',
    a: `Nonresident F-1 students are generally exempt on wages for work allowed by their status. If it was withheld, ask your employer for a refund first; the [IRS page](${SOURCES.fica}) explains the next steps.`,
  },
  {
    id: 'treaty',
    q: 'Does my country have a tax treaty that helps students?',
    a: 'Use the [treaty lookup](/tax-treaties). It shows the notes this app has reviewed. If your country is marked not reviewed, that does not mean there is no treaty: check the IRS directory.',
  },
  {
    id: 'sixth-year',
    q: 'I have been in the US for more than five years. What changes?',
    a: 'The student exemption generally ends once you have been an exempt individual for any part of more than 5 calendar years. After that your days may count toward the substantial presence test, so you could be a resident for tax purposes. The IRS describes an exception for some students; it needs a careful review. The [status check](/status-checker) will ask you to get one.',
  },
  {
    id: 'privacy',
    q: 'What happens to the information I type?',
    a: 'The Form 8843 tool fills the PDF in your browser and does not upload your entries. Chat messages are sent to our server and to Groq, the AI provider, so keep SSNs, passport numbers and addresses out of the chat. The app also keeps five anonymous daily counts, such as how many people downloaded the form. Details are in the [privacy policy](/privacy).',
  },
  {
    id: 'free',
    q: 'Is F1 Tax Helper free, and is this tax advice?',
    a: 'It is free to use. It gives general educational information, not tax or legal advice; see the [disclaimer](/disclaimer).',
  },
  {
    id: 'wrong',
    q: 'I think something here is wrong.',
    a: `Please tell us at [${SUPPORT_EMAIL}](mailto:${SUPPORT_EMAIL}) with the page and the IRS source you are looking at. Corrections are recorded in the [review log](/tax-guide#review-log).`,
  },
]
