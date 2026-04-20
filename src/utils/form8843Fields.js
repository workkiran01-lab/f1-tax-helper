import { PDFDocument } from 'pdf-lib'

// Field positions verified via coordinate inspection of public/form8843.pdf
// y=696 (top row): f1_01=firstName, f1_02=lastName, f1_03=taxYear
// y=672 (address):  f1_04=street,   f1_05=city,     f1_06=state+zip
// y=612:            f1_07=countryOfCitizenship
// y=588:            f1_09=visaType
// y=540:            f1_12=firstEntryDate
// y=528 (Part III): f1_13=schoolName
// y=492:            f1_17=schoolPhone
// y=444:            f1_18=schoolStreet
// y=396:            f1_19=schoolCity,State,Zip
// y=264:            f1_26=dsoName
// y=216:            f1_27=dsoPhone
const P1 = 'topmostSubform[0].Page1[0]'

function setText(form, fieldName, value) {
  try {
    form.getTextField(fieldName).setText(value ?? '')
  } catch (e) {
    console.warn(`[form8843] skipping "${fieldName}": ${e.message}`)
  }
}

/**
 * Fill IRS Form 8843 with provided data.
 * @param {ArrayBuffer} pdfBytes  blank f8843.pdf bytes
 * @param {Object} formData
 */
export async function fillForm8843(pdfBytes, formData) {
  try {
    const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
    const form = pdf.getForm()

    const nameField = formData.middleInitial
      ? `${formData.firstName} ${formData.middleInitial}`
      : formData.firstName

    const stateZip = [formData.usState, formData.usZip].filter(Boolean).join(' ')

    const schoolCityLine = [
      formData.schoolCity,
      [formData.schoolState, formData.schoolZip].filter(Boolean).join(' '),
    ]
      .filter(Boolean)
      .join(', ')

    // ── Part I — General Information ─────────────────────────────────────
    setText(form, `${P1}.f1_01[0]`, nameField)
    setText(form, `${P1}.f1_02[0]`, formData.lastName)
    setText(form, `${P1}.f1_03[0]`, formData.taxYear || '2025')
    setText(form, `${P1}.f1_04[0]`, formData.usStreet)
    setText(form, `${P1}.f1_05[0]`, formData.usCity)
    setText(form, `${P1}.f1_06[0]`, stateZip)
    setText(form, `${P1}.f1_07[0]`, formData.countryOfCitizenship)
    setText(form, `${P1}.f1_09[0]`, `F-1, ${formData.currentEntryDate}`)
    setText(form, `${P1}.f1_12[0]`, formData.firstEntryDate)

    // ── Part III — Students and Exchange Visitors (F-1) ──────────────────
    setText(form, `${P1}.f1_13[0]`, formData.schoolName)
    setText(form, `${P1}.f1_17[0]`, formData.schoolPhone)
    setText(form, `${P1}.f1_18[0]`, formData.schoolStreet)
    setText(form, `${P1}.f1_19[0]`, schoolCityLine)
    setText(form, `${P1}.f1_26[0]`, formData.dsoName)
    setText(form, `${P1}.f1_27[0]`, formData.dsoPhone)

    return await pdf.save()
  } catch (err) {
    console.error('[form8843] Failed to fill PDF:', err)
    throw err
  }
}