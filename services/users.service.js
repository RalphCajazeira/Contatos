const crypto = require("crypto")
const db = require("../database/db")
const { normalizePhone } = require("../utils/phone")

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase()
}

function nowIso() {
  return new Date().toISOString()
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

    item.email = key
    seen.add(key)
    return true
  })
}

function uniquePhones(list) {
  const seen = new Set()

  return list.filter((item) => {
    const key = normalizePhone(item.number)
    if (!key || seen.has(key)) return false

    item.number = key
    seen.add(key)
    return true
  })
}

function createHistoryEntry({
  entityType,
  entityValue,
  action,
  fromUserId = null,
  fromUserName = null,
  toUserId = null,
  toUserName = null,
  metadata = {},
}) {
  return {
    id: crypto.randomUUID(),
    entityType,
    entityValue,
    action,
    fromUserId,
    fromUserName,
    toUserId,
    toUserName,
    changedAt: nowIso(),
    metadata,
  }
}

function normalizeUser(user) {
  return {
    id: user.id,
    name: String(user.name || "").trim(),
    active: user.active !== false,
    inactivatedAt: user.inactivatedAt || null,
    emails: Array.isArray(user.emails)
      ? user.emails.map((item) => ({
          email: normalizeEmail(item.email),
          type:
            item.type === "principal"
              ? "principal"
              : item.type === "pessoal"
                ? "pessoal"
                : item.type === "alias"
                  ? "alias"
                  : "alternativo",
        }))
      : [],
    phones: Array.isArray(user.phones)
      ? user.phones.map((item) => ({
          number: normalizePhone(item.number),
          type: item.type === "pessoal" ? "pessoal" : "dipedra",
        }))
      : [],
  }
}

function normalizeAvailableEmail(item) {
  return {
    email: normalizeEmail(item.email),
    type: item.type === "alias" ? "alias" : "principal",
    lastUserId: item.lastUserId || null,
    lastUserName: item.lastUserName || null,
    releasedAt: item.releasedAt || null,
  }
}

function normalizeAvailablePhone(item) {
  return {
    number: normalizePhone(item.number),
    type: "dipedra",
    lastUserId: item.lastUserId || null,
    lastUserName: item.lastUserName || null,
    releasedAt: item.releasedAt || null,
  }
}

function readData() {
  const data = db.read()

  data.users = Array.isArray(data.users) ? data.users.map(normalizeUser) : []

  data.availableEmails = Array.isArray(data.availableEmails)
    ? data.availableEmails.map(normalizeAvailableEmail)
    : []

  data.availablePhones = Array.isArray(data.availablePhones)
    ? data.availablePhones.map(normalizeAvailablePhone)
    : []

  data.history = Array.isArray(data.history) ? data.history : []

  return data
}

function persist(data) {
  data.users = sortUsers(data.users || [])
  data.availableEmails = sortAvailableEmails(
    uniqueEmails(data.availableEmails || []),
  )
  data.availablePhones = sortAvailablePhones(
    uniquePhones(data.availablePhones || []),
  )
  data.history = Array.isArray(data.history) ? data.history : []

  db.write(data)
  return data
}

function getAll() {
  const data = readData()
  return persist(data)
}

function addHistory(data, entry) {
  data.history = Array.isArray(data.history) ? data.history : []
  data.history.unshift(entry)
}

function addUser({ name }) {
  const data = readData()
  const parsedName = String(name || "").trim()

  if (!parsedName) {
    const error = new Error("Nome é obrigatório.")
    error.status = 400
    throw error
  }

  const user = {
    id: crypto.randomUUID(),
    name: parsedName,
    active: true,
    inactivatedAt: null,
    emails: [],
    phones: [],
  }

  data.users.push(user)

  addHistory(
    data,
    createHistoryEntry({
      entityType: "contact",
      entityValue: parsedName,
      action: "created",
      toUserId: user.id,
      toUserName: user.name,
    }),
  )

  persist(data)

  return user
}

