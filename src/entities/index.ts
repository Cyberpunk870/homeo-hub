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
 * Collection ID: clinicsettings
 * Interface for ClinicSettings
 */
export interface ClinicSettings {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** App field: clinic this settings profile applies to */
  clinicLocation?: string;
  /** App field: default consultation fee */
  consultationFee?: number;
  /** App field: default medicine fee */
  medicineFee?: number;
  /** App field: default follow-up spacing in days */
  defaultFollowUpDays?: number;
  /** App field: suggested backup location for desktop installs */
  backupLocation?: string;
  /** App field: optional clinic billing notes */
  billingNotes?: string;
}

/**
 * Collection ID: noteslibrary
 * Interface for NotesLibrary
 */
export interface NotesLibrary {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** App field: clinic that owns the note */
  clinicLocation?: string;
  /** App field: note title */
  title?: string;
  /** App field: note category or condition */
  category?: string;
  /** App field: searchable keywords */
  keywords?: string;
  /** App field: note body */
  content?: string;
  /** App field: archive flag */
  isArchived?: boolean;
}

/**
 * Collection ID: medicalcertificates
 * Interface for MedicalCertificates
 */
export interface MedicalCertificates {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** App field: clinic that issued the certificate */
  clinicLocation?: string;
  /** App field: generated certificate number */
  certificateNumber?: string;
  /** App field: patient identifier */
  patientId?: string;
  /** App field: patient name */
  patientName?: string;
  /** App field: doctor name */
  doctorName?: string;
  /** App field: certificate date */
  issueDate?: Date | string;
  /** App field: diagnosis or reason */
  diagnosisSummary?: string;
  /** App field: recommended rest days */
  restDays?: number;
  /** App field: additional notes */
  notes?: string;
  /** App field: archive flag */
  isArchived?: boolean;
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
  /** App field: generated patient identifier */
  patientId?: string;
  /** @wixFieldType text */
  patientName?: string;
  /** @wixFieldType text */
  phoneNumber?: string;
  /** App field: alternate mobile number */
  mobileNumber?: string;
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
  /** App field: computed age years */
  ageYears?: number;
  /** App field: computed age months */
  ageMonths?: number;
  /** App field: marital status */
  maritalStatus?: string;
  /** App field: city */
  city?: string;
  /** App field: state */
  state?: string;
  /** App field: country */
  country?: string;
  /** App field: postal code */
  postalCode?: string;
  /** App field: profession */
  profession?: string;
  /** App field: archive flag */
  isArchived?: boolean;
  /** App field: archive timestamp */
  archivedAt?: Date | string;
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
  /** App field: patient identifier */
  patientId?: string;
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
  /** App field: symptom or diagnosis notes */
  symptomsSummary?: string;
  /** App field: hot/chilly/ambithermal */
  nature?: string;
  /** App field: salt/sweet/normal/etc. */
  craving?: string;
  /** App field: treatment summary */
  treatmentSummary?: string;
  /** App field: external medicines */
  externalMedicines?: string;
  /** App field: investigations */
  investigations?: string;
  /** App field: row-wise medicine data as JSON */
  medicineLineItems?: string;
  /** App field: treatment duration in days */
  treatmentForDays?: number;
  /** App field: number of consultations issued in this visit */
  consultationCount?: number;
  /** App field: doctor-managed interval value */
  followUpIntervalValue?: number;
  /** App field: days or months */
  followUpIntervalUnit?: string;
  /** App field: next consultation date */
  nextConsultationDate?: Date | string;
  /** App field: default consultation charge */
  consultationCharge?: number;
  /** App field: medicine charge */
  medicineCharge?: number;
  /** App field: total billed amount */
  totalAmount?: number;
  /** App field: amount collected in cash */
  amountPaidCash?: number;
  /** App field: amount collected online */
  amountPaidOnline?: number;
  /** App field: pending balance */
  balanceAmount?: number;
  /** App field: whether a bill is required */
  billRequired?: boolean;
  /** App field: whether a printed prescription is required */
  prescriptionRequired?: boolean;
  /** App field: generated receipt number */
  receiptNumber?: string;
  /** App field: receipt cancelled flag */
  cancelledReceipt?: boolean;
  /** App field: paid/partial/unpaid */
  paymentStatus?: string;
  /** App field: remarks */
  remarks?: string;
  /** App field: archive flag */
  isArchived?: boolean;
  /** App field: archive timestamp */
  archivedAt?: Date | string;
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
