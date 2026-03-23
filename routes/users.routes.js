const router = require("express").Router()
const controller = require("../controllers/users.controller")

router.get("/", controller.getAll)

router.post("/contact", controller.addUser)
router.put("/contact/:id", controller.updateUser)
router.delete("/contact/:id", controller.deleteUser)

router.post("/available-email", controller.addAvailableEmail)
router.delete("/available-email", controller.deleteAvailableEmail)

router.post("/available-phone", controller.addAvailablePhone)
router.delete("/available-phone", controller.deleteAvailablePhone)

router.post("/assign-email", controller.assignEmail)
router.post("/assign-phone", controller.assignPhone)

router.post("/remove-email", controller.removeEmail)
router.post("/remove-phone", controller.removePhone)

module.exports = router
