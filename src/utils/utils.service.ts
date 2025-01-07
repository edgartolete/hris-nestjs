import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export enum EmailTemplateEnum {
  VERIFY_EMAIL,
  FORGOT_EMAIL,
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
    emails: string | string[],
    template: EmailTemplateEnum,
    content: any,
  ) {
    const resend = new Resend(this.configService.get('RESEND_API_KEY'));

    let newTemplate: any;

    const providerEmail = this.configService.get('RESEND_EMAIL');

    const recipients = Array.isArray(emails) ? emails : [emails];

    if (template === EmailTemplateEnum.VERIFY_EMAIL) {
      newTemplate = this.generateTemplateVerifyEmail(
        providerEmail,
        recipients,
        content,
      );
    }

    if (template === EmailTemplateEnum.FORGOT_EMAIL) {
      newTemplate = this.generateTemplateForgotPassword(
        providerEmail,
        recipients,
        content,
      );
    }

    return await resend.emails.send(newTemplate);
  }

  generateTemplateVerifyEmail(
    providerEmail: string,
    recipients: string[],
    code: string,
  ) {
    return {
      from: `Tolete Web Development Services<${providerEmail}>`,
      to: recipients,
      subject: 'Verification Code',
      html: `<p>your code is: ${code}</p>`,
    };
  }

  generateTemplateForgotPassword(
    providerEmail: string,
    recipients: string[],
    code: string,
  ) {
    return {
      from: `Tolete Web Development Services<${providerEmail}>`,
      to: recipients,
      subject: 'Forgot Password Code',
      html: `<p>your reset code is: ${code}</p>`,
    };
  }
}
