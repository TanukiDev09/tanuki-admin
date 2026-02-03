# Documentación: Estructura XML de Factura Electrónica DIAN

## Información General

La Dirección de Impuestos y Aduanas Nacionales (DIAN) de Colombia establece que las facturas electrónicas deben generarse en formato XML basado en el estándar **Universal Business Language (UBL) versión 2.1**.

### Fuentes Oficiales
- Anexo Técnico de Factura Electrónica (DIAN)
- Estándar UBL 2.1 (OASIS)
- Política de firma: https://facturaelectronica.dian.gov.co/politicadefirma/v2/politicadefirmav2.pdf

## Estructura del Documento XML

### 1. Contenedor Principal: `AttachedDocument`

El XML de la DIAN utiliza un contenedor `AttachedDocument` que envuelve la factura real y su respuesta de validación.

**Namespace**: `urn:oasis:names:specification:ubl:schema:xsd:AttachedDocument-2`

#### Elementos Principales:
- `ext:UBLExtensions` - Extensiones con firmas digitales
- `cbc:UBLVersionID` - Versión UBL (2.1)
- `cbc:CustomizationID` - "Documentos adjuntos"
- `cbc:ProfileID` - "Factura Electrónica de Venta"
- `cbc:ID` - Identificador único del contenedor
- `cbc:IssueDate` - Fecha de emisión
- `cbc:IssueTime` - Hora de emisión
- `cbc:DocumentType` - "Contenedor de Factura Electrónica"
- `cbc:ParentDocumentID` - Número de factura (ej: FE1278)
- `cac:SenderParty` - Información del emisor
- `cac:ReceiverParty` - Información del receptor
- `cac:Attachment` - Contiene la factura embebida en CDATA

### 2. Factura Embebida: `Invoice`

Dentro del `AttachedDocument`, en la sección `cac:Attachment/cac:ExternalReference/cbc:Description`, se encuentra la factura real en formato CDATA.

**Namespace**: `urn:oasis:names:specification:ubl:schema:xsd:Invoice-2`

#### 2.1 Extensiones DIAN (`sts:DianExtensions`)

```xml
<sts:InvoiceControl>
  <sts:InvoiceAuthorization> - Número de autorización DIAN
  <sts:AuthorizationPeriod> - Período de vigencia
  <sts:AuthorizedInvoices> - Rango de numeración autorizado
    <sts:Prefix> - Prefijo (ej: FE)
    <sts:From> - Número inicial
    <sts:To> - Número final
</sts:InvoiceControl>

<sts:InvoiceSource> - País de origen (CO)
<sts:SoftwareProvider> - Proveedor del software de facturación
<sts:SoftwareSecurityCode> - Código de seguridad del software
<sts:AuthorizationProvider> - Proveedor de autorización
<sts:QRCode> - URL del código QR para verificación
```

#### 2.2 Información Básica de la Factura

| Etiqueta | Descripción | Ejemplo |
|----------|-------------|---------|
| `cbc:ID` | Número de factura | FE1278 |
| `cbc:UUID` | CUFE (Código Único de Factura Electrónica) SHA-384 | d589740deaa576f134a6915f... |
| `cbc:IssueDate` | Fecha de emisión | 2025-01-02 |
| `cbc:IssueTime` | Hora de emisión | 02:22:33-05:00 |
| `cbc:DueDate` | Fecha de vencimiento | 2025-02-01 |
| `cbc:InvoiceTypeCode` | Tipo de factura | 01 (Factura de venta) |
| `cbc:DocumentCurrencyCode` | Moneda | COP |
| `cbc:LineCountNumeric` | Número de líneas | 2 |

#### 2.3 Notas (`cbc:Note`)

Las facturas pueden contener múltiples notas con información adicional:
- Saldo pendiente
- Información del establecimiento
- Software utilizado
- Responsabilidad del emisor

#### 2.4 Orden de Compra (`cac:OrderReference`)

```xml
<cac:OrderReference>
  <cbc:ID> - Número de orden de compra
  <cbc:IssueDate> - Fecha de la orden
</cac:OrderReference>
```

**IMPORTANTE**: En nuestro sistema, cuando una persona natural (identificada con cédula) tiene una orden de compra, esto indica que ha aceptado formar parte del newsletter.

#### 2.5 Proveedor (`cac:AccountingSupplierParty`)

```xml
<cac:Party>
  <cbc:IndustryClassificationCode> - Código CIIU
  <cac:PartyName>
    <cbc:Name> - Nombre comercial
  </cac:PartyName>
  <cac:PhysicalLocation>
    <cac:Address>
      <cbc:ID> - Código de ciudad
      <cbc:CityName> - Ciudad
      <cbc:PostalZone> - Código postal
      <cbc:CountrySubentity> - Departamento
      <cbc:CountrySubentityCode> - Código de departamento
      <cac:AddressLine>
        <cbc:Line> - Dirección completa
      </cac:AddressLine>
      <cac:Country>
        <cbc:IdentificationCode> - CO
        <cbc:Name> - Colombia
      </cac:Country>
    </cac:Address>
  </cac:PhysicalLocation>
  <cac:PartyTaxScheme>
    <cbc:RegistrationName> - Razón social
    <cbc:CompanyID schemeID="4"> - NIT (schemeID 4 = NIT)
    <cbc:TaxLevelCode> - Régimen tributario (ej: O-23)
    <cac:TaxScheme>
      <cbc:ID> - 01 (IVA)
      <cbc:Name> - IVA
    </cac:TaxScheme>
  </cac:PartyTaxScheme>
  <cac:Contact>
    <cbc:Name> - Nombre de contacto
    <cbc:Telephone> - Teléfono
    <cbc:ElectronicMail> - Email
  </cac:Contact>
</cac:Party>
```

