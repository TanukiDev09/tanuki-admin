import { NextRequest, NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import Book from '@/models/Book';

// Helper to safely extract text from xml2js objects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractText = (obj: any): string => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object') {
    if (obj._ !== undefined) return obj._;
    if (obj.value !== undefined) return obj.value;
  }
  return '';
};

// Helper to extract attributes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getAttr = (obj: any, attrName: string): string => {
  if (!obj || !obj['$']) return '';
  return obj['$'][attrName] || '';
};

const normalizeDocumentType = (docType: string): string => {
  let normalized = docType;
  if (normalized === '1' || normalized?.toUpperCase() === 'CC') {
    normalized = '13'; // Cédula de ciudadanía
  } else if (
    normalized === '3' ||
    normalized === '4' ||
    normalized?.toUpperCase() === 'NIT'
  ) {
    normalized = '31'; // NIT
  } else if (normalized === '2' || normalized?.toUpperCase() === 'CE') {
    normalized = '22'; // Cédula de Extranjería
  } else if (normalized?.toUpperCase() === 'PASAPORTE') {
    normalized = '41'; // Pasaporte
  }
  return normalized || '13'; // Default to Cédula if not found
};

async function extractAttachedDocument(fileContent: string) {
  let parsedXml;
  try {
    parsedXml = await parseStringPromise(fileContent, {
      explicitArray: false,
      trim: true,
    });
  } catch (parseError) {
    console.error('XML Parse Error:', parseError);
    throw new Error(
      `Error al parsear XML: ${parseError instanceof Error ? parseError.message : 'Formato XML inválido'}. Verifica que el archivo sea un XML válido de la DIAN.`
    );
  }

  const attachedDoc =
    parsedXml?.AttachedDocument ||
    parsedXml?.['ns0:AttachedDocument'] ||
    parsedXml?.['AttachedDocument'];

  if (!attachedDoc) {
    throw new Error(
      'Formato XML DIAN inválido: No se encontró AttachedDocument. Asegúrate de que sea un archivo de Documento Adjunto de la DIAN.'
    );
  }

  return attachedDoc;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function extractEmbeddedInvoice(attachedDoc: any) {
  const attachment = attachedDoc.Attachment || attachedDoc['cac:Attachment'];
  const externalRef =
    attachment?.ExternalReference || attachment?.['cac:ExternalReference'];
  let cdataRaw = externalRef?.Description || externalRef?.['cbc:Description'];

  if (cdataRaw && typeof cdataRaw === 'object') {
    cdataRaw = cdataRaw._ || cdataRaw.value || '';
  }

  if (!cdataRaw || typeof cdataRaw !== 'string') {
    throw new Error(
      'No se encontró el contenido de la factura (CDATA) en el formato esperado. El archivo podría estar corrupto o tener un formato no estándar.'
    );
  }

  let cleanedCdata = cdataRaw.trim();
  cleanedCdata = cleanedCdata
    .replace(/^<!\[CDATA\[/, '')
    .replace(/\]\]>$/, '')
    .trim();

  if (!cleanedCdata.startsWith('<')) {
    throw new Error(
      `El contenido extraído no parece ser XML válido. Comienza con: "${cleanedCdata.substring(0, 20)}"`
    );
  }

  let invoiceXml;
  try {
    invoiceXml = await parseStringPromise(cleanedCdata, {
      explicitArray: false,
      trim: true,
    });
  } catch (invoiceParseError) {
    console.error('Embedded Invoice Parse Error:', invoiceParseError);
    throw new Error(
      `Error al parsear la factura embebida: ${invoiceParseError instanceof Error ? invoiceParseError.message : 'Formato inválido'}. El contenido interno no es XML válido.`
    );
  }

  const invoice =
    invoiceXml?.Invoice ||
    invoiceXml?.['ns0:Invoice'] ||
    invoiceXml?.['Invoice'];
  if (!invoice) {
    throw new Error(
      'No se encontró el elemento Invoice dentro del contenido procesado. Verifica que el archivo contenga una factura válida.'
    );
  }

  return invoice;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function parseInvoiceData(invoice: any, fileName: string) {
  const invoiceNumber = extractText(invoice.ID || invoice['cbc:ID']);
  if (!invoiceNumber) {
    throw new Error('El XML no contiene un número de factura válido (cbc:ID)');
  }

  const customerParty =
    invoice.AccountingCustomerParty?.Party ||
    invoice['cac:AccountingCustomerParty']?.['cac:Party'];
  const customerTaxScheme =
    customerParty?.PartyTaxScheme || customerParty?.['cac:PartyTaxScheme'];
  const customerContact =
    customerParty?.Contact || customerParty?.['cac:Contact'];
  const customerAddress =
    customerParty?.PhysicalLocation?.Address ||
    customerParty?.['cac:PhysicalLocation']?.['cac:Address'];

  const companyIDObj =
    customerTaxScheme?.CompanyID || customerTaxScheme?.['cbc:CompanyID'];
  const attrSchemeID = getAttr(companyIDObj, 'schemeID');
  const attrSchemeName = getAttr(companyIDObj, 'schemeName');

  let customerDocumentType = attrSchemeName;
  if (!customerDocumentType || !/^\d{2}$/.test(customerDocumentType)) {
    customerDocumentType = attrSchemeID || attrSchemeName;
  }
  customerDocumentType = normalizeDocumentType(customerDocumentType);

  const orderRef = extractText(
    invoice.OrderReference?.ID || invoice['cac:OrderReference']?.['cbc:ID']
  );

  const legalTotal =
    invoice.LegalMonetaryTotal || invoice['cac:LegalMonetaryTotal'];
  const taxTotal = invoice.TaxTotal || invoice['cac:TaxTotal'];

  const tax = parseFloat(
    extractText(taxTotal?.TaxAmount || taxTotal?.['cbc:TaxAmount']) || '0'
  );
  const total = parseFloat(
    extractText(
      legalTotal?.PayableAmount || legalTotal?.['cbc:PayableAmount']
    ) || '0'
  );

  const currency =
    extractText(
      invoice.DocumentCurrencyCode || invoice['cbc:DocumentCurrencyCode']
    ) || 'COP';
  const exchangeRateObj =
    invoice.PaymentExchangeRate || invoice['cac:PaymentExchangeRate'];
  const exchangeRate = parseFloat(
    extractText(
      exchangeRateObj?.CalculationRate ||
        exchangeRateObj?.['cbc:CalculationRate']
    ) || '1'
  );

  const invoiceLines = invoice.InvoiceLine || invoice['cac:InvoiceLine'] || [];
  const linesArray = Array.isArray(invoiceLines)
    ? invoiceLines
    : [invoiceLines];

  const items = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    linesArray.map(async (line: any) => {
      const itm = line.Item || line['cac:Item'];
      const prc = line.Price || line['cac:Price'];
      const allowanceCharge =
        line.AllowanceCharge || line['cac:AllowanceCharge'];

      // Extract ISBN/ID from StandardItemIdentification if available
      const standardIDObj =
        itm?.StandardItemIdentification ||
        itm?.['cac:StandardItemIdentification'];
      const isbn = extractText(standardIDObj?.ID || standardIDObj?.['cbc:ID']);

      // Attempt to find the book in our database by ISBN
      let matchedBook = null;
      if (isbn && /^(?:\d{10}|\d{13})$/.test(isbn)) {
        matchedBook = await Book.findOne({ isbn, isActive: true }).lean();
      }

      return {
        type: matchedBook ? 'libro' : 'servicio',
        description:
          extractText(itm?.Description || itm?.['cbc:Description']) ||
          'Unknown',
        quantity: parseFloat(
          extractText(line.InvoicedQuantity || line['cbc:InvoicedQuantity']) ||
            '1'
        ),
        unitPrice: parseFloat(
          extractText(prc?.PriceAmount || prc?.['cbc:PriceAmount']) || '0'
        ),
        discount: parseFloat(
          extractText(
            allowanceCharge?.Amount || allowanceCharge?.['cbc:Amount']
          ) || '0'
        ),
        total: parseFloat(
          extractText(
            line.LineExtensionAmount || line['cbc:LineExtensionAmount']
          ) || '0'
        ),
        bookId: matchedBook ? String(matchedBook._id) : undefined,
        costCenter: matchedBook?.costCenter || '03',
      };
    })
  );

  return {
    invoiceNumber,
    cufe: extractText(invoice.UUID || invoice['cbc:UUID']),
    issueDate: extractText(invoice.IssueDate || invoice['cbc:IssueDate']),
    dueDate: extractText(invoice.DueDate || invoice['cbc:DueDate']),
    customerName:
      extractText(
        customerTaxScheme?.RegistrationName ||
          customerTaxScheme?.['cbc:RegistrationName']
      ) || 'Unknown',
    customerTaxId: extractText(companyIDObj),
    customerDocumentType,
    customerAddress,
    customerContact,
    orderRef,
    newsletterSignup: Boolean(
      (customerDocumentType === '1' || customerDocumentType === '13') &&
      orderRef
    ),
    tax,
    total,
    subtotal: parseFloat(
      extractText(
        legalTotal?.LineExtensionAmount ||
          legalTotal?.['cbc:LineExtensionAmount']
      ) || '0'
    ),
    discount: parseFloat(
      extractText(
        legalTotal?.AllowanceTotalAmount ||
          legalTotal?.['cbc:AllowanceTotalAmount']
      ) || '0'
    ),
    currency,
    exchangeRate,
    items,
    fileName,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractDianMetadata(invoice: any, attachedDoc: any) {
  const extensions = invoice['ext:UBLExtensions']?.['ext:UBLExtension'] || [];
  const extensionsArray = Array.isArray(extensions) ? extensions : [extensions];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dianExt: any = null;
  for (const ext of extensionsArray) {
    const content = ext['ext:ExtensionContent'];
    if (content?.['sts:DianExtensions']) {
      dianExt = content['sts:DianExtensions'];
      break;
    }
  }

  const invoiceControl = dianExt?.['sts:InvoiceControl'];
  const authPeriod = invoiceControl?.['sts:AuthorizationPeriod'];
  const docResponse =
    attachedDoc['cac:DocumentResponse'] || attachedDoc.DocumentResponse;
  const response = docResponse?.['cac:Response'] || docResponse?.Response;

  return {
    invoiceControl,
    authPeriod,
    dianExt,
    response,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file)
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!file.name.endsWith('.xml')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only XML files are accepted.' },
        { status: 400 }
      );
    }

    const fileContent = (await file.text()).replace(/^\uFEFF/, '').trim();
    if (!fileContent.startsWith('<?xml') && !fileContent.startsWith('<')) {
      return NextResponse.json(
        {
          error:
            'Archivo XML inválido: El archivo no comienza con una etiqueta XML válida.',
        },
        { status: 400 }
      );
    }

    await dbConnect();

    const attachedDoc = await extractAttachedDocument(fileContent);
    const invoice = await extractEmbeddedInvoice(attachedDoc);
    const data = await parseInvoiceData(invoice, file.name);

    // Check for duplicate CUFE if present to avoid multiple uploads
    if (data.cufe) {
      const existingInvoice = await Invoice.findOne({ cufe: data.cufe });
      if (existingInvoice) {
        return NextResponse.json(
          {
            error: 'Esta factura ya ha sido subida anteriormente.',
            details: `La factura con número ${data.invoiceNumber} y CUFE ${data.cufe.substring(0, 10)}... ya existe en el sistema.`,
            existingId: existingInvoice._id,
          },
          { status: 409 }
        );
      }
    }

    const { invoiceControl, authPeriod, dianExt, response } =
      extractDianMetadata(invoice, attachedDoc);

    return NextResponse.json({
      success: true,
      invoice: {
        number: data.invoiceNumber,
        date: data.issueDate,
        dueDate: data.dueDate || undefined,
        customerName: data.customerName,
        customerTaxId: data.customerTaxId,
        customerDocumentType: data.customerDocumentType,
        customerAddress: extractText(
          data.customerAddress?.AddressLine?.Line ||
            data.customerAddress?.['cac:AddressLine']?.['cbc:Description']
        ),
        customerCity: extractText(
          data.customerAddress?.CityName ||
            data.customerAddress?.['cbc:CityName']
        ),
        customerEmail: extractText(
          data.customerContact?.ElectronicMail ||
            data.customerContact?.['cbc:ElectronicMail']
        ),
        customerPhone: extractText(
          data.customerContact?.Telephone ||
            data.customerContact?.['cbc:Telephone']
        ),
        items: data.items,
        subtotal: data.subtotal,
        tax: data.tax,
        discount: data.discount,
        total: data.total,
        currency: data.currency,
        exchangeRate: data.exchangeRate,
        amountInCOP:
          data.currency === 'COP' ? data.total : data.total * data.exchangeRate,
        status: 'Draft',
        cufe: data.cufe,
        orderReference: data.orderRef,
        newsletterSignup: data.newsletterSignup,
        notes: `Factura importada de XML: ${file.name}`,
        dianData: {
          invoiceAuthorization: extractText(
            invoiceControl?.['sts:InvoiceAuthorization']
          ),
          authorizationPeriod: {
            start: extractText(authPeriod?.['cbc:StartDate']),
            end: extractText(authPeriod?.['cbc:EndDate']),
          },
          softwareProvider: extractText(
            dianExt?.['sts:SoftwareProvider']?.['sts:ProviderID']
          ),
          softwareId: extractText(
            dianExt?.['sts:SoftwareProvider']?.['sts:SoftwareID']
          ),
          validationResponse: {
            code: extractText(response?.['cbc:ResponseCode']),
            description: extractText(response?.['cbc:Description']),
            validatedAt: extractText(attachedDoc?.['cbc:IssueDate']),
          },
        },
      },
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : 'Error al procesar el archivo XML';
    console.error('Error processing XML:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
