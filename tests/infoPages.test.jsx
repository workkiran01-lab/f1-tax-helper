// @vitest-environment jsdom
// The public guide, FAQ and treaty lookup: content comes from the reviewed season and treaty
// data, links only go to the app or official IRS pages, and unreviewed countries never read as
// "no treaty".
import React, { useEffect } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import App from '../src/App.jsx'
import TaxGuidePage from '../src/pages/TaxGuidePage.jsx'
import FaqPage from '../src/pages/FaqPage.jsx'
import TaxTreatiesPage from '../src/pages/TaxTreatiesPage.jsx'
import { RichText, linkKind } from '../src/components/info/RichText.jsx'
import { useRouteMeta } from '../src/hooks/useRouteMeta.js'
import { GUIDE_SECTIONS, FAQ_ITEMS } from '../src/data/guide.js'
import { DEADLINES, FORM_8843_MAILING, SOURCES } from '../src/data/taxSeason.js'
import { SITE_ORIGIN, PAGE_META } from '../src/data/site.js'

vi.mock('../src/utils/supabase', () => ({ default: null, authConfigured: false }))
afterEach(() => cleanup())

const at = (path, element, route = path.split('?')[0]) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={route} element={element} />
      </Routes>
    </MemoryRouter>,
  )

const hrefs = (root) => [...root.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'))
const external = (root) => hrefs(root).filter((h) => /^https?:/.test(h))

describe('RichText', () => {
  it('links only the app, the support address and official IRS pages', () => {
    expect(linkKind('/tax-guide#return')).toBe('app')
    expect(linkKind(SOURCES.nonresidentReturn)).toBe('irs')
    expect(linkKind('mailto:support@f1taxhelper.com')).toBe('mail')
    for (const bad of ['https://evil.example/x', 'http://www.irs.gov/x', 'https://irs.gov.evil.test/x', 'javascript:alert(1)', 'https://user:pw@www.irs.gov/x', '//evil.example'])
      expect(linkKind(bad), bad).toBe(null)
    const { container } = render(
      <MemoryRouter>
        <RichText text="See [IRS](https://www.irs.gov/forms-pubs/about-form-8843) and [bad](https://evil.example/x) and **bold**." />
      </MemoryRouter>,
    )
    expect(hrefs(container)).toEqual(['https://www.irs.gov/forms-pubs/about-form-8843'])
    expect(container.textContent).toContain('bad and')
    expect(container.querySelector('strong').textContent).toBe('bold')
    expect(container.querySelector('a').getAttribute('rel')).toBe('noopener noreferrer')
  })
})

describe('tax guide', () => {
  it('shows every section with a heading, and cites an IRS page for each section that makes a claim', () => {
    const { container } = at('/tax-guide', <TaxGuidePage />)
    expect(screen.getByRole('heading', { level: 1, name: /tax guide for f-1 students/i })).toBeTruthy()
    for (const section of GUIDE_SECTIONS) {
      expect(screen.getByRole('heading', { level: 2, name: section.title })).toBeTruthy()
      if (section.id !== 'limits') expect(section.sources.length, section.id).toBeGreaterThan(0)
    }
    expect(screen.getByRole('heading', { level: 2, name: 'Review log' })).toBeTruthy()
    for (const url of external(container)) expect(url, url).toMatch(/^https:\/\/www\.irs\.gov\//)
  })
  it('explains scholarships from Publication 519, with the 1040-NR limit and the 1042-S date', () => {
    const section = GUIDE_SECTIONS.find((x) => x.id === 'scholarships')
    const text = JSON.stringify(section.blocks)
    expect(text).toMatch(/candidate for a degree/)
    expect(text).toMatch(/room and board, travel/)
    expect(text).toMatch(/teaching, research or other services is taxable/)
    expect(text).toMatch(/residence of the payer/)
    expect(text).toMatch(/14%, or a lower treaty rate/)
    expect(text).toMatch(/This app does not prepare Form 1040-NR/)
    expect(section.blocks).toContainEqual({ type: 'dates', ids: ['form1042s'] })
    expect(section.sources.map((x) => x.url)).toEqual(
      expect.arrayContaining([SOURCES.pub519, SOURCES.scholarshipWithholding]),
    )
    // Never a promise that a scholarship is wholly tax-free.
    expect(text).not.toMatch(/scholarships? (is|are) (always )?(fully )?tax-free/i)
    expect(FAQ_ITEMS.find((x) => x.id === 'scholarship').a).toMatch(/\/tax-guide#scholarships/)
    // The Form 1042-S instructions: amounts exempt under section 117 are not reported.
    expect(text).toMatch(/tax-free as a qualified scholarship[^.]*is not reported/)
    expect(FAQ_ITEMS.find((x) => x.id === 'scholarship').a).toMatch(/US payer reports a US-source scholarship on Form 1042-S, leaving out the tax-free part/)
  })
  it('explains OPT and CPT pay, bank interest and a missed Form 8843 from IRS sources only', () => {
    const section = GUIDE_SECTIONS.find((x) => x.id === 'opt-cpt')
    const text = JSON.stringify(section.blocks)
    expect(text).toMatch(/usually engaged in a US trade or business when you perform personal services/)
    expect(text).toMatch(/This app does not prepare Form 1040-NR/)
    expect(text).toMatch(/does not apply once you become a resident for tax purposes/)
    expect(section.blocks).toContainEqual({ type: 'dates', ids: ['w2', 'return-wages'] })
    expect(section.sources.map((x) => x.url)).toEqual(
      expect.arrayContaining([SOURCES.pub519, SOURCES.fica, SOURCES.nonresidentTaxation]),
    )
    const faq = (id) => FAQ_ITEMS.find((x) => x.id === id).a
    expect(faq('opt-cpt')).toMatch(/does not prepare Form 1040-NR/)
    expect(faq('opt-cpt')).toMatch(/\/tax-guide#opt-cpt/)
    // Deposit interest only: Publication 519 chapter 3. Nothing about portfolio interest or
    // self-employment tax, which were not verified.
    expect(faq('bank-interest')).toMatch(/deposits with a US bank, savings institution or credit union is excluded/)
    expect(faq('bank-interest')).toMatch(/not connected with a US trade or business/)
    expect(faq('bank-interest')).toMatch(/does not prepare/)
    expect(faq('bank-interest')).not.toMatch(/portfolio|self-employment/i)
    // The substantial presence test page: no exclusion without a timely form, with one exception.
    expect(faq('missed-8843')).toMatch(/without a timely form you cannot exclude your days as an exempt individual/)
    expect(faq('missed-8843')).toMatch(/clear and convincing evidence/)
    expect(faq('missed-8843')).toContain(SOURCES.form8843)
    // Never a promise that filing late is free of consequences, and no invented late procedure.
    expect(faq('missed-8843')).not.toMatch(/no penalty|there is no consequence|just file it/i)
    // No hard-coded dates in these answers; dates come from taxSeason.js through the guide.
    for (const id of ['opt-cpt', 'bank-interest', 'missed-8843']) expect(faq(id)).not.toMatch(/(April|June) \d+/)
  })
  it('states that the app does not prepare Form 1040-NR, in the scope note and in the return step', () => {
    const { container } = at('/tax-guide', <TaxGuidePage />)
    const text = container.textContent
    expect(text.match(/does not prepare, file or e-file Form 1040-NR/g)?.length).toBeGreaterThanOrEqual(1)
    expect(text).toMatch(/What it does not do:.*Form 1040-NR/)
    expect(within(container.querySelector('#return')).getByText(/does not prepare, file or e-file Form 1040-NR/)).toBeTruthy()
  })
  it('takes dates and the mailing address from the reviewed season data', () => {
    const { container } = at('/tax-guide', <TaxGuidePage />)
    for (const d of DEADLINES.filter((x) => ['form8843-alone', 'w2', 'form1042s', 'return-wages', 'return-no-wages'].includes(x.id)))
      expect(container.textContent, d.id).toContain(d.date)
    expect(container.querySelector('address').textContent).toBe(FORM_8843_MAILING.standalone.join(''))
    expect(container.textContent).toContain('Austin, TX 73301')
    expect(container.textContent).toMatch(/Review log[\s\S]*November 16, 2026/)
  })
  it('warns that the 2026 tax year is still open until it ends', () => {
    const { container } = at('/tax-guide', <TaxGuidePage />)
    const open = new Date() < new Date(Date.UTC(2027, 0, 1))
    expect(/wait until December 31/.test(container.textContent)).toBe(open)
  })
})

describe('FAQ', () => {
  it('has a question and answer for each item, with safe links', () => {
    const { container } = at('/faq', <FaqPage />)
    expect(container.querySelectorAll('details')).toHaveLength(FAQ_ITEMS.length)
    for (const item of FAQ_ITEMS) expect(screen.getByText(item.q)).toBeTruthy()
    for (const url of external(container)) expect(url, url).toMatch(/^https:\/\/www\.irs\.gov\/|^mailto:support@f1taxhelper\.com$/)
  })
  it('answers the Form 1040-NR question plainly and keeps dates and address in step with the season data', () => {
    const { container } = at('/faq', <FaqPage />)
    const prepare = container.querySelector('#prepare-1040nr').textContent
    expect(prepare).toMatch(/No\. This app prepares Form 8843 only\. It does not prepare, file or e-file Form 1040-NR/)
    expect(container.querySelector('#when-due').textContent).toContain('Jun 15, 2027')
    expect(container.querySelector('#where-mail').textContent).toContain('Austin, TX 73301')
    expect(container.querySelector('#where-mail').textContent).toContain('November 15, 2026')
    expect(FORM_8843_MAILING.reviewed).toBe('2026-11-15')
  })
  it('does not tell students an SSN is required or that no income means no filing', () => {
    const all = FAQ_ITEMS.map((i) => i.a).join(' ')
    expect(all).not.toMatch(/SSN (is|are) required/i)
    expect(all).not.toMatch(/no income[^.]{0,40}(do not|don't) (have to )?file/i)
  })
})

describe('treaty lookup', () => {
  it('describes an unreviewed country as not reviewed, never as having no treaty', () => {
    const { container } = at('/tax-treaties?country=canada', <TaxTreatiesPage />)
    const panel = container.querySelector('[aria-labelledby="country-title"]')
    expect(panel.textContent).toContain('Canada')
    expect(panel.textContent).toContain('Not reviewed in this app')
    expect(panel.textContent).toContain('has not been reviewed in this app')
    expect(panel.textContent).toContain('does not mean no treaty exists')
    const claims = panel.textContent.replace('does not mean no treaty exists', '')
    expect(claims).not.toMatch(/no (income )?tax treaty|does not have a (tax )?treaty|no treaty (exists|applies)/i)
    expect(hrefs(panel)).toContain(SOURCES.treaties)
  })
  it('shows the reviewed text for a reviewed country', () => {
    const { container } = at('/tax-treaties?country=india', <TaxTreatiesPage />)
    const panel = container.querySelector('[aria-labelledby="country-title"]')
    expect(panel.textContent).toContain('Reviewed: treaty in effect')
    expect(panel.textContent).toContain('Article 21(2)')
    const nepal = at('/tax-treaties?country=nepal', <TaxTreatiesPage />).container.querySelector('[aria-labelledby="country-title"]')
    expect(nepal.textContent).toContain('not listed as a US income tax treaty partner in the IRS treaty directory')
  })
  it('finds a country by typing and then shows it', () => {
    const { container } = at('/tax-treaties', <TaxTreatiesPage />)
    fireEvent.change(screen.getByLabelText('Find your country'), { target: { value: 'cana' } })
    fireEvent.click(screen.getByRole('button', { name: 'Canada' }))
    expect(container.querySelector('#country-title').textContent).toBe('Canada')
    fireEvent.change(screen.getByLabelText('Find your country'), { target: { value: 'zzzz' } })
    expect(screen.getByText(/No country in the list matches/)).toBeTruthy()
  })
  it('ignores an unknown or hostile country parameter', () => {
    for (const q of ['nowhere', '__proto__', 'constructor']) {
      const { container, unmount } = at(`/tax-treaties?country=${q}`, <TaxTreatiesPage />)
      expect(container.querySelector('#country-title'), q).toBe(null)
      unmount()
    }
  })
  it('lists exactly the countries the app has reviewed', () => {
    const { container } = at('/tax-treaties', <TaxTreatiesPage />)
    const names = [...container.querySelectorAll('#reviewed-title + ul > li > p:first-child')].map((p) => p.textContent).sort()
    expect(names).toEqual(['China', 'Hungary', 'India', 'Nepal', 'Russia', 'South Korea'])
  })
})

describe('routes and page details', () => {
  function Probe() {
    useRouteMeta()
    const { pathname } = useLocation()
    return <p>{pathname}</p>
  }
  const canonical = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')
  it('keeps the canonical address and title in step with the page', () => {
    render(
      <MemoryRouter initialEntries={['/tax-guide']}>
        <Probe />
      </MemoryRouter>,
    )
    expect(canonical()).toBe(`${SITE_ORIGIN}/tax-guide`)
    expect(document.title).toBe(PAGE_META['/tax-guide'].title)
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content') ?? PAGE_META['/tax-guide'].description).toBe(PAGE_META['/tax-guide'].description)
    cleanup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <Probe />
      </MemoryRouter>,
    )
    expect(canonical()).toBe(`${SITE_ORIGIN}/`)
  })
  it('resets the description and title when you leave one of these pages', () => {
    let go
    function Nav() {
      go = useNavigate()
      return null
    }
    const description = () => document.head.querySelector('meta[name="description"]')?.getAttribute('content')
    const ogTitle = () => document.head.querySelector('meta[property="og:title"]')?.getAttribute('content')
    render(
      <MemoryRouter initialEntries={['/tax-treaties']}>
        <Probe />
        <Nav />
      </MemoryRouter>,
    )
    expect(description()).toBe(PAGE_META['/tax-treaties'].description)
    expect(ogTitle()).toBe(PAGE_META['/tax-treaties'].title)
    act(() => go('/faq'))
    expect(document.title).toBe(PAGE_META['/faq'].title)
    expect(description()).toBe(PAGE_META['/faq'].description)
    act(() => go('/taxes'))
    expect(document.title).toBe(PAGE_META['/'].title)
    expect(description()).toBe(PAGE_META['/'].description)
    expect(ogTitle()).toBe(PAGE_META['/'].title)
    expect(canonical()).toBe(`${SITE_ORIGIN}/taxes`)
  })
  it('does not overwrite a title that a page sets for itself', () => {
    let go
    function Nav() {
      go = useNavigate()
      return null
    }
    function Legal() {
      useEffect(() => {
        document.title = 'Privacy — F1 Tax Helper'
      }, [])
      return null
    }
    render(
      <MemoryRouter initialEntries={['/tax-guide']}>
        <Routes>
          <Route path="/privacy" element={<Legal />} />
          <Route path="*" element={null} />
        </Routes>
        <Probe />
        <Nav />
      </MemoryRouter>,
    )
    act(() => go('/privacy'))
    expect(document.title).toBe('Privacy — F1 Tax Helper')
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(PAGE_META['/'].description)
  })
  it('opens the new pages from the app, and /blog is the not-found page', async () => {
    window.history.pushState({}, '', '/blog')
    const { unmount } = render(<App />)
    expect(await screen.findByRole('heading', { name: /not found|page/i })).toBeTruthy()
    unmount()
    window.history.pushState({}, '', '/faq')
    render(<App />)
    expect(await screen.findByRole('heading', { level: 1, name: /frequently asked questions/i })).toBeTruthy()
    window.history.pushState({}, '', '/')
  })
})
