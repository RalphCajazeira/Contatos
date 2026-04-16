import { state } from "./state.js"
import {
  fetchAll,
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
} from "./api.js"
import { render } from "./render.js"
import { openModal, openHtmlModal } from "./modal.js"
import { escapeHtml, formatBR } from "./utils.js"

export async function load() {
  const data = await fetchAll()
  state.users = data.users || []
  state.availableEmails = data.availableEmails || []
  state.availablePhones = data.availablePhones || []
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
            <div><strong>${escapeHtml(item.action)}</strong></div>
            <div class="resource-meta">Tipo: ${escapeHtml(item.entityType || "-")}</div>
            <div class="resource-meta">Valor: ${escapeHtml(item.entityValue || "-")}</div>
            <div class="resource-meta">Data: ${escapeHtml(new Date(item.changedAt).toLocaleString("pt-BR"))}</div>
            <div class="resource-meta">De: ${escapeHtml(item.fromUserName || "-")}</div>
            <div class="resource-meta">Para: ${escapeHtml(item.toUserName || "-")}</div>
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
