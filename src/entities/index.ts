/**
 * Auto-generated entity types
 * Contains all CMS collection interfaces in a single file 
 */

/**
 * Collection ID: cliniclocations
 * Interface for ClinicLocations
 */
export interface ClinicLocations {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  locationName?: string;
  /** @wixFieldType text */
  address?: string;
  /** @wixFieldType text */
  contactNumber?: string;
  /** @wixFieldType text */
  operatingHours?: string;
  /** @wixFieldType text */
  email?: string;
}


/**
 * Collection ID: doctors
 * Interface for Doctors
 */
export interface Doctors {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  doctorName?: string;
  /** @wixFieldType text */
  specialization?: string;
  /** @wixFieldType text */
  bio?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  profileImage?: string;
  /** @wixFieldType text */
  contactNumber?: string;
  /** @wixFieldType text */
  email?: string;
  /** @wixFieldType text */
  qualifications?: string;
  /** @wixFieldType number */
  yearsOfExperience?: number;
  /** App field (recommended): primary clinic assignment */
  clinicLocation?: string;
}


/**
 * Collection ID: homeopathicmedicines
 * Interface for HomeopathicMedicines
 */
export interface HomeopathicMedicines {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  medicineName?: string;
  /** @wixFieldType text */
  formType?: string;
  /** @wixFieldType text */
  potency?: string;
  /** @wixFieldType text */
  manufacturer?: string;
  /** @wixFieldType text */
  packSize?: string;
  /** @wixFieldType number */
  reorderLevel?: number;
  /** @wixFieldType text */
  storageRequirements?: string;
  /** App field: whether the medicine should appear in active inventory workflows */
  isActive?: boolean;
  /** App field: suggested days of inventory to keep on hand */
  targetCoverageDays?: number;
  /** App field: optional medicine notes */
  notes?: string;
}


/**
 * Collection ID: homesplashimages
 * Interface for HomeSplashImages
 */
export interface HomeSplashImages {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  image?: string;
  /** @wixFieldType text */
  title?: string;
  /** @wixFieldType text */
  caption?: string;
  /** @wixFieldType number */
  displayOrder?: number;
  /** @wixFieldType boolean */
  isActive?: boolean;
}


/**
 * Collection ID: inventorybatches
 * Interface for InventoryBatches
 */
export interface InventoryBatches {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  medicineSKU?: string;
  /** @wixFieldType text */
  batchNumber?: string;
  /** @wixFieldType date */
  expiryDate?: Date | string;
  /** @wixFieldType number */
  quantityAvailable?: number;
  /** @wixFieldType text */
  supplierName?: string;
  /** App field (recommended): clinic that holds this batch */
  clinicLocation?: string;
  /** App field: acquisition cost per unit */
  unitCost?: number;
  /** App field: supplier invoice or GRN reference */
  purchaseInvoiceNumber?: string;
  /** App field: received date */
  receivedDate?: Date | string;
  /** App field: Active, Expiring, Expired, Quarantine */
  stockStatus?: string;
}


/**
 * Collection ID: patients
 * Interface for Patients
 */
export interface Patients {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  patientName?: string;
  /** @wixFieldType text */
  phoneNumber?: string;
  /** @wixFieldType text */
  email?: string;
  /** @wixFieldType text */
  address?: string;
  /** @wixFieldType date */
  dateOfBirth?: Date | string;
  /** @wixFieldType text */
  gender?: string;
  /** @wixFieldType text */
  medicalHistorySummary?: string;
  /** App field (recommended): default clinic */
  clinicLocation?: string;
}


/**
 * Collection ID: prescriptions
 * Interface for Prescriptions
 */
export interface Prescriptions {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  prescriptionId?: string;
  /** @wixFieldType text */
  patientName?: string;
  /** @wixFieldType text */
  doctorName?: string;
  /** @wixFieldType date */
  prescriptionDate?: Date | string;
  /** @wixFieldType text */
  medicinesAndDosages?: string;
  /** @wixFieldType text */
  notes?: string;
  /** App field (recommended): issuing clinic */
  clinicLocation?: string;
}


/**
 * Collection ID: stocktransactionledger
 * Interface for StockTransactionLedger
 */
export interface StockTransactionLedger {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  transactionType?: string;
  /** @wixFieldType text */
  medicineSku?: string;
  /** @wixFieldType number */
  quantityChange?: number;
  /** @wixFieldType datetime */
  transactionDateTime?: Date | string;
  /** @wixFieldType text */
  referenceIdentifier?: string;
  /** @wixFieldType text */
  auditReason?: string;
  /** App field (recommended): clinic where transaction occurred */
  clinicLocation?: string;
  /** App field: originating clinic in transfer flows */
  sourceClinicLocation?: string;
  /** App field: destination clinic in transfer flows */
  destinationClinicLocation?: string;
  /** App field: transfer or approval group id */
  transferGroupId?: string;
  /** App field: Pending, Confirmed, Cancelled */
  approvalStatus?: string;
  /** App field: supplier or invoice context */
  supplierName?: string;
  /** App field: unit cost captured during purchase */
  unitCost?: number;
  /** App field: resulting on-hand quantity after transaction if available */
  resultingQuantity?: number;
}


/**
 * Collection ID: suppliers
 * Interface for Suppliers
 */
export interface Suppliers {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  supplierName?: string;
  /** @wixFieldType text */
  contactPerson?: string;
  /** @wixFieldType text */
  phoneNumber?: string;
  /** @wixFieldType text */
  email?: string;
  /** @wixFieldType text */
  address?: string;
  /** @wixFieldType text */
  gstTaxId?: string;
  /** @wixFieldType text */
  paymentTerms?: string;
}


/**
 * Collection ID: treatments
 * Interface for Treatments
 */
export interface Treatments {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  treatmentName?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType text */
  relatedConditions?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  treatmentImage?: string;
  /** @wixFieldType text */
  averageDuration?: string;
  /** @wixFieldType text */
  benefits?: string;
}
