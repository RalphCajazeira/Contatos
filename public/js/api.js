const API = "/api/users"

export async function request(url, options = {}) {
  const response = await fetch(url, options)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || "Erro na requisição.")
  }

  if (response.status === 204) return null
  return response.json()
}

export async function fetchAll() {
  return request(API)
}

export async function fetchSummary() {
  return request(`${API}/summary`)
}

export async function createContact(name) {
  return request(`${API}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
}

export async function updateContactName(id, name) {
  return request(`${API}/contact/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
}

export async function inactivateContact(id) {
  return request(`${API}/contact/${id}/inactivate`, {
    method: "POST",
  })
}

export async function reactivateContact(id) {
  return request(`${API}/contact/${id}/reactivate`, {
    method: "POST",
  })
}

export async function addAvailableEmail(email, type = "principal") {
  return request(`${API}/available-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, type }),
  })
}

export async function addAvailablePhone(number) {
  return request(`${API}/available-phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ number }),
  })
}

export async function deleteAvailableEmail(email) {
  return request(`${API}/available-email`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
}

export async function deleteAvailablePhone(number) {
  return request(`${API}/available-phone`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ number }),
  })
}

export async function assignEmail(payload) {
  return request(`${API}/assign-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export async function assignPhone(payload) {
  return request(`${API}/assign-phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export async function removeEmail(payload) {
  return request(`${API}/remove-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export async function removePhone(payload) {
  return request(`${API}/remove-phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export async function fetchHistoryByEmail(email) {
  return request(`${API}/history/email/${encodeURIComponent(email)}`)
}

export async function fetchHistoryByAlias(email) {
  return request(`${API}/history/alias/${encodeURIComponent(email)}`)
}

export async function fetchHistoryByPhone(number) {
  return request(`${API}/history/phone/${encodeURIComponent(number)}`)
}

export async function transferEmail(payload) {
  return request(`${API}/transfer-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export async function transferPhone(payload) {
  return request(`${API}/transfer-phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export async function fetchHistory(limit = 100) {
  return request(`${API}/history?limit=${limit}`)
}

export async function renamePrimaryEmail(payload) {
  return request(`${API}/rename-primary-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export async function fetchAliases(userId, principalEmail) {
  const params = new URLSearchParams({
    userId,
    principalEmail,
  })

  return request(`${API}/aliases?${params.toString()}`)
}

export async function deleteAlias(payload) {
  return request(`${API}/delete-alias`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export async function fetchDeletedResources() {
  return request(`${API}/deleted`)
}

export async function restoreDeletedAlias(payload) {
  return request(`${API}/restore-deleted-alias`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}