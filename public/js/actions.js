import { state } from "./state.js"
import {
  fetchAll,
  fetchSummary,
  createContact,
  updateContactName,
  addAvailableEmail,
  addAvailablePhone,
  deleteAvailableEmail,
  deleteAvailablePhone,
  assignEmail,
  assignPhone,
  transferEmail,
  transferPhone,
  removeEmail,
  removePhone,
  inactivateContact,
  reactivateContact,
  fetchHistory,
  fetchHistoryByEmail,
  fetchHistoryByAlias,
  fetchHistoryByPhone,
  renamePrimaryEmail,
  renameAvailableEmail,
  fetchAliases,
  deleteAlias,
  fetchDeletedResources,
  restoreDeletedAlias,
} from "./api.js"
import { render } from "./render.js"
import { openModal, openHtmlModal } from "./modal.js"
import { escapeHtml, formatBR } from "./utils.js"

export async function load() {
  const [data, summary] = await Promise.all([fetchAll(), fetchSummary()])

  state.users = data.users || []
  state.availableEmails = data.availableEmails || []
  state.availablePhones = data.availablePhones || []
  state.summary = summary || {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    availableEmails: 0,
    availablePhones: 0,
    emailsInUse: 0,
    phonesInUse: 0,
  }

  render()
}

export function setFilter(filter) {
  state.currentFilter = filter
  render()
}

export function userOptions() {
  return state.users
    .filter((user) => user.active !== false)
    .map((user) => ({
      value: user.id,
      label: user.name,
    }))
}

export function openEditContactName(userId, currentName) {
  openModal(
    "Editar nome do contato",
    [{ name: "name", label: "Nome completo", value: currentName }],
    async (values) => {
      await updateContactName(userId, values.name)
      await load()
    },
  )
}

export function openAddEmailToUser(userId) {
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
        value: "alias",
        options: [
          { value: "principal", label: "Principal" },
          { value: "alias", label: "Alias" },
          { value: "pessoal", label: "Pessoal" },
        ],
      },
    ],
    async (values) => {
      await assignEmail({
        userId,
        email: values.email,
        type: values.type,
        fromAvailable: values.origin === "available",
      })
      await load()
    },
  )
}

export function openAddPhoneToUser(userId) {
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
      await assignPhone({
        userId,
        number: values.number,
        type: values.type,
        fromAvailable: values.origin === "available",
      })
      await load()
    },
  )
}

export function openAssignEmailFromAvailable(email) {
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
        value: "principal",
        options: [
          { value: "principal", label: "Principal" },
          { value: "alias", label: "Alias" },
        ],
      },
    ],
    async (values) => {
      await assignEmail({
        userId: values.userId,
        email: values.email,
        type: values.type,
        fromAvailable: true,
      })
      await load()
    },
  )
}

export function openAssignPhoneFromAvailable(number) {
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
      await assignPhone({
        userId: values.userId,
        number: values.number,
        type: values.type,
        fromAvailable: true,
      })
      await load()
    },
  )
}

export async function createContactAction() {
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
      await createContact(values.name)
      await load()
    },
  )
}

export async function addAvailableEmailAction() {
  openModal(
    "Novo e-mail livre da empresa",
    [
      {
        name: "email",
        label: "E-mail",
        placeholder: "comercial11@dipedra.com",
      },
      {
        name: "type",
        label: "Tipo",
        type: "select",
        value: "principal",
        options: [
          { value: "principal", label: "Principal" },
          { value: "alias", label: "Alias" },
        ],
      },
    ],
    async (values) => {
      await addAvailableEmail(values.email, values.type)
      await load()
    },
  )
}

export async function addAvailablePhoneAction() {
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
      await addAvailablePhone(values.number)
      await load()
    },
  )
}

export async function deleteAvailableEmailAction(email) {
  if (!confirm(`Excluir ${email} da lista de livres?`)) return
  await deleteAvailableEmail(email)
  await load()
}

export async function deleteAvailablePhoneAction(number) {
  if (!confirm(`Excluir ${formatBR(number)} da lista de livres?`)) return
  await deleteAvailablePhone(number)
  await load()
}

