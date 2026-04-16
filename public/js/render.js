import { state } from "./state.js"
import { normalize, escapeHtml, formatBR } from "./utils.js"

const usersList = document.getElementById("usersList")
const freeEmailsList = document.getElementById("freeEmailsList")
const freePhonesList = document.getElementById("freePhonesList")
const search = document.getElementById("search")

const contactCount = document.getElementById("contactCount")
const freeEmailCount = document.getElementById("freeEmailCount")
const freePhoneCount = document.getElementById("freePhoneCount")
const summaryCards = document.getElementById("summaryCards")

function filteredUsers() {
  const term = normalize(search.value)

  return [...state.users]
    .filter((user) => {
      if (state.currentFilter === "active" && user.active === false)
        return false
      if (state.currentFilter === "inactive" && user.active !== false)
        return false
      return true
    })
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
        <div class="resource-text">
          <div><strong>${escapeHtml(item.email)}</strong></div>
          <div class="resource-meta">
            Tipo: ${escapeHtml(item.type || "principal")}
          </div>
          <div class="resource-meta">
            Último usuário: ${escapeHtml(item.lastUserName || "Não informado")}
          </div>
        </div>
        <div class="resource-actions">
          <button class="small-btn" onclick="openAssignEmailFromAvailable('${item.email}')">Atribuir</button>
          <button class="small-btn" onclick="openEmailHistory('${item.email}', '${item.type || "principal"}')">Histórico</button>
          <button class="small-btn" onclick="openRenameFreeEmailModal('${item.email}')">Renomear</button>
          <button class="small-btn" onclick="openFreeEmailAliasesModal('${item.email}')">Aliases</button>
          <button class="small-btn danger" onclick="deleteAvailableEmailAction('${item.email}')">Excluir</button>
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
    .sort((a, b) =>
      String(a.number || "").localeCompare(String(b.number || ""), "pt-BR"),
    )
    .map(
      (item) => `
      <div class="resource-card">
        <div class="resource-text">
          <div><strong>${escapeHtml(formatBR(item.number))}</strong></div>
          <div class="resource-meta">
            Último usuário: ${escapeHtml(item.lastUserName || "Não informado")}
          </div>
        </div>
        <div class="resource-actions">
          <button class="small-btn" onclick="openAssignPhoneFromAvailable('${item.number}')">Atribuir</button>
          <button class="small-btn" onclick="openPhoneHistory('${item.number}')">Histórico</button>
          <button class="small-btn danger" onclick="deleteAvailablePhoneAction('${item.number}')">Excluir</button>
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

      const statusLabel = user.active === false ? "Inativo" : "Ativo"
      const statusClass =
        user.active === false ? "badge badge-danger" : "badge badge-success"

      return `
      <div class="contact-card">
        <div class="contact-top">
          <div>
            <div class="contact-name">${escapeHtml(user.name)}</div>
            <div class="empty">${principalEmail ? escapeHtml(principalEmail.email) : "Sem e-mail principal"}</div>
            <div style="margin-top: 6px;">
              <span class="${statusClass}">${statusLabel}</span>
            </div>
          </div>

          <div class="contact-edit">
            <button class="small-btn" onclick="openEditContactName('${user.id}', '${escapeHtml(user.name)}')">Editar nome</button>
            <button class="small-btn" onclick="openAddEmailToUser('${user.id}')">Adicionar e-mail</button>
            <button class="small-btn" onclick="openAddPhoneToUser('${user.id}')">Adicionar número</button>
            ${
              user.active === false
                ? `<button class="small-btn" onclick="reactivateContactAction('${user.id}')">Reativar</button>`
                : `<button class="small-btn danger" onclick="inactivateContactAction('${user.id}')">Inativar</button>`
            }
          </div>
        </div>

        <div class="info-block">
  <div class="info-title">E-mails</div>
  ${
    user.emails && user.emails.length
      ? `<div class="chips">
          ${user.emails
            .map((item) => {
              const isPrincipal = item.type === "principal"
              const isAlias = item.type === "alias"

              return `
                <div class="chip">
                  <span>${escapeHtml(item.email)}${item.type ? ` • ${escapeHtml(item.type)}` : ""}</span>

                  <button class="remove-chip" title="Histórico" onclick="openEmailHistory('${item.email}', '${item.type || "principal"}')">🕘</button>

                  ${
                    isPrincipal
                      ? `<button class="remove-chip" title="Renomear principal" onclick="openRenamePrimaryEmailModal('${user.id}', '${item.email}')">✎</button>`
                      : ""
                  }

                  ${
                    isPrincipal
                      ? `<button class="remove-chip" title="Ver aliases" onclick="openAliasesModal('${user.id}', '${item.email}')">≡</button>`
                      : ""
                  }

                  <button class="remove-chip" title="Transferir" onclick="openTransferEmailModal('${user.id}', '${item.email}', '${item.type || "principal"}')">⇄</button>

                  ${
                    isAlias
                      ? ""
                      : `<button class="remove-chip" title="Remover" onclick="removeEmailAction('${user.id}', '${item.email}')">×</button>`
                  }
                </div>
              `
            })
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
              <button class="remove-chip" title="Histórico" onclick="openPhoneHistory('${item.number}')">🕘</button>
              <button class="remove-chip" title="Transferir" onclick="openTransferPhoneModal('${user.id}', '${item.number}', '${item.type || "dipedra"}')">⇄</button>
              <button class="remove-chip" title="Remover" onclick="removePhoneAction('${user.id}', '${item.number}')">×</button>
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

function renderSummary() {
  const summary = state.summary || {}

  if (!summaryCards) return

  summaryCards.innerHTML = `
    <div class="summary-card">
      <div class="summary-label">Total de contatos</div>
      <div class="summary-value">${summary.totalUsers || 0}</div>
    </div>

    <div class="summary-card">
      <div class="summary-label">Ativos</div>
      <div class="summary-value">${summary.activeUsers || 0}</div>
    </div>

    <div class="summary-card">
      <div class="summary-label">Inativos</div>
      <div class="summary-value">${summary.inactiveUsers || 0}</div>
    </div>

    <div class="summary-card">
      <div class="summary-label">E-mails livres</div>
      <div class="summary-value">${summary.availableEmails || 0}</div>
    </div>

    <div class="summary-card">
      <div class="summary-label">Números livres</div>
      <div class="summary-value">${summary.availablePhones || 0}</div>
    </div>

    <div class="summary-card">
      <div class="summary-label">E-mails em uso</div>
      <div class="summary-value">${summary.emailsInUse || 0}</div>
    </div>

    <div class="summary-card">
      <div class="summary-label">Números em uso</div>
      <div class="summary-value">${summary.phonesInUse || 0}</div>
    </div>
  `
}

export function render() {
  const users = filteredUsers()

  renderSummary()

  usersList.innerHTML = renderUsers(users)
  freeEmailsList.innerHTML = renderEmails(state.availableEmails || [])
  freePhonesList.innerHTML = renderPhones(state.availablePhones || [])

  contactCount.textContent = users.length
  freeEmailCount.textContent = (state.availableEmails || []).length
  freePhoneCount.textContent = (state.availablePhones || []).length
}
