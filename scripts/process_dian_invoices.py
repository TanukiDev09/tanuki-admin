#!/usr/bin/env python3
"""
DIAN Invoice XML Processor
Processes DIAN electronic invoice XML files and imports them to MongoDB.

Usage:
    python process_dian_invoices.py --folder <path> [--import] [--dry-run]
"""

import os
import sys
import argparse
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime
from decimal import Decimal
import json

try:
    from pymongo import MongoClient
    from dotenv import load_dotenv
    from colorama import Fore, Style, init
except ImportError as e:
    print(f"Error: Missing required package. Please install: {e.name}")
    print("Run: pip install pymongo python-dotenv colorama")
    sys.exit(1)

# Initialize colorama
init(autoreset=True)

# XML Namespaces
NAMESPACES = {
    'cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
    'cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
    'ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
    'sts': 'dian:gov:co:facturaelectronica:Structures-2-1',
    'ds': 'http://www.w3.org/2000/09/xmldsig#',
}


class DIANInvoiceProcessor:
    """Process DIAN XML invoices and convert to internal schema."""

    def __init__(self, mongodb_uri: Optional[str] = None):
        """Initialize processor with optional MongoDB connection."""
        self.mongodb_uri = mongodb_uri
        self.db = None
        self.collection = None
        self.processed_count = 0
        self.error_count = 0
        self.examples = []

    def connect_db(self):
        """Connect to MongoDB."""
        if not self.mongodb_uri:
            raise ValueError("MongoDB URI not provided")
        
        print(f"{Fore.CYAN}Connecting to MongoDB...{Style.RESET_ALL}")
        client = MongoClient(self.mongodb_uri)
        self.db = client.get_default_database()
        self.collection = self.db['invoices']
        print(f"{Fore.GREEN}✓ Connected to database: {self.db.name}{Style.RESET_ALL}")

    def extract_text(self, element: Optional[ET.Element], path: str, default: str = '') -> str:
        """Extract text from XML element using XPath."""
        if element is None:
            return default
        found = element.find(path, NAMESPACES)
        return found.text if found is not None and found.text else default

    def extract_date(self, element: Optional[ET.Element], path: str) -> Optional[datetime]:
        """Extract and parse date from XML element."""
        date_str = self.extract_text(element, path)
        if date_str:
            try:
                return datetime.fromisoformat(date_str)
            except ValueError:
                return None
        return None

    def extract_decimal(self, element: Optional[ET.Element], path: str, default: float = 0.0) -> float:
        """Extract decimal value from XML element."""
        value_str = self.extract_text(element, path)
        if value_str:
            try:
                return float(value_str)
            except ValueError:
                return default
        return default

    def parse_embedded_invoice(self, cdata_content: str) -> Optional[ET.Element]:
        """Parse the embedded Invoice XML from CDATA section."""
        try:
            # Remove CDATA markers if present
            if cdata_content.startswith('<![CDATA['):
                cdata_content = cdata_content[9:-3]
            
            return ET.fromstring(cdata_content)
        except ET.ParseError as e:
            print(f"{Fore.RED}Error parsing embedded invoice: {e}{Style.RESET_ALL}")
            return None

    def extract_party_info(self, party_element: Optional[ET.Element]) -> Dict[str, Any]:
        """Extract party (customer/supplier) information."""
        if party_element is None:
            return {}

        party_tax = party_element.find('cac:PartyTaxScheme', NAMESPACES)
        party_contact = party_element.find('cac:Contact', NAMESPACES)
        party_location = party_element.find('cac:PhysicalLocation/cac:Address', NAMESPACES)

        info = {}
        
        if party_tax is not None:
            info['name'] = self.extract_text(party_tax, 'cbc:RegistrationName')
            
            company_id_elem = party_tax.find('cbc:CompanyID', NAMESPACES)
            if company_id_elem is not None:
                info['taxId'] = company_id_elem.text
                doc_type = company_id_elem.get('schemeID', '')
                
                # Normalize document type codes to DIAN standards
                if doc_type == '1': doc_type = '13' # Cédula
                if doc_type in ['3', '4']: doc_type = '31' # NIT
                
                info['documentType'] = doc_type

        if party_contact is not None:
            info['email'] = self.extract_text(party_contact, 'cbc:ElectronicMail')
            info['phone'] = self.extract_text(party_contact, 'cbc:Telephone')

        if party_location is not None:
            info['address'] = self.extract_text(party_location, 'cac:AddressLine/cbc:Line')
            info['city'] = self.extract_text(party_location, 'cbc:CityName')

        return info

    def extract_invoice_lines(self, invoice_root: ET.Element) -> List[Dict[str, Any]]:
        """Extract invoice line items."""
        lines = []
        invoice_lines = invoice_root.findall('cac:InvoiceLine', NAMESPACES)

        for line in invoice_lines:
            item_elem = line.find('cac:Item', NAMESPACES)
            price_elem = line.find('cac:Price', NAMESPACES)

            line_data = {
                'type': 'servicio',  # Default, could be enhanced
                'description': self.extract_text(item_elem, 'cbc:Description') if item_elem else '',
                'quantity': self.extract_decimal(line, 'cbc:InvoicedQuantity', 1.0),
                'unitPrice': self.extract_decimal(price_elem, 'cbc:PriceAmount') if price_elem else 0.0,
                'total': self.extract_decimal(line, 'cbc:LineExtensionAmount'),
                'costCenter': '03',  # Default cost center, should be mapped properly
            }

            lines.append(line_data)

        return lines

    def process_xml_file(self, xml_path: Path) -> Optional[Dict[str, Any]]:
        """Process a single XML file and return invoice data."""
        try:
            tree = ET.parse(xml_path)
            root = tree.getroot()

            # Extract the embedded Invoice from CDATA
            description_elem = root.find('.//cac:Attachment/cac:ExternalReference/cbc:Description', NAMESPACES)
            if description_elem is None or not description_elem.text:
                print(f"{Fore.YELLOW}⚠ No embedded invoice found in {xml_path.name}{Style.RESET_ALL}")
                return None

            invoice_root = self.parse_embedded_invoice(description_elem.text)
            if invoice_root is None:
                return None

            # Extract basic invoice information
            invoice_number = self.extract_text(invoice_root, 'cbc:ID')
            if not invoice_number:
                print(f"{Fore.YELLOW}⚠ No invoice number found in {xml_path.name}{Style.RESET_ALL}")
                return None

            # Extract customer information
            customer_party = invoice_root.find('cac:AccountingCustomerParty/cac:Party', NAMESPACES)
            customer_info = self.extract_party_info(customer_party)

            # Extract DIAN extensions
            dian_extensions = invoice_root.find('.//sts:DianExtensions', NAMESPACES)
            invoice_control = dian_extensions.find('sts:InvoiceControl', NAMESPACES) if dian_extensions else None

            # Check for order reference (newsletter signup indicator)
            order_ref_elem = invoice_root.find('cac:OrderReference/cbc:ID', NAMESPACES)
            order_reference = order_ref_elem.text if order_ref_elem is not None else None
            
            # Determine newsletter signup: natural person (Cédula = "13") + order reference
            is_natural_person = customer_info.get('documentType') == '13'
            newsletter_signup = bool(is_natural_person and order_reference)

            # Extract monetary totals
            legal_total = invoice_root.find('cac:LegalMonetaryTotal', NAMESPACES)

            # Build invoice data
            invoice_data = {
                'number': invoice_number,
                'date': self.extract_date(invoice_root, 'cbc:IssueDate') or datetime.now(),
                'dueDate': self.extract_date(invoice_root, 'cbc:DueDate'),
                'customerName': customer_info.get('name', 'Unknown'),
                'customerTaxId': customer_info.get('taxId'),
                'customerDocumentType': customer_info.get('documentType'),
                'customerAddress': customer_info.get('address'),
                'customerCity': customer_info.get('city'),
                'customerEmail': customer_info.get('email'),
                'customerPhone': customer_info.get('phone'),
                'items': self.extract_invoice_lines(invoice_root),
                'subtotal': self.extract_decimal(legal_total, 'cbc:LineExtensionAmount') if legal_total else 0.0,
                'tax': self.extract_decimal(invoice_root, 'cac:TaxTotal/cbc:TaxAmount'),
                'discount': 0.0,  # Could be calculated from AllowanceCharge
                'total': self.extract_decimal(legal_total, 'cbc:PayableAmount') if legal_total else 0.0,
                'status': 'Sent',  # Default status for imported invoices
                'cufe': self.extract_text(invoice_root, 'cbc:UUID'),
                'orderReference': order_reference,
                'newsletterSignup': newsletter_signup,
                'notes': f'Imported from DIAN XML: {xml_path.name}',
            }

            # Add DIAN metadata
            if invoice_control is not None:
                auth_period = invoice_control.find('sts:AuthorizationPeriod', NAMESPACES)
                invoice_data['dianData'] = {
                    'invoiceAuthorization': self.extract_text(invoice_control, 'sts:InvoiceAuthorization'),
                    'authorizationPeriod': {
                        'start': self.extract_date(auth_period, 'cbc:StartDate') if auth_period else None,
                        'end': self.extract_date(auth_period, 'cbc:EndDate') if auth_period else None,
                    },
                    'softwareProvider': self.extract_text(dian_extensions, 'sts:SoftwareProvider/sts:ProviderID'),
                    'softwareId': self.extract_text(dian_extensions, 'sts:SoftwareProvider/sts:SoftwareID'),
                }

            return invoice_data

        except ET.ParseError as e:
            print(f"{Fore.RED}✗ XML Parse Error in {xml_path.name}: {e}{Style.RESET_ALL}")
            self.error_count += 1
            return None
        except Exception as e:
            print(f"{Fore.RED}✗ Error processing {xml_path.name}: {e}{Style.RESET_ALL}")
            self.error_count += 1
            return None

    def process_folder(self, folder_path: Path, recursive: bool = True) -> List[Dict[str, Any]]:
        """Process all XML files in a folder."""
        invoices = []
        
        pattern = '**/*.xml' if recursive else '*.xml'
        xml_files = list(folder_path.glob(pattern))
        
        print(f"\n{Fore.CYAN}Found {len(xml_files)} XML files{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}\n")

        for xml_file in xml_files:
            print(f"Processing: {Fore.BLUE}{xml_file.name}{Style.RESET_ALL}...", end=' ')
            
            invoice_data = self.process_xml_file(xml_file)
            if invoice_data:
                invoices.append(invoice_data)
                self.processed_count += 1
                print(f"{Fore.GREEN}✓{Style.RESET_ALL}")
                
                # Store first 2 as examples
                if len(self.examples) < 2:
                    self.examples.append(invoice_data)
            else:
                print(f"{Fore.RED}✗{Style.RESET_ALL}")

        return invoices

    def import_to_db(self, invoices: List[Dict[str, Any]]) -> int:
        """Import invoices to MongoDB."""
        if not self.collection:
            raise ValueError("Database not connected")

        imported = 0
        for invoice in invoices:
            try:
                # Upsert by invoice number to avoid duplicates
                result = self.collection.update_one(
                    {'number': invoice['number']},
                    {'$set': invoice},
                    upsert=True
                )
                if result.upserted_id or result.modified_count:
                    imported += 1
            except Exception as e:
                print(f"{Fore.RED}Error importing invoice {invoice.get('number')}: {e}{Style.RESET_ALL}")

        return imported

    def display_examples(self):
        """Display example processed invoices."""
        if not self.examples:
            return

        print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}Example Processed Invoices:{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}\n")

        for i, invoice in enumerate(self.examples, 1):
            print(f"{Fore.YELLOW}Example {i}:{Style.RESET_ALL}")
            print(f"  Number: {invoice['number']}")
            print(f"  Customer: {invoice['customerName']}")
            print(f"  Tax ID: {invoice.get('customerTaxId', 'N/A')}")
            print(f"  Total: ${invoice['total']:,.2f} COP")
            print(f"  Items: {len(invoice['items'])}")
            print(f"  CUFE: {invoice.get('cufe', 'N/A')[:40]}...")
            print(f"  Newsletter Signup: {Fore.GREEN if invoice.get('newsletterSignup') else Fore.RED}{invoice.get('newsletterSignup')}{Style.RESET_ALL}")
            if invoice.get('orderReference'):
                print(f"  Order Reference: {invoice['orderReference']}")
            print()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Process DIAN invoice XML files')
    parser.add_argument('--folder', required=True, help='Folder containing XML files')
    parser.add_argument('--import', dest='do_import', action='store_true', help='Import to database')
    parser.add_argument('--dry-run', action='store_true', help='Process without importing')
    args = parser.parse_args()

    folder_path = Path(args.folder)
    if not folder_path.exists():
        print(f"{Fore.RED}Error: Folder not found: {folder_path}{Style.RESET_ALL}")
        sys.exit(1)

    # Load environment variables
    load_dotenv()
    mongodb_uri = os.getenv('MONGODB_URI')

    # Initialize processor
    processor = DIANInvoiceProcessor(mongodb_uri)

    # Process files
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}DIAN Invoice XML Processor{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
    
    invoices = processor.process_folder(folder_path)

    # Display summary
    print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
    print(f"{Fore.GREEN}✓ Successfully processed: {processor.processed_count}{Style.RESET_ALL}")
    if processor.error_count:
        print(f"{Fore.RED}✗ Errors: {processor.error_count}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")

    # Display examples
    processor.display_examples()

    # Import to database if requested
    if args.do_import and not args.dry_run:
        if not mongodb_uri:
            print(f"{Fore.RED}Error: MONGODB_URI not found in environment{Style.RESET_ALL}")
            sys.exit(1)

        print(f"\n{Fore.YELLOW}About to import {len(invoices)} invoices to database.{Style.RESET_ALL}")
        confirm = input(f"{Fore.YELLOW}Continue? (yes/no): {Style.RESET_ALL}")
        
        if confirm.lower() in ['yes', 'y']:
            processor.connect_db()
            imported = processor.import_to_db(invoices)
            print(f"\n{Fore.GREEN}✓ Imported {imported} invoices to database{Style.RESET_ALL}")
        else:
            print(f"{Fore.YELLOW}Import cancelled{Style.RESET_ALL}")
    elif args.dry_run:
        print(f"\n{Fore.CYAN}Dry run complete - no data imported{Style.RESET_ALL}")


if __name__ == '__main__':
    main()
