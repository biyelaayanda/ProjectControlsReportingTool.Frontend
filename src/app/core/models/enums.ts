// Enums matching backend
export enum UserRole {
  GeneralStaff = 1,
  LineManager = 2,
  Executive = 3
}

export enum Department {
  ProjectSupport = 1,
  DocManagement = 2,
  QS = 3,
  ContractsManagement = 4,
  BusinessAssurance = 5
}

export enum ReportStatus {
  Draft = 1,
  Submitted = 2,
  ManagerReview = 3,
  ManagerApproved = 4,
  ExecutiveReview = 5,
  Completed = 6,
  Rejected = 7
}

export enum SignatureType {
  ManagerSignature = 1,
  ExecutiveSignature = 2
}

export enum AuditAction {
  Created = 1,
  Updated = 2,
  Submitted = 3,
  Approved = 4,
  Rejected = 5,
  Signed = 6,
  Downloaded = 7,
  Uploaded = 8
}
