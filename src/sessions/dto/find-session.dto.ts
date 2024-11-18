export class FindSessionDto {
  id: number;
  userId: number;
  refreshToken: string;
  ipAddress: string;
  userAgent: string;
  expiryDate: Date;
  isActive: boolean;
}