export async function removeEmailAction(userId, email) {
  if (!confirm(`Remover ${email} do contato?`)) return
  await removeEmail({ userId, email })
  await load()
}

export async function removePhoneAction(userId, number) {
  if (!confirm(`Remover ${formatBR(number)} do contato?`)) return
  await removePhone({ userId, number })
  await load()
}

export async function inactivateContactAction(userId) {
  if (!confirm("Deseja inativar este contato?")) return
  await inactivateContact(userId)
  await load()
}

export async function reactivateContactAction(userId) {
  if (!confirm("Deseja reativar este contato?")) return
  await reactivateContact(userId)
  await load()
}

function getReadableHistoryAction(item) {
  const actionMap = {
    created: "Contato criado",
    renamed: "Renomeado",
    created_as_available: "Criado como recurso livre",
    assigned: "Atribuído ao contato",
    assigned_from_available: "Atribuído a partir da lista de livres",
    removed: "Removido do contato",
    deleted: "Excluído",
    deleted_from_available: "Excluído da lista de livres",
    restored: "Restaurado",
    transferred: "Transferido entre contatos",
    released_on_inactivate: "Liberado ao inativar o contato",
    released_on_delete: "Liberado ao excluir o contato",
    inactivated: "Contato inativado",
    reactivated: "Contato reativado",
    created_from_rename: "Alias criado ao renomear o e-mail",
  }

  return actionMap[item.action] || item.action || "Ação registrada"
}

function getReadableEntityType(item) {
  const map = {
    email: "E-mail",
    alias: "Alias",
    phone: "Número",
    contact: "Contato",
  }

  return map[item.entityType] || item.entityType || "-"
}

function renderHistoryDetails(item) {
  const metadata = item.metadata || {}
  const details = []

  if (metadata.oldEmail && metadata.newEmail) {
    details.push(
      `<div class="resource-meta">Alteração: ${escapeHtml(metadata.oldEmail)} → ${escapeHtml(metadata.newEmail)}</div>`,
    )
  }

  if (metadata.principalEmail) {
    details.push(
      `<div class="resource-meta">E-mail principal: ${escapeHtml(metadata.principalEmail)}</div>`,
    )
  }

  if (metadata.previousType || metadata.newType) {
    details.push(
      `<div class="resource-meta">Tipo: ${escapeHtml(metadata.previousType || "-")} → ${escapeHtml(metadata.newType || "-")}</div>`,
    )
  }

  return details.join("")
}

