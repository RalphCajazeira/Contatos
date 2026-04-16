const API = "/api/users"

const usersList = document.getElementById("usersList")
const freeEmailsList = document.getElementById("freeEmailsList")
const freePhonesList = document.getElementById("freePhonesList")

const search = document.getElementById("search")
const btnExport = document.getElementById("btnExport")
const btnAddContact = document.getElementById("btnAddContact")
const btnAddFreeEmail = document.getElementById("btnAddFreeEmail")
const btnAddFreePhone = document.getElementById("btnAddFreePhone")

const contactCount = document.getElementById("contactCount")
const freeEmailCount = document.getElementById("freeEmailCount")
const freePhoneCount = document.getElementById("freePhoneCount")

const modalOverlay = document.getElementById("modalOverlay")
const modalTitle = document.getElementById("modalTitle")
const modalFields = document.getElementById("modalFields")
const modalForm = document.getElementById("modalForm")
const modalClose = document.getElementById("modalClose")
const modalCancel = document.getElementById("modalCancel")

let state = {
  users: [],
  availableEmails: [],
  availablePhones: [],
}

let modalSubmit = null

function digits(value) {
  return String(value || "").replace(/\D/g, "")
}

function formatBR(value) {
  const d = digits(value)
  if (!d) return ""
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7, 11)}`
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

async function request(url, options = {}) {
  const response = await fetch(url, options)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || "Erro na requisição.")
  }

  if (response.status === 204) return null
  return response.json()
}

async function load() {
  state = await request(API)
  render()
}

function filteredUsers() {
  const term = normalize(search.value)

  return [...state.users]
    .filter((user) => {
      const emails = (user.emails || []).map((item) => item.email).join(" ")
      const phones = (user.phones || []).map((item) => item.number).join(" ")
      const full = normalize(`${user.name} ${emails} ${phones}`)
      return !term || full.includes(term)
    })
    .sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "pt-BR", {
        sensitivity: "base",
      }),
    )
}

function openModal(title, fields, onSubmit) {
  modalTitle.textContent = title
  modalFields.innerHTML = fields.map(renderField).join("")
  modalSubmit = onSubmit
  modalOverlay.classList.remove("hidden")

  const firstInput = modalFields.querySelector("input, select")
  if (firstInput) firstInput.focus()

  modalFields.querySelectorAll('[data-mask="phone"]').forEach((input) => {
    input.addEventListener("input", () => {
      input.value = formatBR(input.value)
    })
  })
}

function closeModal() {
  modalOverlay.classList.add("hidden")
  modalFields.innerHTML = ""
  modalSubmit = null
}

function renderField(field) {
  if (field.type === "select") {
    return `
      <div class="field">
        <label for="${field.name}">${field.label}</label>
        <select id="${field.name}" name="${field.name}" class="select">
          ${field.options
            .map(
              (option) => `
            <option value="${escapeHtml(option.value)}" ${option.value === field.value ? "selected" : ""}>
              ${escapeHtml(option.label)}
            </option>
          `,
            )
            .join("")}
        </select>
      </div>
    `
  }

  return `
    <div class="field">
      <label for="${field.name}">${field.label}</label>
      <input
        id="${field.name}"
        name="${field.name}"
        class="input"
        type="${field.type || "text"}"
        value="${escapeHtml(field.value || "")}"
        placeholder="${escapeHtml(field.placeholder || "")}"
        ${field.mask ? `data-mask="${field.mask}"` : ""}
      />
    </div>
  `
}

function getFormValues() {
  const formData = new FormData(modalForm)
  return Object.fromEntries(formData.entries())
}

function renderEmails(emails) {
  if (!emails.length) {
    return `<div class="empty">Nenhum e-mail livre.</div>`
  }

  return [...emails]
    .sort((a, b) =>
      a.email.localeCompare(b.email, "pt-BR", { sensitivity: "base" }),
    )
    .map(
      (item) => `
      <div class="resource-card">
        <div class="resource-text">${escapeHtml(item.email)}</div>
        <div class="resource-actions">
          <button class="small-btn" onclick="openAssignEmailFromAvailable('${item.email}')">Atribuir</button>
          <button class="small-btn danger" onclick="deleteAvailableEmail('${item.email}')">Excluir</button>
        </div>
      </div>
    `,
    )
    .join("")
}

function renderPhones(phones) {
  if (!phones.length) {
    return `<div class="empty">Nenhum número livre.</div>`
  }

  return [...phones]
    .sort((a, b) => digits(a.number).localeCompare(digits(b.number), "pt-BR"))
    .map(
      (item) => `
      <div class="resource-card">
        <div class="resource-text">${escapeHtml(formatBR(item.number))}</div>
        <div class="resource-actions">
          <button class="small-btn" onclick="openAssignPhoneFromAvailable('${item.number}')">Atribuir</button>
          <button class="small-btn danger" onclick="deleteAvailablePhone('${item.number}')">Excluir</button>
        </div>
      </div>
    `,
    )
    .join("")
}

function renderUsers(users) {
  if (!users.length) {
    return `<div class="empty">Nenhum contato encontrado.</div>`
  }

  return users
    .map((user) => {
      const principalEmail = (user.emails || []).find(
        (item) => item.type === "principal",
      )

      return `
      <div class="contact-card">
        <div class="contact-top">
          <div>
            <div class="contact-name">${escapeHtml(user.name)}</div>
            <div class="empty">${principalEmail ? escapeHtml(principalEmail.email) : "Sem e-mail principal"}</div>
          </div>

          <div class="contact-edit">
            <button class="small-btn" onclick="openEditContactName('${user.id}', '${escapeHtml(user.name)}')">Editar nome</button>
            <button class="small-btn" onclick="openAddEmailToUser('${user.id}')">Adicionar e-mail</button>
            <button class="small-btn" onclick="openAddPhoneToUser('${user.id}')">Adicionar número</button>
            <button class="small-btn danger" onclick="deleteContact('${user.id}')">Excluir</button>
          </div>
        </div>

        <div class="info-block">
          <div class="info-title">E-mails</div>
          ${
            user.emails && user.emails.length
              ? `<div class="chips">
                  ${user.emails
                    .map(
                      (item) => `
                    <div class="chip">
                      <span>${escapeHtml(item.email)}${item.type ? ` • ${escapeHtml(item.type)}` : ""}</span>
                      <button class="remove-chip" onclick="removeEmail('${user.id}', '${item.email}')">×</button>
                    </div>
                  `,
                    )
                    .join("")}
                </div>`
              : `<div class="empty">Sem e-mails.</div>`
          }
        </div>

        <div class="info-block">
          <div class="info-title">Números</div>
          ${
            user.phones && user.phones.length
              ? `<div class="chips">
                  ${user.phones
                    .map(
                      (item) => `
                    <div class="chip phone">
                      <span>${escapeHtml(formatBR(item.number))}${item.type ? ` • ${escapeHtml(item.type)}` : ""}</span>
                      <button class="remove-chip" onclick="removePhone('${user.id}', '${item.number}')">×</button>
                    </div>
                  `,
                    )
                    .join("")}
                </div>`
              : `<div class="empty">Sem números.</div>`
          }
        </div>
      </div>
    `
    })
    .join("")
}

function render() {
  const users = filteredUsers()

  usersList.innerHTML = renderUsers(users)
  freeEmailsList.innerHTML = renderEmails(state.availableEmails || [])
  freePhonesList.innerHTML = renderPhones(state.availablePhones || [])

  contactCount.textContent = users.length
  freeEmailCount.textContent = (state.availableEmails || []).length
  freePhoneCount.textContent = (state.availablePhones || []).length
}

async function deleteContact(userId) {
  if (!confirm("Deseja realmente excluir este contato?")) return

  try {
    await request(`${API}/contact/${userId}`, { method: "DELETE" })
    await load()
  } catch (error) {
    alert(error.message)
  }
}

async function removeEmail(userId, email) {
  if (!confirm(`Remover ${email} do contato?`)) return

  try {
    await request(`${API}/remove-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, email }),
    })
    await load()
  } catch (error) {
    alert(error.message)
  }
}

