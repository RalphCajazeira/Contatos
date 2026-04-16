const usersService = require("../services/users.service")

function handleError(res, error) {
  return res.status(error.status || 500).json({
    error: error.message || "Erro interno do servidor.",
  })
}

exports.getAll = (req, res) => {
  try {
    const data = usersService.getAll()
    res.json(data)
  } catch (error) {
    handleError(res, error)
  }
}

exports.addUser = (req, res) => {
  try {
    const user = usersService.addUser({
      name: req.body.name,
    })

    res.status(201).json(user)
  } catch (error) {
    handleError(res, error)
  }
}

exports.updateUser = (req, res) => {
  try {
    const user = usersService.updateUser({
      id: req.params.id,
      name: req.body.name,
    })

    res.json(user)
  } catch (error) {
    handleError(res, error)
  }
}

exports.deleteUser = (req, res) => {
  try {
    usersService.deleteUser({
      id: req.params.id,
    })

    res.sendStatus(204)
  } catch (error) {
    handleError(res, error)
  }
}

exports.addAvailableEmail = (req, res) => {
  try {
    const result = usersService.addAvailableEmail({
      email: req.body.email,
      type: req.body.type,
    })

    res.status(201).json(result)
  } catch (error) {
    handleError(res, error)
  }
}

exports.addAvailablePhone = (req, res) => {
  try {
    const result = usersService.addAvailablePhone({
      number: req.body.number,
    })

    res.status(201).json(result)
  } catch (error) {
    handleError(res, error)
  }
}

exports.assignEmail = (req, res) => {
  try {
    const user = usersService.assignEmail({
      userId: req.body.userId,
      email: req.body.email,
      type: req.body.type,
      fromAvailable: req.body.fromAvailable,
    })

    res.json(user)
  } catch (error) {
    handleError(res, error)
  }
}

exports.assignPhone = (req, res) => {
  try {
    const user = usersService.assignPhone({
      userId: req.body.userId,
      number: req.body.number,
      type: req.body.type,
      fromAvailable: req.body.fromAvailable,
    })

    res.json(user)
  } catch (error) {
    handleError(res, error)
  }
}

exports.removeEmail = (req, res) => {
  try {
    const user = usersService.removeEmail({
      userId: req.body.userId,
      email: req.body.email,
    })

    res.json(user)
  } catch (error) {
    handleError(res, error)
  }
}

exports.removePhone = (req, res) => {
  try {
    const user = usersService.removePhone({
      userId: req.body.userId,
      number: req.body.number,
    })

    res.json(user)
  } catch (error) {
    handleError(res, error)
  }
}

exports.deleteAvailableEmail = (req, res) => {
  try {
    usersService.deleteAvailableEmail({
      email: req.body.email,
    })

    res.sendStatus(204)
  } catch (error) {
    handleError(res, error)
  }
}

exports.deleteAvailablePhone = (req, res) => {
  try {
    usersService.deleteAvailablePhone({
      number: req.body.number,
    })

    res.sendStatus(204)
  } catch (error) {
    handleError(res, error)
  }
}

exports.inactivateUser = (req, res) => {
  try {
    const user = usersService.inactivateUser({
      id: req.params.id,
    })

    res.json(user)
  } catch (error) {
    handleError(res, error)
  }
}

exports.reactivateUser = (req, res) => {
  try {
    const user = usersService.reactivateUser({
      id: req.params.id,
    })

    res.json(user)
  } catch (error) {
    handleError(res, error)
  }
}

exports.getHistory = (req, res) => {
  try {
    const history = usersService.getHistory({
      entityType: req.query.entityType,
      entityValue: req.query.entityValue,
      limit: req.query.limit,
    })

    res.json(history)
  } catch (error) {
    handleError(res, error)
  }
}

exports.getEmailHistory = (req, res) => {
  try {
    const history = usersService.getEmailHistory({
      email: req.params.email,
      limit: req.query.limit,
    })

    res.json(history)
  } catch (error) {
    handleError(res, error)
  }
}

exports.getPhoneHistory = (req, res) => {
  try {
    const history = usersService.getPhoneHistory({
      number: req.params.number,
      limit: req.query.limit,
    })

    res.json(history)
  } catch (error) {
    handleError(res, error)
  }
}

exports.getAliasHistory = (req, res) => {
  try {
    const history = usersService.getAliasHistory({
      email: req.params.email,
      limit: req.query.limit,
    })

    res.json(history)
  } catch (error) {
    handleError(res, error)
  }
}
