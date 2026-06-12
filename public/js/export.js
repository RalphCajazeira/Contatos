import { state } from "./state.js"
import { openModal } from "./modal.js"
import { digits, formatBR } from "./utils.js"

const btnExport = document.getElementById("btnExport")
const btnExportPdf = document.getElementById("btnExportPdf")

function getContatosData() {
  return [...(state.users || [])]
    .filter((user) => user.active !== false)
    .sort((a, b) =>
      String(a.setor || "").localeCompare(String(b.setor || ""), "pt-BR", {
        sensitivity: "base",
      }) ||
      String(a.name || "").localeCompare(String(b.name || ""), "pt-BR", {
        sensitivity: "base",
      }),
    )
    .map((user) => ({
      nome: user.name || "",
      setor: user.setor || "",

      emailPrincipal: (user.emails || [])
        .filter((item) => item.type === "principal")
        .map((item) => item.email)
        .join("\n"),

      emailAlias: (user.emails || [])
        .filter((item) => item.type === "alias" || item.type === "alternativo")
        .map((item) => item.email)
        .join("\n"),

      telefoneDipedra: (user.phones || [])
        .filter((item) => item.type === "dipedra")
        .map((item) => formatBR(item.number))
        .join("\n"),

      telefonePessoal: (user.phones || [])
        .filter((item) => item.type === "pessoal")
        .map((item) => formatBR(item.number))
        .join("\n"),

      emailPessoal: (user.emails || [])
        .filter((item) => item.type === "pessoal")
        .map((item) => item.email)
        .join("\n"),

      status: user.active === false ? "Inativo" : "Ativo",
    }))
}

function getResumoContatos() {
  const contatosAtivos = (state.users || []).filter((user) => user.active !== false)
  const emailsDipedra = contatosAtivos.reduce(
    (total, user) =>
      total +
      (user.emails || []).filter((item) => item.type === "principal").length,
    0,
  )
  const numerosDipedra = contatosAtivos.reduce(
    (total, user) =>
      total +
      (user.phones || []).filter((item) => item.type === "dipedra").length,
    0,
  )

  return { emailsDipedra, numerosDipedra }
}

function getEmailsLivresData() {
  return [...(state.availableEmails || [])]
    .sort((a, b) =>
      String(a.email || "").localeCompare(String(b.email || ""), "pt-BR", {
        sensitivity: "base",
      }),
    )
    .map((item) => ({
      emailLivre: item.email || "",
      tipo: item.type || "principal",
      ultimoUsuario: item.lastUserName || "",
    }))
}

function getNumerosLivresData() {
  return [...(state.availablePhones || [])]
    .sort((a, b) => digits(a.number).localeCompare(digits(b.number), "pt-BR"))
    .map((item) => ({
      numeroLivre: formatBR(item.number),
      ultimoUsuario: item.lastUserName || "",
    }))
}

function styleSheet(sheet, lastColumnLetter) {
  const header = sheet.getRow(1)

  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1F4E78" },
    }
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    }
  })

  sheet.autoFilter = {
    from: "A1",
    to: `${lastColumnLetter}1`,
  }

  sheet.eachRow((row, rowNumber) => {
    row.alignment = { vertical: "middle", wrapText: true }

    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "EAEAEA" } },
        left: { style: "thin", color: { argb: "EAEAEA" } },
        bottom: { style: "thin", color: { argb: "EAEAEA" } },
        right: { style: "thin", color: { argb: "EAEAEA" } },
      }
    })

    if (rowNumber === 1) return

    if (rowNumber % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "F7F9FC" },
        }
      })
    }
  })
}

