import { PDFDocument } from 'pdf-lib'

const P1 = 'topmostSubform[0].Page1[0]'

function setText(form, fieldName, value) {
  try {
    const field = form.getTextField(fieldName)
    field.setText(value ?? '')
  } catch (e) {
    console.warn(`[form8843] skipping field "${fieldName}": ${e.message}`)
  }
}

export async function fillForm8843(pdfBytes, formData) {
  try {
    const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
    const form = pdf.getForm()

    const nameField = formData.middleInitial
      ? `${formData.firstName} ${formData.middleInitial}`
      : formData.firstName

    const stateZip = [formData.state, formData.zip].filter(Boolean).join(' ')

    const schoolCityLine = [
      formData.schoolCity,
      [formData.schoolState, formData.schoolZip].filter(Boolean).join(' '),
    ]
      .filter(Boolean)
      .join(', ')

    // Part I — General Information
    setText(form, `${P1}.f1_04[0]`, nameField)
    setText(form, `${P1}.f1_05[0]`, formData.lastName)
    setText(form, `${P1}.f1_06[0]`, formData.address)
    setText(form, `${P1}.f1_07[0]`, formData.city)
    setText(form, `${P1}.f1_08[0]`, stateZip)
    setText(form, `${P1}.f1_09[0]`, `F-1, ${formData.currentEntryDate}`)
    setText(form, `${P1}.f1_10[0]`, formData.country)

    // Part III — Students and Exchange Visitors (F-1)
    setText(form, `${P1}.f1_13[0]`, formData.schoolName)
    setText(form, `${P1}.f1_17[0]`, formData.schoolPhone)
    setText(form, `${P1}.f1_18[0]`, formData.schoolAddress)
    setText(form, `${P1}.f1_19[0]`, schoolCityLine)
    setText(form, `${P1}.f1_26[0]`, formData.dsoName)
    setText(form, `${P1}.f1_27[0]`, formData.dsoPhone)

    return await pdf.save()
  } catch (err) {
    console.error('[form8843] Failed to fill PDF:', err)
    throw err
  }
}
