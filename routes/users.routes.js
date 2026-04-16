const router = require("express").Router()
const controller = require("../controllers/users.controller")

router.get("/", controller.getAll)

router.get("/contacts/active", controller.getActiveUsers)
router.get("/contacts/inactive", controller.getInactiveUsers)
router.get("/contact/:id", controller.getUserById)
router.get("/summary", controller.getSummary)

router.get("/history", controller.getHistory)
router.get("/history/email/:email", controller.getEmailHistory)
router.get("/history/phone/:number", controller.getPhoneHistory)
router.get("/history/alias/:email", controller.getAliasHistory)

router.post("/contact", controller.addUser)
router.put("/contact/:id", controller.updateUser)
router.delete("/contact/:id", controller.deleteUser)
router.post("/contact/:id/inactivate", controller.inactivateUser)
router.post("/contact/:id/reactivate", controller.reactivateUser)

router.post("/available-email", controller.addAvailableEmail)
router.delete("/available-email", controller.deleteAvailableEmail)

router.post("/available-phone", controller.addAvailablePhone)
router.delete("/available-phone", controller.deleteAvailablePhone)

router.post("/assign-email", controller.assignEmail)
router.post("/assign-phone", controller.assignPhone)
router.post("/transfer-email", controller.transferEmail)
router.post("/transfer-phone", controller.transferPhone)

router.post("/remove-email", controller.removeEmail)
router.post("/remove-phone", controller.removePhone)

router.get("/deleted", controller.getDeletedResources)
router.get("/aliases", controller.getAliasesByPrincipal)

router.post("/rename-primary-email", controller.renamePrimaryEmail)
router.post("/rename-available-email", controller.renameAvailableEmail)
router.post("/delete-alias", controller.deleteAlias)
router.post("/restore-deleted-alias", controller.restoreDeletedAlias)

module.exports = router