async function exportExcel(sheetType) {
  const workbook = new ExcelJS.Workbook()

  if (sheetType === "contatos" || sheetType === "all") {
    const contatosSheet = workbook.addWorksheet("Contatos", {
      views: [{ state: "frozen", ySplit: 1 }],
    })

    contatosSheet.columns = [
      { header: "Setor", key: "setor", width: 24 },
      { header: "Nome", key: "nome", width: 28 },
      { header: "E-mail Dipedra", key: "emailPrincipal", width: 30 },
      { header: "E-mail Pessoal", key: "emailPessoal", width: 30 },
      { header: "Telefone Dipedra", key: "telefoneDipedra", width: 18 },
      { header: "Telefone Pessoal", key: "telefonePessoal", width: 18 },
    ]

    getContatosData().forEach((item) => contatosSheet.addRow(item))
    const resumo = getResumoContatos()
    const resumoRow = contatosSheet.addRow({
      setor: "Total",
      nome: "",
      emailPrincipal: `E-mails Dipedra: ${resumo.emailsDipedra}`,
      emailPessoal: "",
      telefoneDipedra: `Números Dipedra: ${resumo.numerosDipedra}`,
      telefonePessoal: "",
    })
    resumoRow.font = { bold: true }
    styleSheet(contatosSheet, "F")
  }

  if (sheetType === "emails" || sheetType === "all") {
    const emailsSheet = workbook.addWorksheet("Emails Livres", {
      views: [{ state: "frozen", ySplit: 1 }],
    })

    emailsSheet.columns = [
      { header: "E-mail Livre", key: "emailLivre", width: 34 },
      { header: "Tipo", key: "tipo", width: 16 },
      { header: "Último Usuário", key: "ultimoUsuario", width: 24 },
    ]

    getEmailsLivresData().forEach((item) => emailsSheet.addRow(item))
    styleSheet(emailsSheet, "C")
  }

  if (sheetType === "numeros" || sheetType === "all") {
    const numerosSheet = workbook.addWorksheet("Numeros Livres", {
      views: [{ state: "frozen", ySplit: 1 }],
    })

    numerosSheet.columns = [
      { header: "Número Livre", key: "numeroLivre", width: 20 },
      { header: "Último Usuário", key: "ultimoUsuario", width: 24 },
    ]

    getNumerosLivresData().forEach((item) => numerosSheet.addRow(item))
    styleSheet(numerosSheet, "B")
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "gestor_contatos.xlsx"
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function drawPdfTitle(doc, title) {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text(title, 14, 12)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 18)
}

function exportContatosPdf(doc) {
  const contatos = getContatosData().map((item) => [
    item.setor,
    item.nome,
    item.emailPrincipal,
    item.emailPessoal,
    item.telefoneDipedra,
    item.telefonePessoal,
  ])

  drawPdfTitle(doc, "Contatos")

  doc.autoTable({
    startY: 24,
    head: [
      [
        "Setor",
        "Nome",
        "E-mail Dipedra",
        "E-mail Pessoal",
        "Telefone Dipedra",
        "Telefone Pessoal",
      ],
    ],
    body: contatos,
    styles: {
      font: "helvetica",
      fontSize: 6.8,
      cellPadding: 0.9,
      overflow: "linebreak",
      valign: "middle",
      lineWidth: 0.1,
      lineColor: [220, 220, 220],
    },
    headStyles: {
      fillColor: [31, 78, 120],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.2,
    },
    alternateRowStyles: {
      fillColor: [247, 249, 252],
    },
    margin: { top: 24, left: 6, right: 6 },
    tableWidth: "auto",
  })

  const resumo = getResumoContatos()
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 32
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text(`E-mails Dipedra: ${resumo.emailsDipedra}`, 14, finalY)
  doc.text(`Números Dipedra: ${resumo.numerosDipedra}`, 14, finalY + 5)
}

function exportEmailsPdf(doc) {
  const emails = getEmailsLivresData().map((item) => [
    item.emailLivre,
    item.tipo,
    item.ultimoUsuario,
  ])

  drawPdfTitle(doc, "E-mails Livres")

  doc.autoTable({
    startY: 24,
    head: [["E-mail Livre", "Tipo", "Último Usuário"]],
    body: emails,
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 1.2,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [31, 78, 120],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [247, 249, 252],
    },
    margin: { top: 24, left: 10, right: 10 },
    tableWidth: "auto",
  })
}

function exportNumerosPdf(doc) {
  const numeros = getNumerosLivresData().map((item) => [
    item.numeroLivre,
    item.ultimoUsuario,
  ])

  drawPdfTitle(doc, "Números Livres")

  doc.autoTable({
    startY: 24,
    head: [["Número Livre", "Último Usuário"]],
    body: numeros,
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 1.2,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [31, 78, 120],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [247, 249, 252],
    },
    margin: { top: 24, left: 20, right: 20 },
    tableWidth: "auto",
  })
}

async function exportPdf(sheetType) {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  })

  if (sheetType === "contatos") {
    exportContatosPdf(doc)
    doc.save("contatos_dipedra.pdf")
    return
  }

  if (sheetType === "emails") {
    exportEmailsPdf(doc)
    doc.save("emails_livres_dipedra.pdf")
    return
  }

  if (sheetType === "numeros") {
    exportNumerosPdf(doc)
    doc.save("numeros_livres_dipedra.pdf")
    return
  }

  exportContatosPdf(doc)
  doc.addPage("a4", "landscape")
  exportEmailsPdf(doc)
  doc.addPage("a4", "landscape")
  exportNumerosPdf(doc)

  doc.save("gestor_contatos_dipedra.pdf")
}

function openExportExcelModal() {
  openModal(
    "Exportar Excel",
    [
      {
        name: "sheetType",
        label: "Qual planilha deseja exportar?",
        type: "select",
        value: "all",
        options: [
          { value: "contatos", label: "Contatos" },
          { value: "emails", label: "E-mails Livres" },
          { value: "numeros", label: "Números Livres" },
          { value: "all", label: "Todas" },
        ],
      },
    ],
    async (values) => {
      await exportExcel(values.sheetType)
    },
  )
}

function openExportPdfModal() {
  openModal(
    "Exportar PDF",
    [
      {
        name: "sheetType",
        label: "Qual planilha deseja exportar?",
        type: "select",
        value: "all",
        options: [
          { value: "contatos", label: "Contatos" },
          { value: "emails", label: "E-mails Livres" },
          { value: "numeros", label: "Números Livres" },
          { value: "all", label: "Todas" },
        ],
      },
    ],
    async (values) => {
      await exportPdf(values.sheetType)
    },
  )
}

export function bindExportEvents() {
  if (btnExport) {
    btnExport.addEventListener("click", openExportExcelModal)
  }

  if (btnExportPdf) {
    btnExportPdf.addEventListener("click", openExportPdfModal)
  }
}
