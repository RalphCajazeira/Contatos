const crypto = require("crypto")
const db = require("../database/db")
const { normalizePhone } = require("../utils/phone")

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase()
}

function sortUsers(users) {
  return users.sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""), "pt-BR", {
      sensitivity: "base",
    }),
  )
}

function sortAvailableEmails(list) {
  return list.sort((a, b) =>
    normalizeEmail(a.email).localeCompare(normalizeEmail(b.email), "pt-BR", {
      sensitivity: "base",
    }),
  )
}

function sortAvailablePhones(list) {
  return list.sort((a, b) =>
    normalizePhone(a.number).localeCompare(normalizePhone(b.number), "pt-BR", {
      sensitivity: "base",
    }),
  )
}

function uniqueEmails(list) {
  const seen = new Set()
  return list.filter((item) => {
    const key = normalizeEmail(item.email)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function uniquePhones(list) {
  const seen = new Set()
  return list.filter((item) => {
    const key = normalizePhone(item.number)
    if (!key || seen.has(key)) return false
    seen.add(key)
    item.number = key
    return true
  })
}

function persistAndSend(res, data, payload) {
  data.users = sortUsers(data.users || [])
  data.availableEmails = sortAvailableEmails(
    uniqueEmails(data.availableEmails || []),
  )
  data.availablePhones = sortAvailablePhones(
    uniquePhones(data.availablePhones || []),
  )
  db.write(data)
  res.json(payload)
}

exports.getAll = (req, res) => {
  const data = db.read()
  data.users = sortUsers(data.users || [])
  data.availableEmails = sortAvailableEmails(
    uniqueEmails(data.availableEmails || []),
  )
  data.availablePhones = sortAvailablePhones(
    uniquePhones(data.availablePhones || []),
  )
  res.json(data)
}

exports.addUser = (req, res) => {
  const data = db.read()
  const name = String(req.body.name || "").trim()

  if (!name) {
    return res.status(400).json({ error: "Nome é obrigatório." })
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    emails: [],
    phones: [],
  }

  data.users.push(user)
  data.users = sortUsers(data.users)
  db.write(data)

  res.status(201).json(user)
}

exports.updateUser = (req, res) => {
  const data = db.read()
  const user = data.users.find((u) => u.id === req.params.id)

  if (!user) {
    return res.status(404).json({ error: "Contato não encontrado." })
  }

  const name = String(req.body.name || "").trim()
  if (!name) {
    return res.status(400).json({ error: "Nome é obrigatório." })
  }

  user.name = name
  data.users = sortUsers(data.users)
  db.write(data)

  res.json(user)
}

exports.deleteUser = (req, res) => {
  const data = db.read()
  const userIndex = data.users.findIndex((u) => u.id === req.params.id)

  if (userIndex === -1) {
    return res.status(404).json({ error: "Contato não encontrado." })
  }

  const user = data.users[userIndex]

  for (const email of user.emails || []) {
    if (email.type !== "pessoal") {
      data.availableEmails.push({ email: email.email })
    }
  }

  for (const phone of user.phones || []) {
    if (phone.type !== "pessoal") {
      data.availablePhones.push({ number: phone.number })
    }
  }

  data.users.splice(userIndex, 1)

  data.users = sortUsers(data.users)
  data.availableEmails = sortAvailableEmails(uniqueEmails(data.availableEmails))
  data.availablePhones = sortAvailablePhones(uniquePhones(data.availablePhones))

  db.write(data)
  res.sendStatus(204)
}

exports.addAvailableEmail = (req, res) => {
  const data = db.read()
  const email = normalizeEmail(req.body.email)

  if (!email) {
    return res.status(400).json({ error: "E-mail é obrigatório." })
  }

  const assigned = data.users.some((user) =>
    (user.emails || []).some((item) => normalizeEmail(item.email) === email),
  )
  if (assigned) {
    return res
      .status(409)
      .json({ error: "Este e-mail já está atribuído a um contato." })
  }

  const exists = (data.availableEmails || []).some(
    (item) => normalizeEmail(item.email) === email,
  )
  if (exists) {
    return res
      .status(409)
      .json({ error: "Este e-mail já está na lista de livres." })
  }

  data.availableEmails.push({ email })
  data.availableEmails = sortAvailableEmails(uniqueEmails(data.availableEmails))
  db.write(data)

  res.status(201).json({ email })
}

exports.addAvailablePhone = (req, res) => {
  const data = db.read()
  const number = normalizePhone(req.body.number)

  if (!number) {
    return res.status(400).json({ error: "Número é obrigatório." })
  }

  const assigned = data.users.some((user) =>
    (user.phones || []).some((item) => normalizePhone(item.number) === number),
  )
  if (assigned) {
    return res
      .status(409)
      .json({ error: "Este número já está atribuído a um contato." })
  }

  const exists = (data.availablePhones || []).some(
    (item) => normalizePhone(item.number) === number,
  )
  if (exists) {
    return res
      .status(409)
      .json({ error: "Este número já está na lista de livres." })
  }

  data.availablePhones.push({ number })
  data.availablePhones = sortAvailablePhones(uniquePhones(data.availablePhones))
  db.write(data)

  res.status(201).json({ number })
}

exports.assignEmail = (req, res) => {
  const data = db.read()
  const { userId, email, type, fromAvailable } = req.body

  const user = data.users.find((u) => u.id === userId)
  if (!user) {
    return res.status(404).json({ error: "Contato não encontrado." })
  }

  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) {
    return res.status(400).json({ error: "E-mail é obrigatório." })
  }

  const duplicateOnOtherUser = data.users.some(
    (u) =>
      u.id !== userId &&
      (u.emails || []).some(
        (item) => normalizeEmail(item.email) === normalizedEmail,
      ),
  )

  if (duplicateOnOtherUser) {
    return res
      .status(409)
      .json({ error: "Este e-mail já está em outro contato." })
  }

  const emailType = type === "principal" ? "principal" : "alternativo"

  if (fromAvailable) {
    const freeEmailIndex = data.availableEmails.findIndex(
      (item) => normalizeEmail(item.email) === normalizedEmail,
    )

    if (freeEmailIndex === -1) {
      return res
        .status(404)
        .json({ error: "E-mail não encontrado na lista de livres." })
    }

    data.availableEmails.splice(freeEmailIndex, 1)
  }

  if (emailType === "principal") {
    user.emails = (user.emails || []).map((item) => ({
      ...item,
      type: "alternativo",
    }))
  }

  user.emails = user.emails || []
  user.emails.push({
    email: normalizedEmail,
    type: emailType,
  })
  user.emails = uniqueEmails(user.emails)

  data.users = sortUsers(data.users)
  data.availableEmails = sortAvailableEmails(uniqueEmails(data.availableEmails))

  db.write(data)
  res.json(user)
}

exports.assignPhone = (req, res) => {
  const data = db.read()
  const { userId, number, type, fromAvailable } = req.body

  const user = data.users.find((u) => u.id === userId)
  if (!user) {
    return res.status(404).json({ error: "Contato não encontrado." })
  }

  const normalizedNumber = normalizePhone(number)
  if (!normalizedNumber) {
    return res.status(400).json({ error: "Número é obrigatório." })
  }

  const duplicateOnOtherUser = data.users.some(
    (u) =>
      u.id !== userId &&
      (u.phones || []).some(
        (item) => normalizePhone(item.number) === normalizedNumber,
      ),
  )

  if (duplicateOnOtherUser) {
    return res
      .status(409)
      .json({ error: "Este número já está em outro contato." })
  }

  const phoneType = type === "pessoal" ? "pessoal" : "dipedra"

  if (fromAvailable) {
    const freePhoneIndex = data.availablePhones.findIndex(
      (item) => normalizePhone(item.number) === normalizedNumber,
    )

    if (freePhoneIndex === -1) {
      return res
        .status(404)
        .json({ error: "Número não encontrado na lista de livres." })
    }

    data.availablePhones.splice(freePhoneIndex, 1)
  }

  user.phones = user.phones || []
  user.phones.push({
    number: normalizedNumber,
    type: phoneType,
  })
  user.phones = uniquePhones(user.phones)

  data.users = sortUsers(data.users)
  data.availablePhones = sortAvailablePhones(uniquePhones(data.availablePhones))

  db.write(data)
  res.json(user)
}

exports.removeEmail = (req, res) => {
  const data = db.read()
  const { userId, email } = req.body

  const user = data.users.find((u) => u.id === userId)
  if (!user) {
    return res.status(404).json({ error: "Contato não encontrado." })
  }

  const normalizedEmail = normalizeEmail(email)
  const found = (user.emails || []).find(
    (item) => normalizeEmail(item.email) === normalizedEmail,
  )

  if (!found) {
    return res.status(404).json({ error: "E-mail não encontrado no contato." })
  }

  user.emails = (user.emails || []).filter(
    (item) => normalizeEmail(item.email) !== normalizedEmail,
  )

  if (found.type !== "pessoal") {
    data.availableEmails.push({ email: normalizedEmail })
    data.availableEmails = sortAvailableEmails(
      uniqueEmails(data.availableEmails),
    )
  }

  db.write(data)
  res.json(user)
}

exports.removePhone = (req, res) => {
  const data = db.read()
  const { userId, number } = req.body

  const user = data.users.find((u) => u.id === userId)
  if (!user) {
    return res.status(404).json({ error: "Contato não encontrado." })
  }

  const normalizedNumber = normalizePhone(number)
  const found = (user.phones || []).find(
    (item) => normalizePhone(item.number) === normalizedNumber,
  )

  if (!found) {
    return res.status(404).json({ error: "Número não encontrado no contato." })
  }

  user.phones = (user.phones || []).filter(
    (item) => normalizePhone(item.number) !== normalizedNumber,
  )

  if (found.type !== "pessoal") {
    data.availablePhones.push({ number: normalizedNumber })
    data.availablePhones = sortAvailablePhones(
      uniquePhones(data.availablePhones),
    )
  }

  db.write(data)
  res.json(user)
}

exports.deleteAvailableEmail = (req, res) => {
  const data = db.read()
  const email = normalizeEmail(req.body.email)

  data.availableEmails = (data.availableEmails || []).filter(
    (item) => normalizeEmail(item.email) !== email,
  )

  db.write(data)
  res.sendStatus(204)
}

exports.deleteAvailablePhone = (req, res) => {
  const data = db.read()
  const number = normalizePhone(req.body.number)

  data.availablePhones = (data.availablePhones || []).filter(
    (item) => normalizePhone(item.number) !== number,
  )

  db.write(data)
  res.sendStatus(204)
}