#### 2.6 Cliente (`cac:AccountingCustomerParty`)

Estructura similar al proveedor, con los siguientes `schemeID` para identificación:
- `schemeID="3"` - NIT (persona jurídica)
- `schemeID="1"` - Cédula de ciudadanía (persona natural)
- `schemeID="7"` - Otro tipo de documento

#### 2.7 Medios de Pago (`cac:PaymentMeans`)

```xml
<cbc:ID> - Identificador del medio de pago
<cbc:PaymentMeansCode> - Código (ej: ZZZ = Otro)
<cbc:PaymentDueDate> - Fecha de vencimiento
<cbc:PaymentID> - ID de pago
```

#### 2.8 Totales de Impuestos (`cac:TaxTotal`)

```xml
<cbc:TaxAmount currencyID="COP"> - Total de impuestos
<cac:TaxSubtotal>
  <cbc:TaxableAmount> - Base gravable
  <cbc:TaxAmount> - Monto del impuesto
  <cac:TaxCategory>
    <cbc:Percent> - Porcentaje
    <cac:TaxScheme>
      <cbc:ID> - 01 (IVA)
      <cbc:Name> - IVA
    </cac:TaxScheme>
  </cac:TaxCategory>
</cac:TaxSubtotal>
```

#### 2.9 Totales Monetarios (`cac:LegalMonetaryTotal`)

```xml
<cbc:LineExtensionAmount> - Subtotal (sin impuestos ni descuentos)
<cbc:TaxExclusiveAmount> - Total sin impuestos
<cbc:TaxInclusiveAmount> - Total con impuestos
<cbc:AllowanceTotalAmount> - Total de descuentos
<cbc:PayableRoundingAmount> - Redondeo
<cbc:PayableAmount> - Total a pagar
```

#### 2.10 Líneas de Factura (`cac:InvoiceLine`)

```xml
<cbc:ID> - Número de línea
<cbc:Note> - Nota (ej: "Unidad de Medida: UNID")
<cbc:InvoicedQuantity unitCode="94"> - Cantidad (unitCode 94 = unidades)
<cbc:LineExtensionAmount> - Total de la línea

<cac:AllowanceCharge> - Descuentos/Cargos
  <cbc:ChargeIndicator> - false = descuento, true = cargo
  <cbc:AllowanceChargeReasonCode> - Código de razón
  <cbc:MultiplierFactorNumeric> - Porcentaje de descuento
  <cbc:Amount> - Monto del descuento
  <cbc:BaseAmount> - Precio base antes del descuento
</cac:AllowanceCharge>

<cac:TaxTotal> - Impuestos de la línea
<cac:Item>
  <cbc:Description> - Descripción del producto
  <cac:StandardItemIdentification>
    <cbc:ID schemeID="999"> - Código del producto (999 = estándar del contribuyente)
  </cac:StandardItemIdentification>
</cac:Item>

<cac:Price>
  <cbc:PriceAmount> - Precio unitario
  <cbc:BaseQuantity> - Cantidad base
</cac:Price>
```

### 3. Respuesta de Validación DIAN (`ApplicationResponse`)

También embebida en el `AttachedDocument`, contiene la respuesta de validación de la DIAN:

```xml
<cac:DocumentResponse>
  <cac:Response>
    <cbc:ResponseCode> - Código de respuesta (02 = validado)
    <cbc:Description> - "Documento validado por la DIAN"
  </cac:Response>
  <cac:DocumentReference>
    <cbc:ID> - Número de factura
    <cbc:UUID> - CUFE
  </cac:DocumentReference>
  <cac:LineResponse> - Respuestas por línea de validación
</cac:DocumentResponse>
```

## Códigos y Valores Importantes

### Tipos de Documento de Identidad (schemeID)
- `1` - Cédula de ciudadanía
- `3` - NIT
- `4` - NIT (alternativo)
- `7` - Otro

### Códigos de Unidad (unitCode)
- `94` - Unidades

### Códigos de Identificación de Producto (schemeID)
- `999` - Estándar de adopción del contribuyente

### Régimen Tributario (TaxLevelCode)
- `O-23` - No responsable de IVA
- `O-13` - Gran contribuyente
- Múltiples códigos separados por `;`

## Firmas Digitales

Cada documento (AttachedDocument e Invoice) incluye firmas digitales XML (XMLDSig) con:
- Certificado X.509
- Algoritmo de firma: RSA-SHA256
- Algoritmo de canonicalización: C14N
- Política de firma de la DIAN

## Notas de Implementación

1. **CUFE**: Es fundamental para la trazabilidad y validación de la factura
2. **QR Code**: Permite verificación rápida en el portal de la DIAN
3. **Orden de Compra**: En nuestro sistema, indica suscripción al newsletter para personas naturales
4. **Descuentos**: Se representan con `ChargeIndicator=false` y un porcentaje en `MultiplierFactorNumeric`
5. **Múltiples Líneas**: Una factura puede tener múltiples productos/servicios
6. **Validación DIAN**: La respuesta de validación está embebida en el mismo XML

## Referencias

- [DIAN - Facturación Electrónica](https://www.dian.gov.co/impuestos/factura-electronica)
- [UBL 2.1 Specification](http://docs.oasis-open.org/ubl/os-UBL-2.1/)
- [Loggro - Documentación UBL](https://loggro.com)
