// Simple key-based string dictionary (PRD §5: "not a general i18n
// framework") — a small, fixed set of UI strings translated once per
// language, not a scalable framework for arbitrary future languages.
// User-entered data (property/expense/category names) is never translated
// here, only static UI chrome.
const en = {
  "app.name": "Property expense tracker",

  "signIn.prompt": "Sign in to view and manage your portfolio.",
  "signIn.button": "Sign in with Google",
  "signIn.signingIn": "Signing in…",

  "nav.properties": "Properties",
  "nav.capture": "Capture",
  "nav.more": "More",
  "nav.categories": "Categories",
  "nav.settings": "Settings",
  "nav.signOut": "Sign out",
  "nav.signedInFallback": "Signed in",

  "nav.portfolio": "Portfolio",
  "nav.myPortfolio": "My portfolio",
  "nav.connectPortfolio": "Connect a portfolio",

  "settings.title": "Settings",
  "settings.current": "current",

  "driveMigration.title": "Organize Drive Storage",
  "driveMigration.description":
    "Move receipts already in Drive into folders organized by property.",
  "driveMigration.previewButton": "Preview what would move",
  "driveMigration.previewingButton": "Checking Drive…",
  "driveMigration.previewError": "Failed to check Drive.",
  "driveMigration.nothingToMove":
    "Everything's already organized — no files need to move.",
  "driveMigration.filesToMoveHeading": "Files to move",
  "driveMigration.orphansHeading":
    "Needs manual review (no matching expense found)",
  "driveMigration.runButton": "Move these files",
  "driveMigration.runningButton": "Moving files…",
  "driveMigration.runError": "Failed to move files.",
  "driveMigration.runSuccess":
    "Done — files have been moved into their property folders.",

  "historicalImport.title": "Import Historical Data",
  "historicalImport.description":
    "Upload a spreadsheet of past income and expenses to add them to your existing properties and categories.",
  "historicalImport.previewButton": "Preview import",
  "historicalImport.previewingButton": "Reading file…",
  "historicalImport.previewError": "Failed to read the file.",
  "historicalImport.unresolvedHeading":
    "Needs a match before importing",
  "historicalImport.unresolvedRowCount": "{count} row(s)",
  "historicalImport.mapToPlaceholder": "Choose a match",
  "historicalImport.needsReviewNotice":
    "{count} row(s) are flagged for review (e.g. an assumed date) — check them after importing.",
  "historicalImport.reconciliationHeading": "Reconciliation",
  "historicalImport.reconciliationLine": "Income {income} · Expenses {expenses}",
  "historicalImport.reconciliationMismatch":
    "Doesn't match this file's own monthly total — check the mapping above.",
  "historicalImport.dismissMismatch": "Dismiss this mismatch",
  "historicalImport.reconciliationDismissed":
    "Mismatch dismissed — this month will still be imported as computed.",
  "historicalImport.runButton": "Import these transactions",
  "historicalImport.runningButton": "Importing…",
  "historicalImport.runError": "Failed to import.",
  "historicalImport.runSuccess": "Done — the transactions have been imported.",

  "common.active": "Active",
  "common.archived": "Archived",
  "common.cancel": "Cancel",
  "common.edit": "Edit",
  "common.delete": "Delete",
  "common.deleteConfirm": "Delete this for good?",
  "common.undo": "Undo",
  "common.closed": "Closed",
  "common.archive": "Archive",
  "common.unarchive": "Unarchive",
  "common.rename": "Rename",
  "common.saveChanges": "Save changes",
  "common.loading": "Loading…",

  "properties.title": "My Properties",
  "properties.loading": "Loading your properties…",
  "properties.emptyState":
    "No properties yet — add your first one to get started.",
  "properties.addButton": "Add property",
  "properties.noneForStatus": "No {status} properties.",
  "properties.loadError":
    "Couldn't load your properties. Try reloading the page.",
  "properties.unitCount": "{count} units",
  "properties.portfolioNetLabel": "Portfolio net · {month}",
  "properties.portfolioIncomeExpenses": "Income {income} · Expenses {expenses}",
  "properties.noActivityYet": "No activity yet",

  "propertyForm.nameLabel": "Name",
  "propertyForm.addressLabel": "Address",

  "property.backLink": "My properties",
  "property.loadError": "Failed to load property.",
  "property.logIncomeQuickAction": "Log income",

  "buildings.addUnitButton": "Add unit",
  "buildings.promoteExplanation":
    "This turns this property into the first two units of a building — shared bills (like EMCALI) will live at the building level, separate from each unit's own income and expenses.",
  "buildings.buildingNameLabel": "Building name",
  "buildings.unitNameLabel": "Unit name",
  "buildings.unitNamePlaceholder": "e.g. 301",
  "buildings.promoteSaveButton": "Save",
  "buildings.promoteSavingButton": "Saving…",
  "buildings.buildingCosts": "Building costs",
  "buildings.unitsIncome": "Units income",
  "buildings.sharedBillsTitle": "Shared bills",
  "buildings.noSharedBillsYet":
    "No shared bills logged yet — log one above to get started.",
  "buildings.unitsTitle": "Units",
  "buildings.detailsTitle": "Building details",
  "buildings.addressLabel": "Address",
  "buildings.noAddress": "No address on file",
  "buildings.logExpenseAction": "Log building expense",

  "expenses.title": "Expenses",
  "expenses.total": "Total",
  "expenses.totalAllTime": "Total (all time)",
  "expenses.logButton": "Log expense",
  "expenses.loading": "Loading expenses…",
  "expenses.loadError": "Failed to load expenses.",
  "expenses.fromLabel": "From",
  "expenses.toLabel": "To",
  "expenses.emptyNoneYet": "No expenses yet — log one above to get started.",
  "expenses.emptyNoneInRange": "No expenses in this date range.",
  "expenses.unknownCategory": "Unknown category",
  "expenses.viewReceipt": "View receipt",
  "expenses.rowActions": "Expense actions",
  "expenses.deletedMessage": "Expense deleted",

  "capture.title": "Capture Receipt",

  "expenseForm.propertyLabel": "Property",
  "expenseForm.propertyPlaceholder": "Select a property…",
  "expenseForm.buildingLabel": "Building",
  "expenseForm.takePhotoButton": "Take photo of receipt",
  "expenseForm.receiptPreviewAlt": "Receipt preview",
  "expenseForm.readingReceipt": "Reading receipt…",
  "expenseForm.scopeLabel": "This expense is for",
  "expenseForm.scopeUnit": "This unit",
  "expenseForm.scopeBuilding": "Whole building",
  "expenseForm.amountLabel": "Amount",
  "expenseForm.dateLabel": "Date",
  "expenseForm.categoryLabel": "Category",
  "expenseForm.categoryPlaceholder": "Select a category…",
  "expenseForm.notesLabel": "Notes (optional)",
  "expenseForm.logButton": "Log expense",
  "expenseForm.loggingButton": "Logging…",

  "income.title": "Income",
  "income.logButton": "Log payment",
  "income.loading": "Loading income…",
  "income.loadError": "Failed to load income.",
  "income.emptyNoneYet":
    "No income logged yet — log a rent payment above to get started.",
  "income.rowActions": "Income actions",
  "income.deletedMessage": "Income entry deleted",
  "income.totalForYear": "Total ({year})",
  "income.totalAllTime": "Total (all time)",
  "income.onePayment": "1 payment",
  "income.paymentsCount": "{count} payments",
  "income.showAllMonths": "Show all {count} months",
  "income.showLastThreeMonths": "Show last 3 months",

  "incomeForm.amountLabel": "Amount",
  "incomeForm.dateLabel": "Date received",
  "incomeForm.notesLabel": "Notes (optional)",
  "incomeForm.logButton": "Log payment",
  "incomeForm.loggingButton": "Logging…",

  "tenancy.title": "Tenancy",
  "tenancy.addButton": "Add tenancy",
  "tenancy.loading": "Loading tenancy…",
  "tenancy.loadError": "Failed to load tenancy records.",
  "tenancy.emptyNoneYet":
    "No tenancy recorded yet — add one above to track contract dates and rent.",
  "tenancy.ongoing": "Ongoing",
  "tenancy.perMonth": "/ mo",
  "tenancy.noActiveTenancy": "No active tenancy",
  "tenancy.movedOutLabel": "Moved out {date}",
  "tenancy.recordMoveOutButton": "Record move-out",

  "tenancyForm.contractStartLabel": "Contract start",
  "tenancyForm.expectedEndLabel": "Expected end (optional)",
  "tenancyForm.rentRateLabel": "Rent rate",
  "tenancyForm.saveButton": "Save tenancy",
  "tenancyForm.savingButton": "Saving…",

  "summary.title": "Summary",
  "summary.yearLabel": "Year",
  "summary.income": "Income",
  "summary.expenses": "Expenses",

  "dashboard.title": "Dashboard",
  "dashboard.monthLabel": "Month",
  "dashboard.otherCategory": "Other",
  "dashboard.topCategoryHint": "Top category: {name} — {percent}%",
  "dashboard.emptyHint": "No expenses this month",
  "dashboard.backToDashboard": "Back to Dashboard",

  "categories.title": "Categories",
  "categories.noneForStatus": "No {status} categories.",
  "categories.addButton": "Add category",
  "categories.loading": "Loading your categories…",
  "categories.loadError":
    "Couldn't load your categories. Try reloading the page.",

  "categoryForm.nameLabel": "Name",

  "loggedStamp.text": "Logged",

  "portfolio.settingUp": "Setting up your portfolio…",
  "portfolio.loadError": "Failed to load your portfolio.",
  "portfolio.settingsLoadError": "Failed to load your account settings.",

  "connectPortfolio.labelLabel": "Label",
  "connectPortfolio.labelPlaceholder": "Mom's portfolio",
  "connectPortfolio.labelRequired": "Enter a label for this portfolio",
  "connectPortfolio.chooseButton": "Choose spreadsheet",
  "connectPortfolio.connectingButton": "Connecting…",
  "connectPortfolio.notConfigured": "Connecting a portfolio isn't set up yet.",
  "connectPortfolio.pickerError": "Failed to open the file picker.",
  "connectPortfolio.connectError": "Failed to connect that portfolio.",

  "validation.propertyNameRequired": "Name is required",
  "validation.categoryNameRequired": "Name is required",
  "validation.selectProperty": "Select a property",
  "validation.amountInvalid": "Enter an amount greater than zero",
  "validation.dateRequired": "Date is required",
  "validation.selectCategory": "Select a category",
  "validation.invalidInput": "Invalid input",
  "validation.buildingNameRequired": "Building name is required",
  "validation.unitNameRequired": "Unit name is required",

  "errors.saveExpenseFailed": "Failed to save expense",
  "errors.yearClosed": "{year} is closed — nothing can be added, edited, or deleted for that year.",

  "settings.closedYearsTitle": "Tax years",
  "settings.closedYearsDescription":
    "Closing a year locks it across every property in this portfolio — no more edits, deletes, or new entries dated within it. This can't be undone.",
  "settings.closeYearButton": "Close {year}",
  "settings.closingButton": "Closing…",
  "settings.closeYearConfirm":
    "This permanently locks every property's entries for {year} — you won't be able to edit, delete, or add anything dated in {year} afterward. This can't be undone.",
  "settings.closeYearConfirmButton": "Yes, close {year}",
} as const;

