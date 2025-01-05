import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export enum EmailTemplateEnum {
  VERIFY_EMAIL,
}

@Injectable()
export class UtilsService {
  constructor(private configService: ConfigService) {}

  generateRandom6DigitNumber(): string {
    const digits = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 10),
    );
    return digits.join('');
  }

  async sendEmail(
    recipients: string[],
    template: EmailTemplateEnum,
    content: any,
  ) {
    const resend = new Resend(this.configService.get('RESEND_API_KEY'));

    let newTemplate: any;

    if (template === EmailTemplateEnum.VERIFY_EMAIL) {
      newTemplate = this.generateTemplateVerifyEmail(recipients, content);
    }

    return await resend.emails.send(newTemplate);
  }

  generateTemplateVerifyEmail(recipients: string[], code: string) {
    const providerEmail = this.configService.get('RESEND_EMAIL');

    return {
      from: `Tolete Web Development Services<${providerEmail}>`,
      to: recipients,
      subject: 'Verification Code',
      html: `<p>your code is: ${code}</p>`,
    };
  }
}
