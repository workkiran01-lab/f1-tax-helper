import { LegalLayout } from '../components/legal/LegalLayout'

const ABOUT_CONTENT = {
  title: 'About F1 Tax Helper',
  lastUpdated: 'November 2026',
  intro: 'Built by an international student, for international students.',
  sections: [
    {
      id: 'our-story',
      title: 'Our Story',
      content: `F1 Tax Helper was created after experiencing firsthand how confusing and expensive US tax filing is for F-1 students. Most tax software charges $50–100+ for non-resident returns. We believe filing Form 8843 should always be free.`,
    },
    {
      id: 'what-we-do',
      title: 'What We Do',
      content: `We provide a free Form 8843 tool, a first-screen status check, a document checklist and an AI chat for F-1 international students. We are not a CPA firm, and we give general educational information, not tax or legal advice.

**We do not prepare, file or e-file Form 1040-NR or state returns, and we submit nothing to the IRS.** The [tax guide](/tax-guide) explains when you need a return and where to start, and the [FAQ](/faq) answers common questions with IRS sources.`,
    },
    {
      id: 'data-privacy',
      title: 'Data Privacy',
      content: `The Form 8843 tool fills the PDF in your browser. Your entries are kept in the browser tab and are not uploaded by the form tool, and they are cleared when you close the tab.

Messages you type into the AI chat are sent to our server and to Groq, our AI provider, so please keep SSNs, passport numbers and addresses out of the chat. Chat history and checklist progress stay in your browser. If you sign in, your name, email and saved questionnaire answers are stored with Supabase. The app also keeps five anonymous daily counts, such as how many people downloaded the form.

The [privacy policy](/privacy) has the full details.`,
    },
    {
      id: 'contact',
      title: 'Contact',
      content: `Questions or feedback? Email us at support@f1taxhelper.com

We typically respond within 2 business days.`,
    },
  ],
}

export default function AboutPage() {
  return (
    <LegalLayout
      title={ABOUT_CONTENT.title}
      lastUpdated={ABOUT_CONTENT.lastUpdated}
      intro={ABOUT_CONTENT.intro}
      sections={ABOUT_CONTENT.sections}
    />
  )
}