function updateUser({ id, name }) {
  const data = readData()
  const user = data.users.find((u) => u.id === id)

  if (!user) {
    const error = new Error("Contato não encontrado.")
    error.status = 404
    throw error
  }

  const parsedName = String(name || "").trim()

  if (!parsedName) {
    const error = new Error("Nome é obrigatório.")
    error.status = 400
    throw error
  }

  const previousName = user.name
  user.name = parsedName

  addHistory(
    data,
    createHistoryEntry({
      entityType: "contact",
      entityValue: parsedName,
      action: "renamed",
      toUserId: user.id,
      toUserName: user.name,
      metadata: {
        previousName,
        newName: parsedName,
      },
    }),
  )

  persist(data)

  return user
}

function deleteUser({ id }) {
  const data = readData()
  const userIndex = data.users.findIndex((u) => u.id === id)

  if (userIndex === -1) {
    const error = new Error("Contato não encontrado.")
    error.status = 404
    throw error
  }

  const user = data.users[userIndex]

  for (const email of user.emails || []) {
    if (email.type !== "pessoal") {
      data.availableEmails.push({
        email: email.email,
        type: email.type === "alias" ? "alias" : "principal",
        lastUserId: user.id,
        lastUserName: user.name,
        releasedAt: nowIso(),
      })

      addHistory(
        data,
        createHistoryEntry({
          entityType: email.type === "alias" ? "alias" : "email",
          entityValue: email.email,
          action: "released_on_delete",
          fromUserId: user.id,
          fromUserName: user.name,
        }),
      )
    }
  }

  for (const phone of user.phones || []) {
    if (phone.type !== "pessoal") {
      data.availablePhones.push({
        number: phone.number,
        type: "dipedra",
        lastUserId: user.id,
        lastUserName: user.name,
        releasedAt: nowIso(),
      })

      addHistory(
        data,
        createHistoryEntry({
          entityType: "phone",
          entityValue: phone.number,
          action: "released_on_delete",
          fromUserId: user.id,
          fromUserName: user.name,
        }),
      )
    }
  }

  addHistory(
    data,
    createHistoryEntry({
      entityType: "contact",
      entityValue: user.name,
      action: "deleted",
      fromUserId: user.id,
      fromUserName: user.name,
    }),
  )

  data.users.splice(userIndex, 1)
  persist(data)
}

function addAvailableEmail({ email, type }) {
  const data = readData()
  const normalizedEmail = normalizeEmail(email)
  const emailType = type === "alias" ? "alias" : "principal"

  if (!normalizedEmail) {
    const error = new Error("E-mail é obrigatório.")
    error.status = 400
    throw error
  }

  const assigned = data.users.some((user) =>
    (user.emails || []).some(
      (item) => normalizeEmail(item.email) === normalizedEmail,
    ),
  )

  if (assigned) {
    const error = new Error("Este e-mail já está atribuído a um contato.")
    error.status = 409
    throw error
  }

  const exists = (data.availableEmails || []).some(
    (item) => normalizeEmail(item.email) === normalizedEmail,
  )

  if (exists) {
    const error = new Error("Este e-mail já está na lista de livres.")
    error.status = 409
    throw error
  }

  const freeEmail = {
    email: normalizedEmail,
    type: emailType,
    lastUserId: null,
    lastUserName: null,
    releasedAt: null,
  }

  data.availableEmails.push(freeEmail)

  addHistory(
    data,
    createHistoryEntry({
      entityType: emailType === "alias" ? "alias" : "email",
      entityValue: normalizedEmail,
      action: "created_as_available",
    }),
  )

  persist(data)

  return freeEmail
}

