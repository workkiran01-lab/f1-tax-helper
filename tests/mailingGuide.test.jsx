// @vitest-environment jsdom
import React from 'react'
import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import MailingGuide from '../src/components/form8843/MailingGuide.jsx'
import { FORM_8843_MAILING, SOURCES } from '../src/data/taxSeason.js'

afterEach(cleanup)

it('lists the steps, the reviewed IRS address and the source link', () => {
  render(<MailingGuide year={2025} />)
  expect(screen.getByRole('heading', { name: 'Print, sign and mail' })).toBeTruthy()
  expect(screen.getAllByRole('listitem')).toHaveLength(4)
  expect(screen.getByText(/June 15, 2026/)).toBeTruthy()
  // Signing applies only to a standalone filing (IRS: "Sign here only if you are filing this form by itself").
  expect(screen.getByText(/Filing it by itself\? Sign and mail/)).toBeTruthy()
  expect(screen.getByText(/Do not sign the form/)).toBeTruthy()
  expect(screen.queryByText(/not valid for filing/)).toBeNull()
  expect(screen.getByText('Austin, TX 73301')).toBeTruthy()
  const link = screen.getByRole('link', { name: /Check the IRS address/ })
  expect(link.getAttribute('href')).toBe(SOURCES.whereToFile)
  expect(link.getAttribute('rel')).toContain('noopener')
  expect(FORM_8843_MAILING.reviewed).toBe('2026-11-15')
})
