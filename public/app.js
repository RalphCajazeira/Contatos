import { bindModalEvents } from "./js/modal.js"
import {
  load,
  setFilter,
  createContactAction,
  addAvailableEmailAction,
  addAvailablePhoneAction,
  openEditContactName,
  openAddEmailToUser,
  openAddPhoneToUser,
  openAssignEmailFromAvailable,
  openAssignPhoneFromAvailable,
  openTransferEmailModal,
  openTransferPhoneModal,
  openRenamePrimaryEmailModal,
  openAliasesModal,
  deleteAliasAction,
  openDeletedResourcesModal,
  restoreDeletedAliasAction,
  deleteAvailableEmailAction,
  deleteAvailablePhoneAction,
  removeEmailAction,
  removePhoneAction,
  inactivateContactAction,
  reactivateContactAction,
  openEmailHistory,
  openPhoneHistory,
  openGlobalHistory,
  openRenameFreeEmailModal,
  openFreeEmailAliasesModal,
} from "./js/actions.js"
import { render } from "./js/render.js"

const search = document.getElementById("search")
const btnAddContact = document.getElementById("btnAddContact")
const btnAddFreeEmail = document.getElementById("btnAddFreeEmail")
const btnAddFreePhone = document.getElementById("btnAddFreePhone")

bindModalEvents()

btnAddContact.addEventListener("click", createContactAction)
btnAddFreeEmail.addEventListener("click", addAvailableEmailAction)
btnAddFreePhone.addEventListener("click", addAvailablePhoneAction)

search.addEventListener("input", render)

window.setUsersFilter = setFilter
window.openEditContactName = openEditContactName
window.openAddEmailToUser = openAddEmailToUser
window.openAddPhoneToUser = openAddPhoneToUser
window.openAssignEmailFromAvailable = openAssignEmailFromAvailable
window.openAssignPhoneFromAvailable = openAssignPhoneFromAvailable
window.deleteAvailableEmailAction = deleteAvailableEmailAction
window.deleteAvailablePhoneAction = deleteAvailablePhoneAction
window.removeEmailAction = removeEmailAction
window.removePhoneAction = removePhoneAction
window.inactivateContactAction = inactivateContactAction
window.reactivateContactAction = reactivateContactAction
window.openEmailHistory = openEmailHistory
window.openPhoneHistory = openPhoneHistory
window.openTransferEmailModal = openTransferEmailModal
window.openTransferPhoneModal = openTransferPhoneModal
window.openGlobalHistory = openGlobalHistory
window.openRenamePrimaryEmailModal = openRenamePrimaryEmailModal
window.openAliasesModal = openAliasesModal
window.deleteAliasAction = deleteAliasAction
window.openDeletedResourcesModal = openDeletedResourcesModal
window.restoreDeletedAliasAction = restoreDeletedAliasAction
window.openRenameFreeEmailModal = openRenameFreeEmailModal
window.openFreeEmailAliasesModal = openFreeEmailAliasesModal

load()
