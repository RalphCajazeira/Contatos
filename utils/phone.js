function digits(value) {
  return String(value || "").replace(/\D/g, "")
}

function normalizePhone(value) {
  return digits(value).slice(0, 11)
}

function formatBR(value) {
  const d = digits(value)

  if (!d) return ""
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7, 11)}`
}

module.exports = {
  digits,
  normalizePhone,
  formatBR,
}
