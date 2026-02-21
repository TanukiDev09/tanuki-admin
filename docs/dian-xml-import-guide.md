# Guía de Importación de Facturas XML DIAN

## Descripción General

Este sistema permite importar facturas electrónicas de la DIAN en formato XML (UBL 2.1) de dos maneras:
1. **Script de Python**: Para procesamiento masivo de carpetas completas
2. **Interfaz Web**: Para carga manual individual o por lotes

## Usando el Script de Python

### Instalación

1. Instalar dependencias:
```bash
cd scripts
pip install -r requirements.txt
```

2. Configurar variables de entorno:
Asegúrate de tener `MONGODB_URI` en tu archivo `.env`

### Uso Básico

#### Modo Dry-Run (Sin Importar)
```bash
python process_dian_invoices.py --folder data/Facturas-2025 --dry-run
```

Este modo procesa los XMLs y muestra ejemplos sin importar a la base de datos.

#### Importar a Base de Datos
```bash
python process_dian_invoices.py --folder data/Facturas-2025 --import
```

El script pedirá confirmación antes de importar.

### Características

- ✅ Procesamiento recursivo de carpetas y subcarpetas
- ✅ Extracción completa de datos DIAN
- ✅ Detección automática de suscripción a newsletter
- ✅ Manejo de errores por archivo (continúa si un archivo falla)
- ✅ Muestra 2 ejemplos de facturas procesadas
- ✅ Salida con colores para mejor legibilidad
- ✅ Upsert (actualiza si existe, crea si no)

### Salida del Script

El script muestra:
- Progreso de procesamiento archivo por archivo
- Resumen de éxitos y errores
- 2 ejemplos de facturas procesadas con detalles
- Confirmación antes de importar

## Usando la Interfaz Web

### Acceso

Navega a: `/dashboard/invoices/upload-xml`

### Proceso de Carga

#### Paso 1: Cargar Archivos
- Arrastra archivos XML a la zona de carga
- O haz clic para seleccionar archivos
- Soporta carga individual o múltiple

#### Paso 2: Procesar
- Revisa la lista de archivos cargados
- Haz clic en "Procesar Archivos"
- El sistema procesará cada archivo automáticamente
- Verás el progreso en tiempo real

#### Paso 3: Confirmar
- Revisa el resumen de importación
- Ver estadísticas de éxitos/errores
- Opciones:
  - "Ver Facturas": Ir a la lista de facturas
  - "Importar Más": Volver a cargar más archivos

### Características de la Interfaz

- 🎨 Diseño moderno con glassmorphism
- 📤 Drag & drop intuitivo
- 📊 Vista previa de datos de factura
- 📧 Badge de newsletter visible
- ⚡ Procesamiento en tiempo real
- ✨ Animaciones suaves
- 📱 Diseño responsivo

## Mapeo de Campos

### Datos Básicos de Factura

| Campo DIAN XML | Campo Interno | Notas |
|----------------|---------------|-------|
| `cbc:ID` | `number` | Número de factura |
| `cbc:UUID` | `cufe` | Código Único de Factura Electrónica |
| `cbc:IssueDate` | `date` | Fecha de emisión |
| `cbc:DueDate` | `dueDate` | Fecha de vencimiento |
| `cac:LegalMonetaryTotal/cbc:PayableAmount` | `total` | Total a pagar |
| `cac:LegalMonetaryTotal/cbc:LineExtensionAmount` | `subtotal` | Subtotal |
| `cac:TaxTotal/cbc:TaxAmount` | `tax` | Impuestos |

### Datos del Cliente

| Campo DIAN XML | Campo Interno | Notas |
|----------------|---------------|-------|
| `cac:PartyTaxScheme/cbc:RegistrationName` | `customerName` | Nombre del cliente |
| `cac:PartyTaxScheme/cbc:CompanyID` | `customerTaxId` | NIT o Cédula |
| `cbc:CompanyID@schemeID` | `customerDocumentType` | Tipo de documento (1=CC, 3=NIT) |
| `cac:Contact/cbc:ElectronicMail` | `customerEmail` | Email |
| `cac:Contact/cbc:Telephone` | `customerPhone` | Teléfono |
| `cac:Address/cac:AddressLine/cbc:Line` | `customerAddress` | Dirección |
| `cac:Address/cbc:CityName` | `customerCity` | Ciudad |

### Líneas de Factura