function addAvailablePhone({ number }) {
  const data = readData()
  const normalizedNumber = normalizePhone(number)

  if (!normalizedNumber) {
    const error = new Error("Número é obrigatório.")
    error.status = 400
    throw error
  }

  const assigned = data.users.some((user) =>
    (user.phones || []).some(
      (item) => normalizePhone(item.number) === normalizedNumber,
    ),
  )

  if (assigned) {
    const error = new Error("Este número já está atribuído a um contato.")
    error.status = 409
    throw error
  }

  const exists = (data.availablePhones || []).some(
    (item) => normalizePhone(item.number) === normalizedNumber,
  )

  if (exists) {
    const error = new Error("Este número já está na lista de livres.")
    error.status = 409
    throw error
  }

  const freePhone = {
    number: normalizedNumber,
    type: "dipedra",
    lastUserId: null,
    lastUserName: null,
    releasedAt: null,
  }

  data.availablePhones.push(freePhone)

  addHistory(
    data,
    createHistoryEntry({
      entityType: "phone",
      entityValue: normalizedNumber,
      action: "created_as_available",
    }),
  )

  persist(data)

  return freePhone
}

function assignEmail({ userId, email, type, fromAvailable }) {
  const data = readData()
  const user = data.users.find((u) => u.id === userId)

  if (!user) {
    const error = new Error("Contato não encontrado.")
    error.status = 404
    throw error
  }

  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail) {
    const error = new Error("E-mail é obrigatório.")
    error.status = 400
    throw error
  }

  const duplicateOnOtherUser = data.users.some(
    (u) =>
      u.id !== userId &&
      (u.emails || []).some(
        (item) => normalizeEmail(item.email) === normalizedEmail,
      ),
  )

  if (duplicateOnOtherUser) {
    const error = new Error("Este e-mail já está em outro contato.")
    error.status = 409
    throw error
  }

  const emailType =
    type === "principal"
      ? "principal"
      : type === "pessoal"
        ? "pessoal"
        : type === "alias"
          ? "alias"
          : "alternativo"

  let previousAvailableItem = null

  if (fromAvailable) {
    const freeEmailIndex = data.availableEmails.findIndex(
      (item) => normalizeEmail(item.email) === normalizedEmail,
    )

    if (freeEmailIndex === -1) {
      const error = new Error("E-mail não encontrado na lista de livres.")
      error.status = 404
      throw error
    }

    previousAvailableItem = data.availableEmails[freeEmailIndex]
    data.availableEmails.splice(freeEmailIndex, 1)
  }

  if (emailType === "principal") {
    user.emails = (user.emails || []).map((item) => ({
      ...item,
      type: item.type === "principal" ? "alternativo" : item.type,
    }))
  }

  user.emails = user.emails || []
  user.emails.push({
    email: normalizedEmail,
    type: emailType,
  })
  user.emails = uniqueEmails(user.emails)

  addHistory(
    data,
    createHistoryEntry({
      entityType: emailType === "alias" ? "alias" : "email",
      entityValue: normalizedEmail,
      action: fromAvailable ? "assigned_from_available" : "assigned",
      toUserId: user.id,
      toUserName: user.name,
      metadata: previousAvailableItem
        ? {
            previousAvailableLastUserId: previousAvailableItem.lastUserId,
            previousAvailableLastUserName: previousAvailableItem.lastUserName,
            previousReleasedAt: previousAvailableItem.releasedAt,
          }
        : {},
    }),
  )

  persist(data)

  return user
}

