// Enums matching backend exactly
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
  BusinessAssurance = 5,
  Engineering = 6,
  Operations = 7,
  Finance = 8,
  HR = 9,
  IT = 10,
  Planning = 11
}

export enum ReportStatus {
  Draft = 1,
  Submitted = 2,
  InReview = 3,
  ManagerReview = 4,
  ManagerApproved = 5,
  ExecutiveReview = 6,
  Approved = 7,
  Published = 8,
  Completed = 9,
  Rejected = 10
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
