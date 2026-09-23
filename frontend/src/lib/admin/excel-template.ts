/**
 * Native browser Excel template downloader — no third-party library required.
 * Re-uses the exportToExcel helper from excel-export.ts.
 */
import { exportToExcel } from './excel-export';

export function downloadProductImportTemplate() {
  const templateData = [
    {
      'Product Name': 'Voltas 1.5 Ton 5 Star Inverter Split AC',
      'Brand': 'Voltas',
      'SKU': 'VOL-AC15T5S-001',
      'Selling Price (INR)': 35990,
      'MRP (INR)': 45990,
      'Stock': 12,
      'Status': 'ACTIVE',
      'Image URLs (comma separated)': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e, https://images.unsplash.com/photo-1581094288338-2314dddb7ece',
      'Specifications (Key:Value pairs)': 'Capacity: 1.5 Ton, Energy Rating: 5 Star, Condenser Coil: 100% Copper',
      'Warranty': '1 Year Comprehensive + 10 Years Compressor Warranty',
      'Requires Installation (Yes/No)': 'Yes',
      'Installation Details': 'Technician demo & installation within 24 hours of delivery.',
      'Description': 'High efficiency inverter split AC with copper condenser coil and super silent cooling mode.',
    },
    {
      'Product Name': 'LG 260L 3 Star Frost Free Double Door Refrigerator',
      'Brand': 'LG',
      'SKU': 'LG-REF260L-002',
      'Selling Price (INR)': 26490,
      'MRP (INR)': 32990,
      'Stock': 8,
      'Status': 'ACTIVE',
      'Image URLs (comma separated)': 'https://images.unsplash.com/photo-1584992236310-6edddc08acff',
      'Specifications (Key:Value pairs)': 'Capacity: 260 Litres, Star Rating: 3 Star, Defrost System: Frost Free',
      'Warranty': '1 Year Product + 10 Years Compressor Warranty',
      'Requires Installation (Yes/No)': 'No',
      'Installation Details': 'Plug & play operation. Unboxing assistance provided.',
      'Description': 'Smart inverter compressor refrigerator with Multi Air Flow cooling and toughened glass shelves.',
    },
    {
      'Product Name': 'Samsung 7 Kg Fully Automatic Front Load Washing Machine',
      'Brand': 'Samsung',
      'SKU': 'SAM-WM7KG-003',
      'Selling Price (INR)': 29990,
      'MRP (INR)': 37900,
      'Stock': 10,
      'Status': 'ACTIVE',
      'Image URLs (comma separated)': 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce',
      'Specifications (Key:Value pairs)': 'Capacity: 7.0 Kg, Washing Type: Front Load, Max Spin Speed: 1200 RPM',
      'Warranty': '2 Years Comprehensive + 20 Years Digital Inverter Motor Warranty',
      'Requires Installation (Yes/No)': 'Yes',
      'Installation Details': 'Technician installation and demo provided upon delivery.',
      'Description': 'Hygiene Steam washing machine with Digital Inverter technology and AI Control.',
    },
    {
      'Product Name': 'Sony Bravia 55 Inch 4K Ultra HD Smart Google TV',
      'Brand': 'Sony',
      'SKU': 'SNY-TV55UHD-004',
      'Selling Price (INR)': 57990,
      'MRP (INR)': 79900,
      'Stock': 5,
      'Status': 'ACTIVE',
      'Image URLs (comma separated)': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1',
      'Specifications (Key:Value pairs)': 'Screen Size: 55 Inch, Resolution: 4K Ultra HD (3840 x 2160), Sound Output: 20W Dolby Audio',
      'Warranty': '1 Year Comprehensive Brand Warranty',
      'Requires Installation (Yes/No)': 'Yes',
      'Installation Details': 'Wall mount installation provided by Sony authorized engineer.',
      'Description': '4K HDR Processor X1 with Motionflow XR and hands-free Google Assistant control.',
    },
    {
      'Product Name': 'Atomberg Renesa 1200mm BLDC Motor Ceiling Fan',
      'Brand': 'Atomberg',
      'SKU': 'ATM-FAN1200-005',
      'Selling Price (INR)': 3690,
      'MRP (INR)': 4990,
      'Stock': 25,
      'Status': 'ACTIVE',
      'Image URLs (comma separated)': 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147',
      'Specifications (Key:Value pairs)': 'Sweep Size: 1200 mm, Motor Type: Energy Efficient BLDC, Power Consumption: 28 Watts',
      'Warranty': '2 Years + 1 Year Extended Warranty on Registration',
      'Requires Installation (Yes/No)': 'No',
      'Installation Details': 'Standard electrical connection required.',
      'Description': 'Saves up to 65% energy with smart remote control and timer modes.',
    },
  ];

  exportToExcel('RaviVision_Product_Import_Template', 'Product_Import_Catalog', templateData);
}