async function removePhone(userId, number) {
  if (!confirm(`Remover ${formatBR(number)} do contato?`)) return

  try {
    await request(`${API}/remove-phone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, number }),
    })
    await load()
  } catch (error) {
    alert(error.message)
  }
}

function userOptions() {
  return state.users.map((user) => ({
    value: user.id,
    label: user.name,
  }))
}

function openEditContactName(userId, currentName) {
  openModal(
    "Editar nome do contato",
    [{ name: "name", label: "Nome completo", value: currentName }],
    async (values) => {
      await request(`${API}/contact/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name }),
      })
      await load()
    },
  )
}

function openAddEmailToUser(userId) {
  openModal(
    "Adicionar e-mail ao contato",
    [
      {
        name: "origin",
        label: "Origem",
        type: "select",
        value: "manual",
        options: [
          { value: "manual", label: "Digitar manualmente" },
          { value: "available", label: "Usar e-mail livre da empresa" },
        ],
      },
      {
        name: "email",
        label: "E-mail",
        placeholder: "email@dipedra.com",
      },
      {
        name: "type",
        label: "Tipo",
        type: "select",
        value: "alternativo",
        options: [
          { value: "principal", label: "Principal" },
          { value: "alternativo", label: "Alternativo" },
          { value: "pessoal", label: "Pessoal" },
        ],
      },
    ],
    async (values) => {
      await request(`${API}/assign-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email: values.email,
          type: values.type,
          fromAvailable: values.origin === "available",
        }),
      })
      await load()
    },
  )
}

function openAddPhoneToUser(userId) {
  openModal(
    "Adicionar número ao contato",
    [
      {
        name: "origin",
        label: "Origem",
        type: "select",
        value: "manual",
        options: [
          { value: "manual", label: "Digitar manualmente" },
          { value: "available", label: "Usar número livre da empresa" },
        ],
      },
      {
        name: "number",
        label: "Número",
        placeholder: "(71) 9 9177-1989",
        mask: "phone",
      },
      {
        name: "type",
        label: "Tipo",
        type: "select",
        value: "dipedra",
        options: [
          { value: "dipedra", label: "Dipedra" },
          { value: "pessoal", label: "Pessoal" },
        ],
      },
    ],
    async (values) => {
      await request(`${API}/assign-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          number: values.number,
          type: values.type,
          fromAvailable: values.origin === "available",
        }),
      })
      await load()
    },
  )
}