function assignPhone({ userId, number, type, fromAvailable }) {
  const data = readData()
  const user = data.users.find((u) => u.id === userId)

  if (!user) {
    const error = new Error("Contato não encontrado.")
    error.status = 404
    throw error
  }

  const normalizedNumber = normalizePhone(number)

  if (!normalizedNumber) {
    const error = new Error("Número é obrigatório.")
    error.status = 400
    throw error
  }

  const duplicateOnOtherUser = data.users.some(
    (u) =>
      u.id !== userId &&
      (u.phones || []).some(
        (item) => normalizePhone(item.number) === normalizedNumber,
      ),
  )

  if (duplicateOnOtherUser) {
    const error = new Error("Este número já está em outro contato.")
    error.status = 409
    throw error
  }

  const phoneType = type === "pessoal" ? "pessoal" : "dipedra"

  let previousAvailableItem = null

  if (fromAvailable) {
    const freePhoneIndex = data.availablePhones.findIndex(
      (item) => normalizePhone(item.number) === normalizedNumber,
    )

    if (freePhoneIndex === -1) {
      const error = new Error("Número não encontrado na lista de livres.")
      error.status = 404
      throw error
    }

    previousAvailableItem = data.availablePhones[freePhoneIndex]
    data.availablePhones.splice(freePhoneIndex, 1)
  }

  user.phones = user.phones || []
  user.phones.push({
    number: normalizedNumber,
    type: phoneType,
  })
  user.phones = uniquePhones(user.phones)

  addHistory(
    data,
    createHistoryEntry({
      entityType: "phone",
      entityValue: normalizedNumber,
      action: fromAvailable ? "assigned_from_available" : "assigned",
      toUserId: user.id,
      toUserName: user.name,
      metadata: previousAvailableItem
        ? {
            previousAvailableLastUserId: previousAvailableItem.lastUserId,
            previousAvailableLastUserName: previousAvailableItem.lastUserName,
            previousReleasedAt: previousAvailableItem.releasedAt,
          }
        : {},
    }),
  )

  persist(data)

  return user
}

function removeEmail({ userId, email }) {
  const data = readData()
  const user = data.users.find((u) => u.id === userId)

  if (!user) {
    const error = new Error("Contato não encontrado.")
    error.status = 404
    throw error
  }

  const normalizedEmail = normalizeEmail(email)
  const found = (user.emails || []).find(
    (item) => normalizeEmail(item.email) === normalizedEmail,
  )

  if (!found) {
    const error = new Error("E-mail não encontrado no contato.")
    error.status = 404
    throw error
  }

  user.emails = (user.emails || []).filter(
    (item) => normalizeEmail(item.email) !== normalizedEmail,
  )

  if (found.type !== "pessoal") {
    data.availableEmails.push({
      email: normalizedEmail,
      type: found.type === "alias" ? "alias" : "principal",
      lastUserId: user.id,
      lastUserName: user.name,
      releasedAt: nowIso(),
    })
  }

  addHistory(
    data,
    createHistoryEntry({
      entityType: found.type === "alias" ? "alias" : "email",
      entityValue: normalizedEmail,
      action: "removed",
      fromUserId: user.id,
      fromUserName: user.name,
    }),
  )

  persist(data)

  return user
}

function removePhone({ userId, number }) {
  const data = readData()
  const user = data.users.find((u) => u.id === userId)

  if (!user) {
    const error = new Error("Contato não encontrado.")
    error.status = 404
    throw error
  }

  const normalizedNumber = normalizePhone(number)
  const found = (user.phones || []).find(
    (item) => normalizePhone(item.number) === normalizedNumber,
  )

  if (!found) {
    const error = new Error("Número não encontrado no contato.")
    error.status = 404
    throw error
  }

  user.phones = (user.phones || []).filter(
    (item) => normalizePhone(item.number) !== normalizedNumber,
  )

  if (found.type !== "pessoal") {
    data.availablePhones.push({
      number: normalizedNumber,
      type: "dipedra",
      lastUserId: user.id,
      lastUserName: user.name,
      releasedAt: nowIso(),
    })
  }

  addHistory(
    data,
    createHistoryEntry({
      entityType: "phone",
      entityValue: normalizedNumber,
      action: "removed",
      fromUserId: user.id,
      fromUserName: user.name,
    }),
  )

  persist(data)

  return user
}

