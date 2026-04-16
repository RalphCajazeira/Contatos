import { escapeHtml, formatBR } from "./utils.js"

const modalOverlay = document.getElementById("modalOverlay")
const modalTitle = document.getElementById("modalTitle")
const modalFields = document.getElementById("modalFields")
const modalForm = document.getElementById("modalForm")
const modalClose = document.getElementById("modalClose")
const modalCancel = document.getElementById("modalCancel")

let modalSubmit = null

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

export function openModal(title, fields, onSubmit) {
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

export function openHtmlModal(title, html) {
  modalTitle.textContent = title
  modalFields.innerHTML = html
  modalSubmit = null
  modalOverlay.classList.remove("hidden")

  const actions = modalForm.querySelector(".modal-actions")
  if (actions) {
    actions.style.display = "none"
  }
}

export function closeModal() {
  modalOverlay.classList.add("hidden")
  modalFields.innerHTML = ""
  modalSubmit = null

  const actions = modalForm.querySelector(".modal-actions")
  if (actions) {
    actions.style.display = ""
  }
}

export function bindModalEvents() {
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
}
