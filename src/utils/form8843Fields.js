import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// Field mapping verified against form8843.pdf coordinate dump (April 2026)
// Page size: 611.976 x 791.968 pts.  All y-coords are from bottom-left.
//
// Header:
//   f1_03  y:696  tax year last 2 digits  (maxLen=2)
//   f1_04  y:672  first name + middle initial
//   f1_05  y:672  last name
//   f1_06  y:672  TIN / SSN (optional, maxLen≈11)
//   f1_07  y:612  address in country of residence (optional, 50pt tall)
//   f1_08  y:612  address in the United States    (50pt tall)
//
// Part I:
//   f1_09  y:588  Line 1a  visa type + most recent entry date
//   f1_11  y:552  Line 2   citizenship country
//   f1_12  y:540  Line 3a  passport issuing country (optional)
//   f1_13  y:528  Line 3b  passport number         (optional)
//   f1_14  y:504  Line 4a  days present 2025       (optional)
//   f1_15  y:504  Line 4a  days present 2024       (optional)
//   f1_16  y:504  Line 4a  days present 2023       (optional)
//   f1_17  y:492  Line 4b  days excluded           (optional)
//
// Part III (F-1 students):
//   f1_26  y:264  Line 9   school name, address, phone (single combined field)
//   f1_27  y:216  Line 10  DSO name, address, phone    (optional, combined)
//   c1_2[0] x:511,y:170  Line 12 Yes checkbox
//   c1_2[1] x:547,y:170  Line 12 No  checkbox
//   c1_3[0] x:511,y:110  Line 13 Yes checkbox
//   c1_3[1] x:547,y:110  Line 13 No  checkbox
//   f1_34  y:72   Line 14  explanation (if yes on line 13)

const P1 = 'topmostSubform[0].Page1[0]'

function setText(form, fieldName, value) {
  try {
    form.getTextField(fieldName).setText(value ?? '')
  } catch (e) {
    console.warn(`[form8843] skipping "${fieldName}": ${e.message}`)
  }
}

export async function fillForm8843(pdfBytes, formData) {
  try {
    const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
    const form = pdf.getForm()
    const page = pdf.getPages()[0]
    const font = await pdf.embedFont(StandardFonts.Helvetica)

    // ── Derived values ────────────────────────────────────────────────────────
    const nameField = formData.middleInitial
      ? `${formData.firstName} ${formData.middleInitial}`
      : formData.firstName

    const stateZip = [formData.usState, formData.usZip].filter(Boolean).join(' ')
    const usAddress = [formData.usStreet, formData.usCity, stateZip].filter(Boolean).join(', ')

    const schoolCityLine = [
      formData.schoolCity,
      [formData.schoolState, formData.schoolZip].filter(Boolean).join(' '),
    ].filter(Boolean).join(', ')
    const schoolLine = [formData.schoolName, formData.schoolStreet, schoolCityLine, formData.schoolPhone]
      .filter(Boolean).join(', ')

    const dsoCityLine = [
      formData.dsoCity,
      [formData.dsoState, formData.dsoZip].filter(Boolean).join(' '),
    ].filter(Boolean).join(', ')
    const dsoAddress = [formData.dsoStreet, dsoCityLine].filter(Boolean).join(', ')
    const dsoLine = [formData.dsoName, dsoAddress, formData.dsoPhone].filter(Boolean).join(', ')

    // ── Header ────────────────────────────────────────────────────────────────
    setText(form, `${P1}.f1_03[0]`, String(formData.taxYear || '2025').slice(-2))
    setText(form, `${P1}.f1_04[0]`, nameField)
    setText(form, `${P1}.f1_05[0]`, formData.lastName)
    if (formData.tinOrSSN?.trim())       setText(form, `${P1}.f1_06[0]`, formData.tinOrSSN.trim())
    if (formData.foreignAddress?.trim()) setText(form, `${P1}.f1_07[0]`, formData.foreignAddress.trim())
    setText(form, `${P1}.f1_08[0]`, usAddress)

    // ── Part I ────────────────────────────────────────────────────────────────
    setText(form, `${P1}.f1_09[0]`, `F-1, ${formData.currentEntryDate}`)
    setText(form, `${P1}.f1_11[0]`, formData.countryOfCitizenship)
    if (formData.passportCountry?.trim()) setText(form, `${P1}.f1_12[0]`, formData.passportCountry.trim())
    if (formData.passportNumber?.trim())  setText(form, `${P1}.f1_13[0]`, formData.passportNumber.trim())
    if (formData.daysIn2025?.trim())      setText(form, `${P1}.f1_14[0]`, formData.daysIn2025.trim())
    if (formData.daysIn2024?.trim())      setText(form, `${P1}.f1_15[0]`, formData.daysIn2024.trim())
    if (formData.daysIn2023?.trim())      setText(form, `${P1}.f1_16[0]`, formData.daysIn2023.trim())
    if (formData.daysToExclude?.trim())   setText(form, `${P1}.f1_17[0]`, formData.daysToExclude.trim())

    // ── Part III ──────────────────────────────────────────────────────────────
    setText(form, `${P1}.f1_26[0]`, schoolLine)
    if (dsoLine) setText(form, `${P1}.f1_27[0]`, dsoLine)

    // Line 12 Yes/No checkboxes — drawn as "X" overlay
    // c1_2[0]=Yes at x:511,y:170   c1_2[1]=No at x:547,y:170
    if (formData.line12Answer) {
      const x = formData.line12Answer === 'yes' ? 513 : 549
      page.drawText('X', { x, y: 171, size: 7, font, color: rgb(0, 0, 0) })
    }

    // Line 13 Yes/No checkboxes
    // c1_3[0]=Yes at x:511,y:110   c1_3[1]=No at x:547,y:110
    if (formData.line13Answer) {
      const x = formData.line13Answer === 'yes' ? 513 : 549
      page.drawText('X', { x, y: 111, size: 7, font, color: rgb(0, 0, 0) })
    }

    // Line 14 — explanation when line 13 = Yes
    if (formData.line13Answer === 'yes' && formData.line14Explanation?.trim()) {
      setText(form, `${P1}.f1_34[0]`, formData.line14Explanation.trim())
    }

    return await pdf.save()
  } catch (err) {
    console.error('[form8843] Failed to fill PDF:', err)
    throw err
  }
}