function deleteAvailableEmail({ email }) {
  const data = readData()
  const normalizedEmail = normalizeEmail(email)

  data.availableEmails = (data.availableEmails || []).filter(
    (item) => normalizeEmail(item.email) !== normalizedEmail,
  )

  addHistory(
    data,
    createHistoryEntry({
      entityType: "email",
      entityValue: normalizedEmail,
      action: "deleted_from_available",
    }),
  )

  persist(data)
}

function deleteAvailablePhone({ number }) {
  const data = readData()
  const normalizedNumber = normalizePhone(number)

  data.availablePhones = (data.availablePhones || []).filter(
    (item) => normalizePhone(item.number) !== normalizedNumber,
  )

  addHistory(
    data,
    createHistoryEntry({
      entityType: "phone",
      entityValue: normalizedNumber,
      action: "deleted_from_available",
    }),
  )

  persist(data)
}

function inactivateUser({ id }) {
  const data = readData()
  const user = data.users.find((u) => u.id === id)

  if (!user) {
    const error = new Error("Contato não encontrado.")
    error.status = 404
    throw error
  }

  if (user.active === false) {
    const error = new Error("Contato já está inativo.")
    error.status = 409
    throw error
  }

  const companyEmails = (user.emails || []).filter(
    (item) => item.type !== "pessoal",
  )
  const personalEmails = (user.emails || []).filter(
    (item) => item.type === "pessoal",
  )

  const companyPhones = (user.phones || []).filter(
    (item) => item.type !== "pessoal",
  )
  const personalPhones = (user.phones || []).filter(
    (item) => item.type === "pessoal",
  )

  for (const email of companyEmails) {
    data.availableEmails.push({
      email: normalizeEmail(email.email),
      type: email.type === "alias" ? "alias" : "principal",
      lastUserId: user.id,
      lastUserName: user.name,
      releasedAt: nowIso(),
    })

    addHistory(
      data,
      createHistoryEntry({
        entityType: email.type === "alias" ? "alias" : "email",
        entityValue: email.email,
        action: "released_on_inactivate",
        fromUserId: user.id,
        fromUserName: user.name,
      }),
    )
  }

  for (const phone of companyPhones) {
    data.availablePhones.push({
      number: normalizePhone(phone.number),
      type: "dipedra",
      lastUserId: user.id,
      lastUserName: user.name,
      releasedAt: nowIso(),
    })

    addHistory(
      data,
      createHistoryEntry({
        entityType: "phone",
        entityValue: phone.number,
        action: "released_on_inactivate",
        fromUserId: user.id,
        fromUserName: user.name,
      }),
    )
  }

  user.emails = personalEmails
  user.phones = personalPhones
  user.active = false
  user.inactivatedAt = nowIso()

  addHistory(
    data,
    createHistoryEntry({
      entityType: "contact",
      entityValue: user.name,
      action: "inactivated",
      fromUserId: user.id,
      fromUserName: user.name,
    }),
  )

  persist(data)

  return user
}

function reactivateUser({ id }) {
  const data = readData()
  const user = data.users.find((u) => u.id === id)

  if (!user) {
    const error = new Error("Contato não encontrado.")
    error.status = 404
    throw error
  }

  if (user.active !== false) {
    const error = new Error("Contato já está ativo.")
    error.status = 409
    throw error
  }

  user.active = true
  user.inactivatedAt = null

  addHistory(
    data,
    createHistoryEntry({
      entityType: "contact",
      entityValue: user.name,
      action: "reactivated",
      toUserId: user.id,
      toUserName: user.name,
    }),
  )

  persist(data)

  return user
}

function sortHistory(history) {
  return [...history].sort((a, b) => {
    const aTime = new Date(a.changedAt || 0).getTime()
    const bTime = new Date(b.changedAt || 0).getTime()
    return bTime - aTime
  })
}