export type TranslationKey = keyof typeof en;

const es: Record<TranslationKey, string> = {
  "app.name": "Rastreador de gastos de propiedad",

  "signIn.prompt": "Inicia sesión para ver y administrar tu portafolio.",
  "signIn.button": "Iniciar sesión con Google",
  "signIn.signingIn": "Iniciando sesión…",

  "nav.properties": "Propiedades",
  "nav.capture": "Capturar",
  "nav.more": "Más",
  "nav.categories": "Categorías",
  "nav.settings": "Configuración",
  "nav.signOut": "Cerrar sesión",
  "nav.signedInFallback": "Sesión iniciada",

  "nav.portfolio": "Portafolio",
  "nav.myPortfolio": "Mi portafolio",
  "nav.connectPortfolio": "Conectar un portafolio",

  "settings.title": "Configuración",
  "settings.current": "actual",

  "driveMigration.title": "Organizar almacenamiento de Drive",
  "driveMigration.description":
    "Mueve los recibos que ya están en Drive a carpetas organizadas por propiedad.",
  "driveMigration.previewButton": "Vista previa de lo que se movería",
  "driveMigration.previewingButton": "Revisando Drive…",
  "driveMigration.previewError": "No se pudo revisar Drive.",
  "driveMigration.nothingToMove":
    "Todo ya está organizado — no hay archivos por mover.",
  "driveMigration.filesToMoveHeading": "Archivos por mover",
  "driveMigration.orphansHeading":
    "Necesitan revisión manual (sin gasto correspondiente)",
  "driveMigration.runButton": "Mover estos archivos",
  "driveMigration.runningButton": "Moviendo archivos…",
  "driveMigration.runError": "No se pudieron mover los archivos.",
  "driveMigration.runSuccess":
    "Listo — los archivos se movieron a sus carpetas de propiedad.",

  "historicalImport.title": "Importar datos históricos",
  "historicalImport.description":
    "Sube una hoja de cálculo con ingresos y gastos pasados para agregarlos a tus propiedades y categorías existentes.",
  "historicalImport.previewButton": "Vista previa de la importación",
  "historicalImport.previewingButton": "Leyendo archivo…",
  "historicalImport.previewError": "No se pudo leer el archivo.",
  "historicalImport.unresolvedHeading":
    "Necesita una coincidencia antes de importar",
  "historicalImport.unresolvedRowCount": "{count} fila(s)",
  "historicalImport.mapToPlaceholder": "Elige una coincidencia",
  "historicalImport.needsReviewNotice":
    "{count} fila(s) están marcadas para revisión (p. ej. una fecha asumida) — revísalas después de importar.",
  "historicalImport.reconciliationHeading": "Conciliación",
  "historicalImport.reconciliationLine": "Ingresos {income} · Gastos {expenses}",
  "historicalImport.reconciliationMismatch":
    "No coincide con el total mensual del archivo — revisa la coincidencia arriba.",
  "historicalImport.dismissMismatch": "Descartar esta discrepancia",
  "historicalImport.reconciliationDismissed":
    "Discrepancia descartada — este mes se importará tal como se calculó.",
  "historicalImport.runButton": "Importar estas transacciones",
  "historicalImport.runningButton": "Importando…",
  "historicalImport.runError": "No se pudo importar.",
  "historicalImport.runSuccess": "Listo — las transacciones se importaron.",

  "common.active": "Activas",
  "common.archived": "Archivadas",
  "common.cancel": "Cancelar",
  "common.edit": "Editar",
  "common.delete": "Eliminar",
  "common.deleteConfirm": "¿Eliminar esto definitivamente?",
  "common.undo": "Deshacer",
  "common.closed": "Cerrado",
  "common.archive": "Archivar",
  "common.unarchive": "Desarchivar",
  "common.rename": "Renombrar",
  "common.saveChanges": "Guardar cambios",
  "common.loading": "Cargando…",

  "properties.title": "Mis Propiedades",
  "properties.loading": "Cargando tus propiedades…",
  "properties.emptyState":
    "Aún no tienes propiedades — agrega la primera para empezar.",
  "properties.addButton": "Agregar propiedad",
  "properties.noneForStatus": "No hay propiedades {status}.",
  "properties.loadError":
    "No se pudieron cargar tus propiedades. Intenta recargar la página.",
  "properties.unitCount": "{count} unidades",
  "properties.portfolioNetLabel": "Neto del portafolio · {month}",
  "properties.portfolioIncomeExpenses": "Ingresos {income} · Gastos {expenses}",
  "properties.noActivityYet": "Sin actividad aún",

  "propertyForm.nameLabel": "Nombre",
  "propertyForm.addressLabel": "Dirección",

  "property.backLink": "Mis propiedades",
  "property.loadError": "No se pudo cargar la propiedad.",
  "property.logIncomeQuickAction": "Registrar pago",

  "buildings.addUnitButton": "Agregar unidad",
  "buildings.promoteExplanation":
    "Esto convierte esta propiedad en las primeras dos unidades de un edificio — las cuentas compartidas (como EMCALI) quedarán a nivel del edificio, separadas de los ingresos y gastos propios de cada unidad.",
  "buildings.buildingNameLabel": "Nombre del edificio",
  "buildings.unitNameLabel": "Nombre de la unidad",
  "buildings.unitNamePlaceholder": "ej. 301",
  "buildings.promoteSaveButton": "Guardar",
  "buildings.promoteSavingButton": "Guardando…",
  "buildings.buildingCosts": "Gastos del edificio",
  "buildings.unitsIncome": "Ingresos de las unidades",
  "buildings.sharedBillsTitle": "Cuentas compartidas",
  "buildings.noSharedBillsYet":
    "Aún no hay cuentas compartidas registradas — registra una arriba para empezar.",
  "buildings.unitsTitle": "Unidades",
  "buildings.detailsTitle": "Detalles del edificio",
  "buildings.addressLabel": "Dirección",
  "buildings.noAddress": "Sin dirección registrada",
  "buildings.logExpenseAction": "Registrar gasto del edificio",

  "expenses.title": "Gastos",
  "expenses.total": "Total",
  "expenses.totalAllTime": "Total (histórico)",
  "expenses.logButton": "Registrar gasto",
  "expenses.loading": "Cargando gastos…",
  "expenses.loadError": "No se pudieron cargar los gastos.",
  "expenses.fromLabel": "Desde",
  "expenses.toLabel": "Hasta",
  "expenses.emptyNoneYet":
    "Aún no hay gastos — registra uno arriba para empezar.",
  "expenses.emptyNoneInRange": "No hay gastos en este rango de fechas.",
  "expenses.unknownCategory": "Categoría desconocida",
  "expenses.viewReceipt": "Ver recibo",
  "expenses.rowActions": "Acciones del gasto",
  "expenses.deletedMessage": "Gasto eliminado",

  "capture.title": "Capturar Recibo",

  "expenseForm.propertyLabel": "Propiedad",
  "expenseForm.propertyPlaceholder": "Selecciona una propiedad…",
  "expenseForm.buildingLabel": "Edificio",
  "expenseForm.takePhotoButton": "Tomar foto del recibo",
  "expenseForm.receiptPreviewAlt": "Vista previa del recibo",
  "expenseForm.readingReceipt": "Leyendo recibo…",
  "expenseForm.scopeLabel": "Este gasto es para",
  "expenseForm.scopeUnit": "Esta unidad",
  "expenseForm.scopeBuilding": "Todo el edificio",
  "expenseForm.amountLabel": "Monto",
  "expenseForm.dateLabel": "Fecha",
  "expenseForm.categoryLabel": "Categoría",
  "expenseForm.categoryPlaceholder": "Selecciona una categoría…",
  "expenseForm.notesLabel": "Notas (opcional)",
  "expenseForm.logButton": "Registrar gasto",
  "expenseForm.loggingButton": "Registrando…",

  "income.title": "Ingresos",
  "income.logButton": "Registrar pago",
  "income.loading": "Cargando ingresos…",
  "income.loadError": "No se pudieron cargar los ingresos.",
  "income.emptyNoneYet":
    "Aún no hay ingresos registrados — registra un pago de alquiler arriba para empezar.",
  "income.rowActions": "Acciones del ingreso",
  "income.deletedMessage": "Ingreso eliminado",
  "income.totalForYear": "Total ({year})",
  "income.totalAllTime": "Total (histórico)",
  "income.onePayment": "1 pago",
  "income.paymentsCount": "{count} pagos",
  "income.showAllMonths": "Mostrar los {count} meses",
  "income.showLastThreeMonths": "Mostrar últimos 3 meses",

  "incomeForm.amountLabel": "Monto",
  "incomeForm.dateLabel": "Fecha de recibo",
  "incomeForm.notesLabel": "Notas (opcional)",
  "incomeForm.logButton": "Registrar pago",
  "incomeForm.loggingButton": "Registrando…",

  "tenancy.title": "Arrendamiento",
  "tenancy.addButton": "Agregar arrendamiento",
  "tenancy.loading": "Cargando arrendamiento…",
  "tenancy.loadError": "No se pudieron cargar los arrendamientos.",
  "tenancy.emptyNoneYet":
    "Aún no hay arrendamientos registrados — agrega uno arriba para llevar el control de fechas y renta.",
  "tenancy.ongoing": "En curso",
  "tenancy.perMonth": "/ mes",
  "tenancy.noActiveTenancy": "Sin arrendamiento activo",
  "tenancy.movedOutLabel": "Salió el {date}",
  "tenancy.recordMoveOutButton": "Registrar salida",

  "tenancyForm.contractStartLabel": "Inicio del contrato",
  "tenancyForm.expectedEndLabel": "Fin previsto (opcional)",
  "tenancyForm.rentRateLabel": "Valor del arriendo",
  "tenancyForm.saveButton": "Guardar arrendamiento",
  "tenancyForm.savingButton": "Guardando…",

  "summary.title": "Resumen",
  "summary.yearLabel": "Año",
  "summary.income": "Ingresos",
  "summary.expenses": "Gastos",

  "dashboard.title": "Panel",
  "dashboard.monthLabel": "Mes",
  "dashboard.otherCategory": "Otros",
  "dashboard.topCategoryHint": "Categoría principal: {name} — {percent}%",
  "dashboard.emptyHint": "No hay gastos este mes",
  "dashboard.backToDashboard": "Volver al panel",

  "categories.title": "Categorías",
  "categories.noneForStatus": "No hay categorías {status}.",
  "categories.addButton": "Agregar categoría",
  "categories.loading": "Cargando tus categorías…",
  "categories.loadError":
    "No se pudieron cargar tus categorías. Intenta recargar la página.",

  "categoryForm.nameLabel": "Nombre",

  "loggedStamp.text": "Registrado",

  "portfolio.settingUp": "Preparando tu portafolio…",
  "portfolio.loadError": "No se pudo cargar tu portafolio.",
  "portfolio.settingsLoadError":
    "No se pudo cargar la configuración de tu cuenta.",

  "connectPortfolio.labelLabel": "Etiqueta",
  "connectPortfolio.labelPlaceholder": "Portafolio de mamá",
  "connectPortfolio.labelRequired": "Ingresa una etiqueta para este portafolio",
  "connectPortfolio.chooseButton": "Elegir hoja de cálculo",
  "connectPortfolio.connectingButton": "Conectando…",
  "connectPortfolio.notConfigured":
    "Conectar un portafolio aún no está configurado.",
  "connectPortfolio.pickerError": "No se pudo abrir el selector de archivos.",
  "connectPortfolio.connectError": "No se pudo conectar ese portafolio.",

  "validation.propertyNameRequired": "El nombre es obligatorio",
  "validation.categoryNameRequired": "El nombre es obligatorio",
  "validation.selectProperty": "Selecciona una propiedad",
  "validation.amountInvalid": "Ingresa un monto mayor que cero",
  "validation.dateRequired": "La fecha es obligatoria",
  "validation.selectCategory": "Selecciona una categoría",
  "validation.invalidInput": "Entrada no válida",
  "validation.buildingNameRequired": "El nombre del edificio es obligatorio",
  "validation.unitNameRequired": "El nombre de la unidad es obligatorio",

  "errors.saveExpenseFailed": "No se pudo guardar el gasto",
  "errors.yearClosed":
    "{year} está cerrado — no se puede agregar, editar ni eliminar nada de ese año.",

  "settings.closedYearsTitle": "Años fiscales",
  "settings.closedYearsDescription":
    "Cerrar un año lo bloquea en todas las propiedades de este portafolio — ya no se podrán editar, eliminar ni agregar entradas de ese año. Esto no se puede deshacer.",
  "settings.closeYearButton": "Cerrar {year}",
  "settings.closingButton": "Cerrando…",
  "settings.closeYearConfirm":
    "Esto bloquea permanentemente las entradas de {year} en todas las propiedades — no podrás editar, eliminar ni agregar nada con fecha de {year} después de esto. No se puede deshacer.",
  "settings.closeYearConfirmButton": "Sí, cerrar {year}",
};

export const translations = { en, es } as const;
