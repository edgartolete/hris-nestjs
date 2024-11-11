export class CreateSessionDto {
  userId: number;
  refreshToken: string;
  ipAddress: string;
  userAgent: string;
  expiryDate: Date;
}
