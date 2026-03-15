export type Member = {
  email: string;
  displayName: string;
  status?: "APPROVED" | "OFFLINE";
  _createdDate?: Date | string;
  _updatedDate?: Date | string;
  lastLoginDate?: Date | string;
};
