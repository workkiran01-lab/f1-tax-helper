import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { buildNameField, buildUsAddress, buildSchoolLine, buildDsoLine } from './form8843Display.js'
import { canGenerate8843, FORM_8843_TEMPLATE_SHA256 } from '../data/taxSeason.js'
import { validate8843, visaYears } from './form8843Model.js'
const P1 = 'topmostSubform[0].Page1[0]'

export async function fillForm8843(pdfBytes, data, fontBytes) {
  if (!canGenerate8843(data.taxYear))
    throw new Error(
      'The final IRS Form 8843 for this tax year is not yet verified. Do not file a draft or a prior-year form.',
    )
  const errors = validate8843(data)
  if (Object.keys(errors).length)
    throw new Error('Please complete and review all required fields before downloading.')
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', pdfBytes)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('')
  if (digest !== FORM_8843_TEMPLATE_SHA256)
    throw new Error(
      'The PDF template has changed. Download is paused until its IRS year and field mapping are verified.',
    )
  const pdf = await PDFDocument.load(pdfBytes)
  pdf.registerFontkit(fontkit)
  const form = pdf.getForm()
  // Embed the app's font so entries print consistently across PDF viewers.
  // Subsetting converts the web font to a PDF-compatible font program. Include
  // the complete accepted input alphabet so fields remain editable in viewers.
  const font = await pdf.embedFont(fontBytes, { subset: true })
  font.encodeText(Array.from({ length: 95 }, (_, i) => String.fromCharCode(i + 32)).join(''))
  function text(id, value) {
    const field = form.getTextField(`${P1}.${id}[0]`)
    field.setText(String(value || '')) // Missing fields are fatal; never skip them.
    field.acroField.setDefaultAppearance(`/${font.name} 10 Tf 0 g`)
    if (['f1_07', 'f1_08', 'f1_26', 'f1_27', 'f1_34'].includes(id)) {
      field.enableMultiline()
      field.setFontSize(9)
      if (['f1_26', 'f1_27', 'f1_34'].includes(id)) {
        // The 2025 widget bounds place the default multiline baseline on the
        // printed guide. Raise the editable field slightly to keep text above it.
        const widget = field.acroField.getWidgets()[0]
        const rectangle = widget.getRectangle()
        widget.setRectangle({ ...rectangle, y: rectangle.y + 3 })
      }
    } else {
      const width = field.acroField.getWidgets()[0].getRectangle().width - 4
      const size = Math.min(10, width / Math.max(1, font.widthOfTextAtSize(String(value || ''), 1)))
      if (size < 7)
        throw new Error(
          'An entry is too long to fit legibly. Shorten the address or status description and review the form.',
        )
      field.setFontSize(size)
    }
  }
  // The calendar year is printed on this IRS form. f1_03 is the ENDING year for
  // a fiscal-year return, not the calendar-year label; leave all fiscal blanks empty.
  text('f1_04', buildNameField(data))
  text('f1_05', data.lastName)
  text('f1_06', data.tinOrSSN)
  text('f1_07', data.foreignAddress)
  text('f1_08', buildUsAddress(data))
  text('f1_09', `F-1, ${data.currentEntryDate}`)
  text('f1_10', data.currentImmigrationStatus)
  text('f1_11', data.countryOfCitizenship)
  text('f1_12', data.passportCountry)
  text('f1_13', data.passportNumber)
  text('f1_14', data.daysCurrent)
  text('f1_15', data.daysPrevious)
  text('f1_16', data.daysPrior)
  text('f1_17', data.daysToExclude)
  text('f1_26', buildSchoolLine(data))
  text('f1_27', buildDsoLine(data))
  visaYears(data.taxYear).forEach((year, i) =>
    text(
      `f1_${28 + i}`,
      data.visaHistory[year] === 'Changed'
        ? '*'
        : data.visaHistory[year] === 'None'
          ? ''
          : data.visaHistory[year][0],
    ),
  )
  for (const [id, answer] of [
    ['c1_2', data.line12Answer],
    ['c1_3', data.line13Answer],
  ]) {
    form.getCheckBox(`${P1}.${id}[0]`).uncheck()
    form.getCheckBox(`${P1}.${id}[1]`).uncheck()
    form.getCheckBox(`${P1}.${id}[${answer === 'yes' ? 0 : 1}]`).check()
  }
  text('f1_34', data.line13Answer === 'yes' ? 'See attached statement for Part III, line 14.' : '')
  const statements = [
    ['Part III, line 11 - Visa changes', data.visaChanges],
    [
      'Part III, line 12 - Continued student day exclusions',
      data.line12Answer === 'yes' ? data.line12Explanation : '',
    ],
    [
      'Part III, line 14 - Permanent-residence application',
      data.line13Answer === 'yes' ? data.line14Explanation : '',
    ],
  ].filter(([, value]) => value?.trim())
  for (const [title, value] of statements) {
    let page
    let y
    function addPage() {
      page = pdf.addPage([612, 792])
      y = 730
      page.drawText(`Form 8843 (${data.taxYear}) - Supporting statement`, {
        x: 48,
        y,
        size: 13,
        font,
      })
      y -= 25
      page.drawText(`${buildNameField(data)} ${data.lastName}`, { x: 48, y, size: 11, font })
      y -= 19
      if (data.tinOrSSN) {
        page.drawText(`TIN: ${data.tinOrSSN}`, { x: 48, y, size: 10, font })
        y -= 19
      }
      page.drawText(title, { x: 48, y, size: 11, font })
      y -= 28
    }
    addPage()
    for (const paragraph of value.split(/\r?\n/)) {
      let line = ''
      for (const word of paragraph.split(/\s+/)) {
        // Split long tokens too, so an unbroken reference cannot run off-page.
        for (const chunk of word.match(/.{1,60}/g) || ['']) {
          if (font.widthOfTextAtSize((line ? line + ' ' : '') + chunk, 10) > 510) {
            if (y < 60) addPage()
            page.drawText(line, { x: 48, y, size: 10, font, color: rgb(0, 0, 0) })
            y -= 15
            line = chunk
          } else line += (line ? ' ' : '') + chunk
        }
      }
      if (y < 60) addPage()
      page.drawText(line, { x: 48, y, size: 10, font })
      y -= 20
    }
  }
  form.updateFieldAppearances(font)
  return pdf.save()
}