| Campo DIAN XML | Campo Interno | Notas |
|----------------|---------------|-------|
| `cac:Item/cbc:Description` | `items[].description` | Descripción del producto |
| `cbc:InvoicedQuantity` | `items[].quantity` | Cantidad |
| `cac:Price/cbc:PriceAmount` | `items[].unitPrice` | Precio unitario |
| `cbc:LineExtensionAmount` | `items[].total` | Total de la línea |

### Datos DIAN Específicos

| Campo DIAN XML | Campo Interno | Notas |
|----------------|---------------|-------|
| `sts:InvoiceAuthorization` | `dianData.invoiceAuthorization` | Autorización DIAN |
| `sts:AuthorizationPeriod` | `dianData.authorizationPeriod` | Período de autorización |
| `sts:SoftwareProvider/sts:ProviderID` | `dianData.softwareProvider` | Proveedor de software |
| `sts:SoftwareProvider/sts:SoftwareID` | `dianData.softwareId` | ID del software |

## Detección de Newsletter

### Regla de Negocio

Una factura indica suscripción al newsletter cuando:
1. El cliente es **persona natural** (`schemeID="1"` = Cédula de Ciudadanía)
2. **Y** la factura tiene una **orden de compra** (`cac:OrderReference/cbc:ID`)

### Ejemplo

```xml
<!-- Cliente persona natural -->
<cbc:CompanyID schemeID="1">1234567890</cbc:CompanyID>

<!-- Con orden de compra -->
<cac:OrderReference>
  <cbc:ID>52109/53298</cbc:ID>
</cac:OrderReference>
```

Resultado: `newsletterSignup = true`

### Visualización

En la interfaz web, las facturas con newsletter signup muestran un badge especial: 📧 Newsletter

## Manejo de Errores

### Errores Comunes

1. **XML mal formado**
   - El script continúa con el siguiente archivo
   - Se muestra el error específico

2. **Factura duplicada**
   - Se actualiza la factura existente (upsert)
   - No se crea duplicado

3. **Campos faltantes**
   - Se usan valores por defecto
   - La factura se crea con los datos disponibles

4. **Conexión a base de datos**
   - Verifica `MONGODB_URI` en `.env`
   - Asegúrate de que MongoDB esté corriendo

## Ejemplos

### Ejemplo 1: Procesamiento Exitoso

```
Processing: 2025-FE1278.xml... ✓
Processing: 2025-FE1280.xml... ✓

============================================================
✓ Successfully processed: 2
============================================================

Example 1:
  Number: FE1278
  Customer: Panamericana Libreria y Papeleria S.A.
  Tax ID: 830037946
  Total: $62,700.00 COP
  Items: 2
  CUFE: d589740deaa576f134a6915f54eb4b9eaa9ac...
  Newsletter Signup: true
  Order Reference: 52109/53298
```

### Ejemplo 2: Con Errores

```
Processing: 2025-FE1278.xml... ✓
Processing: invalid.xml... ✗

============================================================
✓ Successfully processed: 1
✗ Errors: 1
============================================================
```

## Verificación

### Verificar en MongoDB

```javascript
// Contar facturas DIAN importadas
db.invoices.countDocuments({ cufe: { $exists: true } })

// Ver facturas con newsletter
db.invoices.find({ newsletterSignup: true })

// Ver una factura completa
db.invoices.findOne({ number: "FE1278" })
```

### Verificar en la Interfaz

1. Ir a `/dashboard/invoices`
2. Buscar por número de factura
3. Verificar que todos los campos estén presentes
4. Confirmar badge de newsletter si aplica

## Solución de Problemas

### El script no encuentra archivos XML

- Verifica la ruta de la carpeta
- Asegúrate de que los archivos tengan extensión `.xml`
- Usa rutas absolutas si es necesario

### Error de conexión a MongoDB

- Verifica que MongoDB esté corriendo
- Confirma `MONGODB_URI` en `.env`
- Prueba la conexión manualmente

### La interfaz web no carga archivos

- Verifica que sean archivos `.xml` válidos
- Revisa la consola del navegador para errores
- Asegúrate de que el API endpoint esté funcionando

### Facturas duplicadas

- El sistema usa `number` como clave única
- Las facturas duplicadas se actualizan automáticamente
- No se crean múltiples copias

## Notas Técnicas

### Formato XML Soportado

- UBL 2.1
- Formato DIAN Colombia
- AttachedDocument con Invoice embebido en CDATA

### Limitaciones

- Solo procesa facturas de venta (Invoice)
- No procesa notas crédito/débito (requiere implementación adicional)
- Los archivos XML no se almacenan (solo se procesan)

### Rendimiento

- Script de Python: ~100 facturas/minuto
- Interfaz web: Depende de la conexión
- Batch processing recomendado para >50 facturas
