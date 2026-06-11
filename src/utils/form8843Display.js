// String builders shared by the live preview (FormPreview.jsx) and the real
// PDF fill (form8843Fields.js) so the two can never disagree on how multi-part
// answers are concatenated onto a single IRS field.

export function buildNameField(formData) {
  return formData.middleInitial
    ? `${formData.firstName} ${formData.middleInitial}`
    : formData.firstName
}

export function buildUsAddress(formData) {
  const stateZip = [formData.usState, formData.usZip].filter(Boolean).join(' ')
  return [formData.usStreet, formData.usCity, stateZip].filter(Boolean).join(', ')
}

export function buildSchoolLine(formData) {
  const schoolCityLine = [
    formData.schoolCity,
    [formData.schoolState, formData.schoolZip].filter(Boolean).join(' '),
  ].filter(Boolean).join(', ')
  return [formData.schoolName, formData.schoolStreet, schoolCityLine, formData.schoolPhone]
    .filter(Boolean).join(', ')
}

export function buildDsoLine(formData) {
  const dsoCityLine = [
    formData.dsoCity,
    [formData.dsoState, formData.dsoZip].filter(Boolean).join(' '),
  ].filter(Boolean).join(', ')
  const dsoAddress = [formData.dsoStreet, dsoCityLine].filter(Boolean).join(', ')
  return [formData.dsoName, dsoAddress, formData.dsoPhone].filter(Boolean).join(', ')
}