function getHistory({ entityType, entityValue, limit }) {
  const data = readData()
  let history = Array.isArray(data.history) ? data.history : []

  if (entityType) {
    history = history.filter((item) => item.entityType === entityType)
  }

  if (entityValue) {
    const normalizedValue =
      entityType === "phone"
        ? normalizePhone(entityValue)
        : normalizeEmail(entityValue)

    history = history.filter((item) => {
      const currentValue =
        item.entityType === "phone"
          ? normalizePhone(item.entityValue)
          : normalizeEmail(item.entityValue)

      return currentValue === normalizedValue
    })
  }

  history = sortHistory(history)

  if (limit) {
    history = history.slice(0, Number(limit))
  }

  return history
}

function getEmailHistory({ email, limit }) {
  const normalizedEmail = normalizeEmail(email)

  const history = getHistory({
    limit,
  })

  return history.filter((item) => {
    if (!["email", "alias"].includes(item.entityType)) return false
    return normalizeEmail(item.entityValue) === normalizedEmail
  })
}

function getPhoneHistory({ number, limit }) {
  const normalizedNumber = normalizePhone(number)

  const history = getHistory({
    entityType: "phone",
    entityValue: normalizedNumber,
    limit,
  })

  return history
}

function getAliasHistory({ email, limit }) {
  const normalizedEmail = normalizeEmail(email)

  const history = getHistory({
    entityType: "alias",
    entityValue: normalizedEmail,
    limit,
  })

  return history
}

function transferEmail({ fromUserId, toUserId, email, targetType }) {
  const data = readData()

  const fromUser = data.users.find((u) => u.id === fromUserId)
  const toUser = data.users.find((u) => u.id === toUserId)

  if (!fromUser) {
    const error = new Error("Contato de origem não encontrado.")
    error.status = 404
    throw error
  }

  if (!toUser) {
    const error = new Error("Contato de destino não encontrado.")
    error.status = 404
    throw error
  }

  if (fromUser.id === toUser.id) {
    const error = new Error("Origem e destino não podem ser o mesmo contato.")
    error.status = 400
    throw error
  }

  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail) {
    const error = new Error("E-mail é obrigatório.")
    error.status = 400
    throw error
  }

  const found = (fromUser.emails || []).find(
    (item) => normalizeEmail(item.email) === normalizedEmail,
  )

  if (!found) {
    const error = new Error("E-mail não encontrado no contato de origem.")
    error.status = 404
    throw error
  }

  const duplicateOnDestination = (toUser.emails || []).some(
    (item) => normalizeEmail(item.email) === normalizedEmail,
  )

  if (duplicateOnDestination) {
    const error = new Error("Este e-mail já existe no contato de destino.")
    error.status = 409
    throw error
  }

  const finalType =
    targetType === "principal"
      ? "principal"
      : targetType === "pessoal"
        ? "pessoal"
        : targetType === "alias"
          ? "alias"
          : found.type

  fromUser.emails = (fromUser.emails || []).filter(
    (item) => normalizeEmail(item.email) !== normalizedEmail,
  )

  if (finalType === "principal") {
    toUser.emails = (toUser.emails || []).map((item) => ({
      ...item,
      type: item.type === "principal" ? "alternativo" : item.type,
    }))
  }

  toUser.emails = toUser.emails || []
  toUser.emails.push({
    email: normalizedEmail,
    type: finalType,
  })
  toUser.emails = uniqueEmails(toUser.emails)

  addHistory(
    data,
    createHistoryEntry({
      entityType: finalType === "alias" ? "alias" : "email",
      entityValue: normalizedEmail,
      action: "transferred",
      fromUserId: fromUser.id,
      fromUserName: fromUser.name,
      toUserId: toUser.id,
      toUserName: toUser.name,
      metadata: {
        previousType: found.type,
        newType: finalType,
      },
    }),
  )

  persist(data)

  return {
    fromUser,
    toUser,
  }
}

