import { LegalLayout } from '../components/legal/LegalLayout'

// SEO meta description: "F1 Tax Helper Terms of Service — read the terms governing
// your use of our free tax guidance tool for F-1 international students."

const TERMS_CONTENT = {
  title: 'Terms of Service',
  lastUpdated: 'April 2026',
  intro:
    'Please read these Terms of Service carefully before using F1 Tax Helper. By accessing or using this service you agree to be bound by these terms.',
  sections: [
    {
      id: 'acceptance-of-terms',
      title: 'Acceptance of Terms',
      content:
        // Paste Termly "Acceptance of Terms" section here.
        `By creating an account or using any part of F1 Tax Helper, you confirm that you have read, understood, and agree to these Terms of Service and our Privacy Policy.

If you are using the service on behalf of an organization, you represent that you have authority to bind that organization to these terms.

If you do not agree to these terms, please do not access or use F1 Tax Helper.`,
    },
    {
      id: 'use-of-service',
      title: 'Use of Service',
      content:
        // Paste Termly "Use of Service" section here.
        `F1 Tax Helper grants you a limited, non-exclusive, non-transferable, revocable license to access and use the service for personal, non-commercial purposes.

You agree not to:
• Use the service for any unlawful purpose or in violation of any applicable law.
• Attempt to reverse engineer, decompile, or extract source code from the service.
• Introduce malware, bots, or automated scripts that disrupt service operation.
• Misrepresent your identity or impersonate another person.
• Resell, sublicense, or commercially exploit any part of the service.

We reserve the right to suspend or terminate accounts that violate these terms.`,
    },
    {
      id: 'no-professional-tax-advice',
      title: 'No Professional Tax Advice',
      content:
        // Paste Termly "No Professional Tax Advice / Disclaimer" section here.
        `F1 Tax Helper provides general tax information and educational guidance for F-1 international students. THIS IS NOT PROFESSIONAL TAX ADVICE.

IRS Disclaimer: The information provided by F1 Tax Helper is for general informational purposes only and does not constitute legal, tax, or financial advice. Nothing in this service creates a tax-professional-client relationship. The IRS requires that tax advice be provided only by qualified professionals, including licensed CPAs, enrolled agents, and tax attorneys.

Tax laws change frequently and vary based on individual circumstances, tax treaty eligibility, state of residence, and other factors. Always verify information with the IRS website (irs.gov) or consult a qualified tax professional before filing your return.

Use of this service does not guarantee accuracy of any tax filing or outcome.`,
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual Property',
      content:
        // Paste Termly "Intellectual Property" section here.
        `All content, features, and functionality of F1 Tax Helper — including but not limited to text, graphics, logos, icons, and software — are the exclusive property of F1 Tax Helper and are protected by applicable intellectual property laws.

You may not copy, reproduce, distribute, modify, or create derivative works of any part of the service without our prior written consent.

Any feedback, suggestions, or ideas you provide regarding the service may be used by us without obligation to you.`,
    },
    {
      id: 'limitation-of-liability',
      title: 'Limitation of Liability',
      content:
        // Paste Termly "Limitation of Liability" section here.
        `To the maximum extent permitted by applicable law, F1 Tax Helper and its creators, affiliates, and service providers shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, the service.

This includes, without limitation:
• Errors or inaccuracies in tax information provided.
• Any tax filing errors or penalties resulting from reliance on this service.
• Unauthorized access to or alteration of your data.
• Interruptions or cessation of the service.

Our total liability to you for any claim arising from your use of the service shall not exceed the amount you paid us in the twelve months preceding the claim (or $0 if you used the free tier).`,
    },
    {
      id: 'changes-to-terms',
      title: 'Changes to Terms',
      content:
        // Paste Termly "Changes to Terms" section here.
        `We may update these Terms of Service from time to time to reflect changes in our practices, technology, or applicable law.

When we make material changes, we will:
• Update the "Last Updated" date at the top of this page.
• Send a notification to your registered email address.

Your continued use of F1 Tax Helper after changes become effective constitutes your acceptance of the revised terms. If you do not agree to the updated terms, you must stop using the service.`,
    },
    {
      id: 'contact-us',
      title: 'Contact Us',
      content:
        `If you have questions about these Terms of Service, please contact us:

Email: f1taxhelper01@gmail.com

We aim to respond to all inquiries within 5 business days.`,
    },
  ],
}

export default function TermsPage() {
  return (
    <LegalLayout
      title={TERMS_CONTENT.title}
      lastUpdated={TERMS_CONTENT.lastUpdated}
      intro={TERMS_CONTENT.intro}
      sections={TERMS_CONTENT.sections}
    />
  )
}
