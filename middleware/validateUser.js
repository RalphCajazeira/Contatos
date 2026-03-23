const { isValidEmail } = require("../utils/email")

exports.create = (req, res, next) => {
  const { name, email } = req.body
  if (!name || !isValidEmail(email))
    return res.status(400).json({ error: "Dados inválidos" })
  next()
}

exports.update = (req, res, next) => {
  if (req.body.email && !isValidEmail(req.body.email))
    return res.status(400).json({ error: "Email inválido" })
  next()
}
