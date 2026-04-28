import { LegalLayout } from '../components/legal/LegalLayout'

// SEO meta description: "F1 Tax Helper Privacy Policy — learn what data we collect,
// how we use it, and your rights as a user."

const POLICY_CONTENT = {
  title: 'Privacy Policy',
  lastUpdated: 'April 2026',
  intro:
    'F1 Tax Helper is committed to protecting your privacy. This policy explains what personal data we collect, how we use it, and the choices you have.',
  sections: [
    {
      id: 'information-we-collect',
      title: 'Information We Collect',
      content:
        // Paste Termly "Information We Collect" section here.
        `We collect the following categories of personal information when you use F1 Tax Helper:

• Account information: your name and email address obtained via Google OAuth when you sign in.
• Questionnaire responses: answers you provide about your visa status, income sources, and tax situation, used to generate your personalized checklist.
• Usage data: pages visited and features used, collected in aggregate to improve the service.

We do not collect your Social Security Number, bank account details, or any other sensitive financial identifiers.`,
    },
    {
      id: 'how-we-use-your-information',
      title: 'How We Use Your Information',
      content:
        // Paste Termly "How We Use Your Information" section here.
        `Your information is used solely to provide and improve the F1 Tax Helper service:

• To authenticate you securely via Google Sign-In.
• To generate and store your personalized tax checklist based on your questionnaire answers.
• To power the AI chat assistant with context about your tax situation.
• To send you important service updates (not marketing emails).

We do not sell, rent, or share your personal data with third parties for advertising purposes.`,
    },
    {
      id: 'data-storage-security',
      title: 'Data Storage & Security',
      content:
        // Paste Termly "Data Storage & Security" section here.
        `Your data is stored securely using Supabase, a SOC 2–compliant cloud database provider. All data is encrypted in transit using TLS and encrypted at rest using AES-256.

We retain your data for as long as your account is active. You may request deletion at any time (see "Your Rights" below). We implement industry-standard access controls and monitor for unauthorized access.`,
    },
    {
      id: 'third-party-services',
      title: 'Third Party Services',
      content:
        // Paste Termly "Third Party Services" section here.
        `F1 Tax Helper uses the following third-party services, each with their own privacy policies:

• Google OAuth (authentication) — accounts.google.com
• Supabase (database and storage) — supabase.com
• Groq (AI chat completions) — groq.com
• Vercel (hosting) — vercel.com

We only share the minimum data necessary with each provider to operate the service. We do not use cookies for advertising or cross-site tracking.`,
    },
    {
      id: 'your-rights',
      title: 'Your Rights',
      content:
        // Paste Termly "Your Rights" section here.
        `Depending on your location, you may have the following rights regarding your personal data:

• Access: request a copy of the data we hold about you.
• Correction: ask us to correct inaccurate information.
• Deletion: request that we delete your account and all associated data.
• Portability: request your data in a machine-readable format.

To exercise any of these rights, email us at f1taxhelper01@gmail.com. We will respond within 7 business days. We do not discriminate against users who exercise their privacy rights.`,
    },
    {
      id: 'contact-us',
      title: 'Contact Us',
      content:
        `If you have any questions or concerns about this Privacy Policy, please contact us:

Email: f1taxhelper01@gmail.com

We aim to respond to all privacy inquiries within 5 business days.`,
    },
  ],
}

export default function PrivacyPage() {
  return (
    <LegalLayout
      title={POLICY_CONTENT.title}
      lastUpdated={POLICY_CONTENT.lastUpdated}
      intro={POLICY_CONTENT.intro}
      sections={POLICY_CONTENT.sections}
    />
  )
}
