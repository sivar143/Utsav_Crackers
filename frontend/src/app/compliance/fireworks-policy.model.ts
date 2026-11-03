export type PolicyStatus = 'DRAFT' | 'APPROVED' | 'REVOKED';

export interface FireworksPolicy {
  id: string;
  scopeType: string;
  stateCode: string;
  district: string | null;
  postalCode: string | null;
  saleAllowed: boolean;
  deliveryAllowed: boolean;
  transportAllowed: boolean;
  storageAllowed: boolean;
  effectiveFrom: string;
  effectiveUntil: string | null;
  sourceReference: string;
  legalNotes: string;
  status: PolicyStatus;
  createdBy: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  revokedBy: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
}

export interface FireworksPolicyRequest {
  stateCode: string;
  district: string | null;
  postalCode: string | null;
  saleAllowed: boolean;
  deliveryAllowed: boolean;
  transportAllowed: boolean;
  storageAllowed: boolean;
  effectiveFrom: string;
  effectiveUntil: string | null;
  sourceReference: string;
  legalNotes: string;
}
