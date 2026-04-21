import { PDFDocument } from 'pdf-lib'

// Field mapping verified by visual inspection of test_filled.pdf (April 2026)
//
// Header row:
//   f1_01/f1_02 = non-calendar year period dates (blank for calendar-year filers)
//   f1_03       = tax year last 2 digits (maxLen=2)  e.g. "25"
//   f1_04       = First name + middle initial
//   f1_05       = Last name
//   f1_06       = TIN (maxLen=11) — left blank (F-1 students have no SSN requirement)
//   f1_07       = Address in country of residence (optional)
//   f1_08       = Address in the United States (combined street, city, state, zip)
//
// Part I:
//   f1_09       = Line 1a: visa type + most recent entry date  e.g. "F-1, 08/15/2022"
//   f1_10       = Line 1b: current nonimmigrant status (optional)
//   f1_11       = Line 2:  citizenship country
//   f1_12       = Line 3a: passport-issuing country (optional)
//   f1_13       = Line 3b: passport number (optional)
//   f1_14–16    = Line 4a: days present 2025/2024/2023 (optional)
//   f1_17       = Line 4b: days excluded (optional)
//
// Part II (Teachers/Trainees — NOT used for F-1 students):
//   f1_18       = Line 5: teacher institution info
//   f1_19       = Line 6: trainee director info
//   f1_20–25    = Line 7: visa type per year 2019–2024 (maxLen=1 each)
//
// Part III (Students — F-1 filers complete this):
//   f1_26       = Line 9:  school name, address, phone (single combined field)
//   f1_27       = Line 10: program director info (optional for F-1)
//   f1_28–33    = Line 11: visa type per year 2019–2024 (maxLen=1 each)
//   c1_2[0/1]  = Line 12: Yes/No checkbox
//   c1_3[0/1]  = Line 13: Yes/No checkbox
//   f1_34       = Line 14: explanation if yes on line 13

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

    // First name + middle initial (goes in first-name box)
    const nameField = formData.middleInitial
      ? `${formData.firstName} ${formData.middleInitial}`
      : formData.firstName

    // US address combined for the single address-in-US box
    const stateZip = [formData.usState, formData.usZip].filter(Boolean).join(' ')
    const usAddress = [formData.usStreet, formData.usCity, stateZip]
      .filter(Boolean)
      .join(', ')

    // School info combined for Part III Line 9 (single text field)
    const schoolCityLine = [
      formData.schoolCity,
      [formData.schoolState, formData.schoolZip].filter(Boolean).join(' '),
    ]
      .filter(Boolean)
      .join(', ')

    const schoolLine = [
      formData.schoolName,
      formData.schoolStreet,
      schoolCityLine,
      formData.schoolPhone,
    ]
      .filter(Boolean)
      .join(', ')

    // ── Header ────────────────────────────────────────────────────────────────
    setText(form, `${P1}.f1_03[0]`, String(formData.taxYear || '2025').slice(-2)) // "25"
    setText(form, `${P1}.f1_04[0]`, nameField)
    setText(form, `${P1}.f1_05[0]`, formData.lastName)
    setText(form, `${P1}.f1_08[0]`, usAddress)

    // ── Part I — General Information ──────────────────────────────────────────
    setText(form, `${P1}.f1_09[0]`, `F-1, ${formData.currentEntryDate}`)
    setText(form, `${P1}.f1_11[0]`, formData.countryOfCitizenship)

    // ── Part III — Students (F-1) ─────────────────────────────────────────────
    setText(form, `${P1}.f1_26[0]`, schoolLine)

    return await pdf.save()
  } catch (err) {
    console.error('[form8843] Failed to fill PDF:', err)
    throw err
  }
}