function renderHistoryHtml(history) {
  if (!history.length) {
    return `<div class="empty">Nenhum histórico encontrado.</div>`
  }

  return `
    <div class="history-list">
      ${history
        .map(
          (item) => `
        <div class="resource-card">
          <div class="resource-text">
            <div><strong>${escapeHtml(getReadableHistoryAction(item))}</strong></div>
            <div class="resource-meta">Tipo: ${escapeHtml(getReadableEntityType(item))}</div>
            <div class="resource-meta">Valor: ${escapeHtml(item.entityValue || "-")}</div>
            <div class="resource-meta">Data: ${escapeHtml(new Date(item.changedAt).toLocaleString("pt-BR"))}</div>
            <div class="resource-meta">De: ${escapeHtml(item.fromUserName || "-")}</div>
            <div class="resource-meta">Para: ${escapeHtml(item.toUserName || "-")}</div>
            ${renderHistoryDetails(item)}
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  `
}

export async function openEmailHistory(email, type) {
  const history =
    type === "alias"
      ? await fetchHistoryByAlias(email)
      : await fetchHistoryByEmail(email)

  openHtmlModal(`Histórico de ${email}`, renderHistoryHtml(history))
}

export async function openPhoneHistory(number) {
  const history = await fetchHistoryByPhone(number)
  openHtmlModal(`Histórico de ${formatBR(number)}`, renderHistoryHtml(history))
}

export function openTransferEmailModal(fromUserId, email, currentType) {
  openModal(
    "Transferir e-mail",
    [
      {
        name: "toUserId",
        label: "Contato de destino",
        type: "select",
        options: userOptions().filter((item) => item.value !== fromUserId),
      },
      {
        name: "email",
        label: "E-mail",
        value: email,
      },
      {
        name: "targetType",
        label: "Tipo no destino",
        type: "select",
        value: currentType === "alias" ? "alias" : currentType || "principal",
        options: [
          { value: "principal", label: "Principal" },
          { value: "alias", label: "Alias" },
          { value: "pessoal", label: "Pessoal" },
          { value: "alternativo", label: "Alternativo" },
        ],
      },
    ],
    async (values) => {
      await transferEmail({
        fromUserId,
        toUserId: values.toUserId,
        email: values.email,
        targetType: values.targetType,
      })
      await load()
    },
  )
}

export function openTransferPhoneModal(fromUserId, number, currentType) {
  openModal(
    "Transferir número",
    [
      {
        name: "toUserId",
        label: "Contato de destino",
        type: "select",
        options: userOptions().filter((item) => item.value !== fromUserId),
      },
      {
        name: "number",
        label: "Número",
        value: formatBR(number),
        mask: "phone",
      },
      {
        name: "targetType",
        label: "Tipo no destino",
        type: "select",
        value: currentType === "pessoal" ? "pessoal" : "dipedra",
        options: [
          { value: "dipedra", label: "Dipedra" },
          { value: "pessoal", label: "Pessoal" },
        ],
      },
    ],
    async (values) => {
      await transferPhone({
        fromUserId,
        toUserId: values.toUserId,
        number: values.number,
        targetType: values.targetType,
      })
      await load()
    },
  )
}

export async function openGlobalHistory() {
  const history = await fetchHistory(200)

  openHtmlModal("Histórico geral", renderHistoryHtml(history))
}

export function openRenamePrimaryEmailModal(userId, oldEmail) {
  openRenameEmailModal({
    title: "Renomear e-mail principal",
    oldEmail,
    onSubmit: async (values) => {
      await renamePrimaryEmail({
        userId,
        oldEmail: values.oldEmail,
        newEmail: values.newEmail,
      })
      await load()
    },
  })
}

export async function openAliasesModal(userId, principalEmail) {
  const aliases = await fetchAliases(userId, principalEmail)

  if (!aliases.length) {
    openHtmlModal(
      `Aliases de ${principalEmail}`,
      `<div class="empty">Nenhum alias vinculado.</div>`,
    )
    return
  }

  const html = `
    <div class="history-list">
      ${aliases
        .map(
          (alias) => `
        <div class="resource-card">
          <div class="resource-text">
            <div><strong>${escapeHtml(alias.email)}</strong></div>
            <div class="resource-meta">
              Criado em: ${escapeHtml(new Date(alias.createdAt).toLocaleString("pt-BR"))}
            </div>
          </div>
          <div class="resource-actions">
            <button class="small-btn" onclick="openEmailHistory('${alias.email}', 'alias')">Histórico</button>
            <button class="small-btn danger" onclick="deleteAliasAction('${userId}', '${principalEmail}', '${alias.email}')">Excluir alias</button>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  `

  openHtmlModal(`Aliases de ${principalEmail}`, html)
}

export async function deleteAliasAction(userId, principalEmail, aliasEmail) {
  if (!confirm(`Excluir o alias ${aliasEmail}?`)) return

  await deleteAlias({
    userId,
    principalEmail,
    aliasEmail,
  })

  await load()
  await openAliasesModal(userId, principalEmail)
}

export async function openDeletedResourcesModal() {
  const deleted = await fetchDeletedResources()

  const deletedAliases = deleted.aliases || []
  const deletedEmails = deleted.emails || []
  const deletedPhones = deleted.phones || []

  const html = `
    <div class="history-list">
      <div class="panel">
        <div class="panel-header">
          <h3>Aliases excluídos</h3>
          <span class="badge">${deletedAliases.length}</span>
        </div>
        ${
          deletedAliases.length
            ? deletedAliases
                .map(
                  (item) => `
              <div class="resource-card">
                <div class="resource-text">
                  <div><strong>${escapeHtml(item.email)}</strong></div>
                  <div class="resource-meta">Principal: ${escapeHtml(item.principalEmail || "-")}</div>
                  <div class="resource-meta">Usuário: ${escapeHtml(item.userName || "-")}</div>
                  <div class="resource-meta">Excluído em: ${escapeHtml(new Date(item.deletedAt).toLocaleString("pt-BR"))}</div>
                </div>
                <div class="resource-actions">
                  <button class="small-btn" onclick="restoreDeletedAliasAction('${item.id}')">Restaurar</button>
                </div>
              </div>
            `,
                )
                .join("")
            : `<div class="empty">Nenhum alias excluído.</div>`
        }
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3>E-mails excluídos</h3>
          <span class="badge">${deletedEmails.length}</span>
        </div>
        ${
          deletedEmails.length
            ? deletedEmails
                .map(
                  (item) => `
              <div class="resource-card">
                <div class="resource-text">
                  <div><strong>${escapeHtml(item.email)}</strong></div>
                  <div class="resource-meta">Tipo: ${escapeHtml(item.type || "-")}</div>
                  <div class="resource-meta">Usuário: ${escapeHtml(item.userName || "-")}</div>
                  <div class="resource-meta">Excluído em: ${escapeHtml(new Date(item.deletedAt).toLocaleString("pt-BR"))}</div>
                </div>
              </div>
            `,
                )
                .join("")
            : `<div class="empty">Nenhum e-mail excluído.</div>`
        }
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3>Números excluídos</h3>
          <span class="badge">${deletedPhones.length}</span>
        </div>
        ${
          deletedPhones.length
            ? deletedPhones
                .map(
                  (item) => `
              <div class="resource-card">
                <div class="resource-text">
                  <div><strong>${escapeHtml(formatBR(item.number))}</strong></div>
                  <div class="resource-meta">Tipo: ${escapeHtml(item.type || "-")}</div>
                  <div class="resource-meta">Usuário: ${escapeHtml(item.userName || "-")}</div>
                  <div class="resource-meta">Excluído em: ${escapeHtml(new Date(item.deletedAt).toLocaleString("pt-BR"))}</div>
                </div>
              </div>
            `,
                )
                .join("")
            : `<div class="empty">Nenhum número excluído.</div>`
        }
      </div>
    </div>
  `

  openHtmlModal("Recursos excluídos", html)
}

export async function restoreDeletedAliasAction(aliasId) {
  await restoreDeletedAlias({ aliasId })
  await load()
  await openDeletedResourcesModal()
}

export function openRenameFreeEmailModal(email) {
  openRenameEmailModal({
    title: "Renomear e-mail livre",
    oldEmail: email,
    onSubmit: async (values) => {
      await renameAvailableEmail({
        oldEmail: values.oldEmail,
        newEmail: values.newEmail,
      })
      await load()
    },
  })
}

export function openFreeEmailAliasesModal(email) {
  openHtmlModal(
    `Aliases de ${email}`,
    `
      <div class="resource-card">
        <div class="resource-text">
          <div><strong>${escapeHtml(email)}</strong></div>
          <div class="resource-meta">
            No modelo atual, os aliases vinculados são exibidos a partir do e-mail
            principal dentro do contato.
          </div>
          <div class="resource-meta" style="margin-top: 10px;">
            Depois que esse e-mail estiver atribuído a um contato, use o botão
            “Ver aliases” no card do e-mail principal.
          </div>
        </div>
      </div>
    `,
  )
}

function openRenameEmailModal({ title, oldEmail, onSubmit }) {
  openModal(
    title,
    [
      {
        name: "oldEmail",
        label: "E-mail atual",
        value: oldEmail,
      },
      {
        name: "newEmail",
        label: "Novo e-mail principal",
        placeholder: "financeiro2@dipedra.com",
      },
    ],
    onSubmit,
  )
}
