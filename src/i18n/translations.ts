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

  "settings.title": "Settings",
  "settings.current": "current",

  "common.active": "Active",
  "common.archived": "Archived",
  "common.cancel": "Cancel",
  "common.edit": "Edit",
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

  "propertyForm.nameLabel": "Name",
  "propertyForm.addressLabel": "Address",

  "property.backLink": "My properties",
  "property.loadError": "Failed to load property.",

  "expenses.title": "Expenses",
  "expenses.total": "Total",
  "expenses.logButton": "Log expense",
  "expenses.loading": "Loading expenses…",
  "expenses.loadError": "Failed to load expenses.",
  "expenses.fromLabel": "From",
  "expenses.toLabel": "To",
  "expenses.emptyNoneYet": "No expenses yet — log one above to get started.",
  "expenses.emptyNoneInRange": "No expenses in this date range.",
  "expenses.unknownCategory": "Unknown category",
  "expenses.viewReceipt": "View receipt",

  "capture.title": "Capture Receipt",

  "expenseForm.propertyLabel": "Property",
  "expenseForm.propertyPlaceholder": "Select a property…",
  "expenseForm.takePhotoButton": "Take photo of receipt",
  "expenseForm.receiptPreviewAlt": "Receipt preview",
  "expenseForm.readingReceipt": "Reading receipt…",
  "expenseForm.vendorLabel": "Vendor",
  "expenseForm.amountLabel": "Amount",
  "expenseForm.dateLabel": "Date",
  "expenseForm.categoryLabel": "Category",
  "expenseForm.categoryPlaceholder": "Select a category…",
  "expenseForm.notesLabel": "Notes (optional)",
  "expenseForm.logButton": "Log expense",
  "expenseForm.loggingButton": "Logging…",

  "income.title": "Income",
  "income.total": "Total",
  "income.logButton": "Log payment",
  "income.loading": "Loading income…",
  "income.loadError": "Failed to load income.",
  "income.fromLabel": "From",
  "income.toLabel": "To",
  "income.emptyNoneYet":
    "No income logged yet — log a rent payment above to get started.",
  "income.emptyNoneInRange": "No income in this date range.",

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
  "tenancy.movedOutLabel": "Moved out {date}",
  "tenancy.recordMoveOutButton": "Record move-out",

  "tenancyForm.contractStartLabel": "Contract start",
  "tenancyForm.expectedEndLabel": "Expected end (optional)",
  "tenancyForm.rentRateLabel": "Rent rate",
  "tenancyForm.saveButton": "Save tenancy",
  "tenancyForm.savingButton": "Saving…",

  "summary.title": "Summary",
  "summary.modeTaxYear": "Tax year",
  "summary.modeCustomRange": "Custom range",
  "summary.yearLabel": "Year",
  "summary.fromLabel": "From",
  "summary.toLabel": "To",
  "summary.moneyIn": "Money in",
  "summary.moneyOut": "Money out",
  "summary.moneyLeftOver": "Money left over",

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

  "validation.propertyNameRequired": "Name is required",
  "validation.categoryNameRequired": "Name is required",
  "validation.selectProperty": "Select a property",
  "validation.vendorRequired": "Vendor is required",
  "validation.amountInvalid": "Enter an amount greater than zero",
  "validation.dateRequired": "Date is required",
  "validation.selectCategory": "Select a category",
  "validation.invalidInput": "Invalid input",

  "errors.saveExpenseFailed": "Failed to save expense",
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

  "settings.title": "Configuración",
  "settings.current": "actual",

  "common.active": "Activas",
  "common.archived": "Archivadas",
  "common.cancel": "Cancelar",
  "common.edit": "Editar",
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

  "propertyForm.nameLabel": "Nombre",
  "propertyForm.addressLabel": "Dirección",

  "property.backLink": "Mis propiedades",
  "property.loadError": "No se pudo cargar la propiedad.",

  "expenses.title": "Gastos",
  "expenses.total": "Total",
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

  "capture.title": "Capturar Recibo",

  "expenseForm.propertyLabel": "Propiedad",
  "expenseForm.propertyPlaceholder": "Selecciona una propiedad…",
  "expenseForm.takePhotoButton": "Tomar foto del recibo",
  "expenseForm.receiptPreviewAlt": "Vista previa del recibo",
  "expenseForm.readingReceipt": "Leyendo recibo…",
  "expenseForm.vendorLabel": "Proveedor",
  "expenseForm.amountLabel": "Monto",
  "expenseForm.dateLabel": "Fecha",
  "expenseForm.categoryLabel": "Categoría",
  "expenseForm.categoryPlaceholder": "Selecciona una categoría…",
  "expenseForm.notesLabel": "Notas (opcional)",
  "expenseForm.logButton": "Registrar gasto",
  "expenseForm.loggingButton": "Registrando…",

  "income.title": "Ingresos",
  "income.total": "Total",
  "income.logButton": "Registrar pago",
  "income.loading": "Cargando ingresos…",
  "income.loadError": "No se pudieron cargar los ingresos.",
  "income.fromLabel": "Desde",
  "income.toLabel": "Hasta",
  "income.emptyNoneYet":
    "Aún no hay ingresos registrados — registra un pago de alquiler arriba para empezar.",
  "income.emptyNoneInRange": "No hay ingresos en este rango de fechas.",

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
  "tenancy.movedOutLabel": "Salió el {date}",
  "tenancy.recordMoveOutButton": "Registrar salida",

  "tenancyForm.contractStartLabel": "Inicio del contrato",
  "tenancyForm.expectedEndLabel": "Fin previsto (opcional)",
  "tenancyForm.rentRateLabel": "Valor del arriendo",
  "tenancyForm.saveButton": "Guardar arrendamiento",
  "tenancyForm.savingButton": "Guardando…",

  "summary.title": "Resumen",
  "summary.modeTaxYear": "Año fiscal",
  "summary.modeCustomRange": "Rango personalizado",
  "summary.yearLabel": "Año",
  "summary.fromLabel": "Desde",
  "summary.toLabel": "Hasta",
  "summary.moneyIn": "Dinero recibido",
  "summary.moneyOut": "Dinero gastado",
  "summary.moneyLeftOver": "Dinero restante",

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

  "validation.propertyNameRequired": "El nombre es obligatorio",
  "validation.categoryNameRequired": "El nombre es obligatorio",
  "validation.selectProperty": "Selecciona una propiedad",
  "validation.vendorRequired": "El proveedor es obligatorio",
  "validation.amountInvalid": "Ingresa un monto mayor que cero",
  "validation.dateRequired": "La fecha es obligatoria",
  "validation.selectCategory": "Selecciona una categoría",
  "validation.invalidInput": "Entrada no válida",

  "errors.saveExpenseFailed": "No se pudo guardar el gasto",
};

export const translations = { en, es } as const;