function transferPhone({ fromUserId, toUserId, number, targetType }) {
  const data = readData()

  const fromUser = data.users.find((u) => u.id === fromUserId)
  const toUser = data.users.find((u) => u.id === toUserId)

  if (!fromUser) {
    const error = new Error("Contato de origem não encontrado.")
    error.status = 404
    throw error
  }

  if (!toUser) {
    const error = new Error("Contato de destino não encontrado.")
    error.status = 404
    throw error
  }

  if (fromUser.id === toUser.id) {
    const error = new Error("Origem e destino não podem ser o mesmo contato.")
    error.status = 400
    throw error
  }

  const normalizedNumber = normalizePhone(number)

  if (!normalizedNumber) {
    const error = new Error("Número é obrigatório.")
    error.status = 400
    throw error
  }

  const found = (fromUser.phones || []).find(
    (item) => normalizePhone(item.number) === normalizedNumber,
  )

  if (!found) {
    const error = new Error("Número não encontrado no contato de origem.")
    error.status = 404
    throw error
  }

  const duplicateOnDestination = (toUser.phones || []).some(
    (item) => normalizePhone(item.number) === normalizedNumber,
  )

  if (duplicateOnDestination) {
    const error = new Error("Este número já existe no contato de destino.")
    error.status = 409
    throw error
  }

  const finalType = targetType === "pessoal" ? "pessoal" : "dipedra"

  fromUser.phones = (fromUser.phones || []).filter(
    (item) => normalizePhone(item.number) !== normalizedNumber,
  )

  toUser.phones = toUser.phones || []
  toUser.phones.push({
    number: normalizedNumber,
    type: finalType,
  })
  toUser.phones = uniquePhones(toUser.phones)

  addHistory(
    data,
    createHistoryEntry({
      entityType: "phone",
      entityValue: normalizedNumber,
      action: "transferred",
      fromUserId: fromUser.id,
      fromUserName: fromUser.name,
      toUserId: toUser.id,
      toUserName: toUser.name,
      metadata: {
        previousType: found.type,
        newType: finalType,
      },
    }),
  )

  persist(data)

  return {
    fromUser,
    toUser,
  }
}

function getActiveUsers() {
  const data = readData()

  return data.users.filter((user) => user.active !== false)
}

function getInactiveUsers() {
  const data = readData()

  return data.users.filter((user) => user.active === false)
}

function getUserById({ id }) {
  const data = readData()
  const user = data.users.find((u) => u.id === id)

  if (!user) {
    const error = new Error("Contato não encontrado.")
    error.status = 404
    throw error
  }

  return user
}

function getSummary() {
  const data = readData()

  const activeUsers = data.users.filter((u) => u.active !== false)
  const inactiveUsers = data.users.filter((u) => u.active === false)

  const totalEmailsInUse = data.users.reduce(
    (sum, user) => sum + (user.emails || []).length,
    0,
  )

  const totalPhonesInUse = data.users.reduce(
    (sum, user) => sum + (user.phones || []).length,
    0,
  )

  return {
    totalUsers: data.users.length,
    activeUsers: activeUsers.length,
    inactiveUsers: inactiveUsers.length,
    availableEmails: data.availableEmails.length,
    availablePhones: data.availablePhones.length,
    emailsInUse: totalEmailsInUse,
    phonesInUse: totalPhonesInUse,
  }
}

module.exports = {
  getAll,
  getHistory,
  getEmailHistory,
  getPhoneHistory,
  getAliasHistory,
  getActiveUsers,
  getInactiveUsers,
  getUserById,
  getSummary,
  addUser,
  updateUser,
  deleteUser,
  inactivateUser,
  reactivateUser,
  addAvailableEmail,
  addAvailablePhone,
  assignEmail,
  assignPhone,
  transferEmail,
  transferPhone,
  removeEmail,
  removePhone,
  deleteAvailableEmail,
  deleteAvailablePhone,
}
