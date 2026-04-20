import { LegalLayout } from '../components/legal/LegalLayout'

const ABOUT_CONTENT = {
  title: 'About F1 Tax Helper',
  lastUpdated: 'April 2026',
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
      content: `We provide free Form 8843 generation and AI-powered tax guidance specifically designed for F-1 international students. We are not a CPA firm — we are a tool to help you understand your filing requirements.`,
    },
    {
      id: 'data-privacy',
      title: 'Data Privacy',
      content: `We take your privacy seriously. When you use our Form 8843 generator:

• Your data is never sent to our servers
• Everything stays in your browser session
• We do not store names, addresses, or dates
• Your information is wiped when you close the tab

For our chat feature, we only store your conversation to provide AI responses.`,
    },
    {
      id: 'contact',
      title: 'Contact',
      content: `Questions or feedback? Email us at work.kiran01@gmail.com

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
