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

it('warns until the tax year has ended, and not afterwards', () => {
  const { unmount } = render(<MailingGuide year={2026} today={new Date('2026-11-15T12:00:00Z')} />)
  expect(screen.getByRole('note').textContent).toMatch(/2026 tax year is not over/)
  expect(screen.getByRole('note').textContent).toMatch(/wait until December 31/)
  expect(screen.getAllByRole('listitem')).toHaveLength(4)
  unmount()
  render(<MailingGuide year={2026} today={new Date('2027-01-02T12:00:00Z')} />)
  expect(screen.queryByRole('note')).toBeNull()
})
