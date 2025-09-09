// src/lib/suppliers/validators.ts
import type { Document, DocType } from "./types";

interface PortalFormData {
  companyName: string;
  contactEmail: string;
  // ... other form fields
  documents: {
    type: DocType;
    file?: File;
    issuedOn?: string;
    expiresOn?: string;
    isSigned?: boolean;
  }[];
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates the supplier portal submission data.
 * This is a client-side validation utility. Server-side validation should also occur.
 *
 * @param formData The data submitted from the supplier portal.
 * @param requiredDocs A list of document types required for this supplier.
 * @returns A ValidationResult object indicating validity and any errors.
 */
export function validatePortalSubmission(
  formData: PortalFormData,
  requiredDocs: DocType[],
): ValidationResult {
  const errors: Record<string, string> = {};
  let isValid = true;

  // Example: Basic field validation
  if (!formData.companyName || formData.companyName.trim() === '') {
    errors.companyName = "Company name is required.";
    isValid = false;
  }
  if (!formData.contactEmail || !/\S+@\S+\.\S+/.test(formData.contactEmail)) {
    errors.contactEmail = "Valid contact email is required.";
    isValid = false;
  }

  // Document validation
  requiredDocs.forEach(requiredType => {
    const submittedDoc = formData.documents.find(d => d.type === requiredType);

    if (!submittedDoc || !submittedDoc.file) {
      errors[`doc_${requiredType}`] = `${requiredType} document is required.`;
      isValid = false;
      return;
    }

    // Check file size (max 20MB)
    if (submittedDoc.file.size > 20 * 1024 * 1024) {
      errors[`doc_${requiredType}`] = `${requiredType} file exceeds 20MB limit.`;
      isValid = false;
    }

    // Check issued/expiry dates
    if (submittedDoc.issuedOn && submittedDoc.expiresOn) {
      const issued = new Date(submittedDoc.issuedOn);
      const expires = new Date(submittedDoc.expiresOn);
      if (issued >= expires) {
        errors[`doc_${requiredType}_dates`] = "Issued date must be before expiry date.";
        isValid = false;
      }
      // GMP cert age <= 36 months
      if (requiredType === 'GMP_CERT') {
        const threeYearsAgo = new Date();
        threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
        if (issued < threeYearsAgo) {
          errors[`doc_${requiredType}_age`] = "GMP certificate must be issued within the last 36 months.";
          isValid = false;
        }
      }
    } else if (requiredType !== 'COA_SAMPLE' && requiredType !== 'TAX_W8_W9' && requiredType !== 'BANKING_INFO') {
      // Most documents require both dates, except specific ones
      errors[`doc_${requiredType}_dates`] = "Issued and expiry dates are required for this document.";
      isValid = false;
    }

    // Check for signatures if applicable (conceptual)
    // if (requiredType === 'QA_QUESTIONNAIRE' && !submittedDoc.isSigned) {
    //   errors[`doc_${requiredType}_signature`] = "Signature is required for the QA Questionnaire.";
    //   isValid = false;
    // }
  });

  // Add more validation rules as needed for other sections (sites, contacts, etc.)

  return { isValid, errors };
}