function openAssignEmailFromAvailable(email) {
  openModal(
    "Atribuir e-mail livre",
    [
      {
        name: "userId",
        label: "Contato",
        type: "select",
        options: userOptions(),
      },
      {
        name: "email",
        label: "E-mail",
        value: email,
      },
      {
        name: "type",
        label: "Tipo",
        type: "select",
        value: "alternativo",
        options: [
          { value: "principal", label: "Principal" },
          { value: "alternativo", label: "Alternativo" },
        ],
      },
    ],
    async (values) => {
      await request(`${API}/assign-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: values.userId,
          email: values.email,
          type: values.type,
          fromAvailable: true,
        }),
      })
      await load()
    },
  )
}

function openAssignPhoneFromAvailable(number) {
  openModal(
    "Atribuir número livre",
    [
      {
        name: "userId",
        label: "Contato",
        type: "select",
        options: userOptions(),
      },
      {
        name: "number",
        label: "Número",
        value: formatBR(number),
        mask: "phone",
      },
      {
        name: "type",
        label: "Tipo",
        type: "select",
        value: "dipedra",
        options: [
          { value: "dipedra", label: "Dipedra" },
          { value: "pessoal", label: "Pessoal" },
        ],
      },
    ],
    async (values) => {
      await request(`${API}/assign-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: values.userId,
          number: values.number,
          type: values.type,
          fromAvailable: true,
        }),
      })
      await load()
    },
  )
}

async function deleteAvailableEmail(email) {
  if (!confirm(`Excluir ${email} da lista de livres?`)) return

  try {
    await request(`${API}/available-email`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    await load()
  } catch (error) {
    alert(error.message)
  }
}

async function deleteAvailablePhone(number) {
  if (!confirm(`Excluir ${formatBR(number)} da lista de livres?`)) return

  try {
    await request(`${API}/available-phone`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number }),
    })
    await load()
  } catch (error) {
    alert(error.message)
  }
}

btnAddContact.addEventListener("click", () => {
  openModal(
    "Novo contato",
    [
      {
        name: "name",
        label: "Nome completo",
        placeholder: "Ex.: Danilo Costa",
      },
    ],
    async (values) => {
      await request(`${API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name }),
      })
      await load()
    },
  )
})

btnAddFreeEmail.addEventListener("click", () => {
  openModal(
    "Novo e-mail livre da empresa",
    [
      {
        name: "email",
        label: "E-mail",
        placeholder: "comercial11@dipedra.com",
      },
    ],
    async (values) => {
      await request(`${API}/available-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      })
      await load()
    },
  )
})

