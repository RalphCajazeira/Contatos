const express = require("express")
const path = require("path")

const app = express()

app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))

const usersRoutes = require("./routes/users.routes")
app.use("/api/users", usersRoutes)

const PORT = 3000
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})
