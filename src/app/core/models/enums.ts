// Enums matching backend exactly
export enum UserRole {
  SuperAdmin = 0,      // 🆕 System administration only
  GeneralStaff = 1,
  LineManager = 2,
  GM = 3
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
  GMReview = 5,
  Completed = 6,
  Rejected = 7,          // Generic rejection (for backward compatibility)
  ManagerRejected = 8,   // Specifically rejected by Line Manager
  GMRejected = 9  // Specifically rejected by GM
}

export enum SignatureType {
  ManagerSignature = 1,
  GMSignature = 2
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

export enum ApprovalStage {
  Initial = 1,           // Uploaded by report creator during initial creation
  ManagerReview = 2,     // Uploaded by line manager during approval process
  GMReview = 3    // Uploaded by GM during approval process
}