btnAddFreePhone.addEventListener("click", () => {
  openModal(
    "Novo número livre da empresa",
    [
      {
        name: "number",
        label: "Número",
        placeholder: "(71) 9 9177-1989",
        mask: "phone",
      },
    ],
    async (values) => {
      await request(`${API}/available-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: values.number }),
      })
      await load()
    },
  )
})

search.addEventListener("input", render)

btnExport.addEventListener("click", async () => {
  try {
    const workbook = new ExcelJS.Workbook()

    const contatosSheet = workbook.addWorksheet("Contatos", {
      views: [{ state: "frozen", ySplit: 1 }],
    })

    const emailsSheet = workbook.addWorksheet("Emails Livres", {
      views: [{ state: "frozen", ySplit: 1 }],
    })

    const numerosSheet = workbook.addWorksheet("Numeros Livres", {
      views: [{ state: "frozen", ySplit: 1 }],
    })

    contatosSheet.columns = [
      { header: "Nome", key: "nome", width: 30 },
      { header: "E-mail Principal", key: "emailPrincipal", width: 32 },
      {
        header: "E-mail Alternativo (Alias Google)",
        key: "emailAlternativo",
        width: 32,
      },
      { header: "Telefone Dipedra", key: "telefoneDipedra", width: 20 },
      { header: "Telefone Pessoal", key: "telefonePessoal", width: 20 },
      { header: "E-mail Pessoal", key: "emailPessoal", width: 32 },
    ]

    emailsSheet.columns = [
      { header: "E-mail Livre", key: "emailLivre", width: 35 },
    ]

    numerosSheet.columns = [
      { header: "Número Livre", key: "numeroLivre", width: 20 },
    ]

    const contatos = [...state.users]
      .sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
      )
      .map((user) => ({
        nome: user.name,

        emailPrincipal: (user.emails || [])
          .filter((item) => item.type === "principal")
          .map((item) => item.email)
          .join("\n"),

        emailAlternativo: (user.emails || [])
          .filter((item) => item.type === "alternativo")
          .map((item) => item.email)
          .join("\n"),

        telefoneDipedra: (user.phones || [])
          .filter((item) => item.type === "dipedra")
          .map((item) => formatBR(item.number))
          .join("\n"),

        telefonePessoal: (user.phones || [])
          .filter((item) => item.type === "pessoal")
          .map((item) => formatBR(item.number))
          .join("\n"),

        emailPessoal: (user.emails || [])
          .filter((item) => item.type === "pessoal")
          .map((item) => item.email)
          .join("\n"),
      }))

    const emailsLivres = [...(state.availableEmails || [])]
      .sort((a, b) =>
        a.email.localeCompare(b.email, "pt-BR", { sensitivity: "base" }),
      )
      .map((item) => ({
        emailLivre: item.email,
      }))

    const numerosLivres = [...(state.availablePhones || [])]
      .sort((a, b) => digits(a.number).localeCompare(digits(b.number), "pt-BR"))
      .map((item) => ({
        numeroLivre: formatBR(item.number),
      }))

    contatos.forEach((item) => contatosSheet.addRow(item))
    emailsLivres.forEach((item) => emailsSheet.addRow(item))
    numerosLivres.forEach((item) => numerosSheet.addRow(item))

    function styleSheet(sheet, lastColumnLetter) {
      const header = sheet.getRow(1)

      header.font = { bold: true, color: { argb: "FFFFFFFF" } }
      header.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1F4E78" },
      }
      header.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      }

      sheet.autoFilter = {
        from: "A1",
        to: `${lastColumnLetter}1`,
      }

      sheet.eachRow((row, rowNumber) => {
        row.alignment = { vertical: "middle", wrapText: true }

        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "EAEAEA" } },
            left: { style: "thin", color: { argb: "EAEAEA" } },
            bottom: { style: "thin", color: { argb: "EAEAEA" } },
            right: { style: "thin", color: { argb: "EAEAEA" } },
          }
        })

        if (rowNumber === 1) return

        if (rowNumber % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "F7F9FC" },
            }
          })
        }
      })
    }

    styleSheet(contatosSheet, "F")
    styleSheet(emailsSheet, "A")
    styleSheet(numerosSheet, "A")

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "gestor_contatos.xlsx"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (error) {
    alert("Erro ao exportar a planilha.")
    console.error(error)
  }
})

modalClose.addEventListener("click", closeModal)
modalCancel.addEventListener("click", closeModal)
modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) closeModal()
})

modalForm.addEventListener("submit", async (event) => {
  event.preventDefault()
  if (!modalSubmit) return

  try {
    const values = getFormValues()
    await modalSubmit(values)
    closeModal()
  } catch (error) {
    alert(error.message)
  }
})

load()

window.openEditContactName = openEditContactName
window.deleteContact = deleteContact
window.removeEmail = removeEmail
window.removePhone = removePhone
window.openAddEmailToUser = openAddEmailToUser
window.openAddPhoneToUser = openAddPhoneToUser
window.openAssignEmailFromAvailable = openAssignEmailFromAvailable
window.openAssignPhoneFromAvailable = openAssignPhoneFromAvailable
window.deleteAvailableEmail = deleteAvailableEmail
window.deleteAvailablePhone = deleteAvailablePhone
