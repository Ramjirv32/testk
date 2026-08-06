package messaging

import (
	"fmt"
	"os"

	"gopkg.in/gomail.v2"
)

type EmailService struct {
	SMTPHost     string
	SMTPPort     int
	SMTPEmail    string
	SMTPPassword string
}

func NewEmailService() *EmailService {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpEmail := os.Getenv("SMTP_EMAIL")
	smtpPassword := os.Getenv("SMTP_PASSWORD")

	if smtpHost == "" || smtpEmail == "" || smtpPassword == "" {
		fmt.Printf(" Email configuration incomplete:\n")
		fmt.Printf("   SMTP_HOST: %s\n", smtpHost)
		fmt.Printf("   SMTP_EMAIL: %s\n", smtpEmail)
		fmt.Printf("   SMTP_PASSWORD: %s\n", maskPassword(smtpPassword))
	} else {
		fmt.Printf(" Email service configured: %s (%s)\n", smtpEmail, smtpHost)
	}

	return &EmailService{
		SMTPHost:     smtpHost,
		SMTPPort:     587,
		SMTPEmail:    smtpEmail,
		SMTPPassword: smtpPassword,
	}
}

func maskPassword(password string) string {
	if password == "" {
		return "[EMPTY]"
	}
	if len(password) <= 4 {
		return "****"
	}
	return password[:2] + "****" + password[len(password)-2:]
}

func (e *EmailService) SendVerificationEmail(toEmail, token string) error {
	verificationLink := fmt.Sprintf("http://localhost:3000/verify-email?token=%s", token)

	subject := "Verify Your Email - Top Ranking University"
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
			<div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
				<h2 style="color: #070642;">Welcome to Top Ranking University!</h2>
				<p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
				<div style="text-align: center; margin: 30px 0;">
					<a href="%s" style="background-color: #070642; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
						Verify Email
					</a>
				</div>
				<p>Or copy and paste this link into your browser:</p>
				<p style="word-break: break-all; color: #666;">%s</p>
				<hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
				<p style="font-size: 12px; color: #999;">
					If you didn't create an account, please ignore this email.
				</p>
			</div>
		</body>
		</html>
	`, verificationLink, verificationLink)

	return e.sendEmail(toEmail, subject, body)
}

func (e *EmailService) SendLoginVerificationEmail(toEmail, code string) error {
	subject := "Login Verification Code - Top Ranking University"
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
			<div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
				<h2 style="color: #070642;">Login Verification</h2>
				<p>Your verification code is:</p>
				<div style="text-align: center; margin: 30px 0;">
					<div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #070642;">
						%s
					</div>
				</div>
				<p>This code will expire in 10 minutes.</p>
				<hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
				<p style="font-size: 12px; color: #999;">
					If you didn't request this code, please ignore this email.
				</p>
			</div>
		</body>
		</html>
	`, code)

	return e.sendEmail(toEmail, subject, body)
}

func (e *EmailService) SendPasswordResetEmail(toEmail, token string) error {
	resetLink := fmt.Sprintf("http://localhost:3000/reset-password?token=%s", token)

	subject := "Reset Your Password - Top Ranking University"
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
			<div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
				<h2 style="color: #070642;">Password Reset Request</h2>
				<p>We received a request to reset your password. Click the button below to create a new password:</p>
				<div style="text-align: center; margin: 30px 0;">
					<a href="%s" style="background-color: #070642; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
						Reset Password
					</a>
				</div>
				<p>Or copy and paste this link into your browser:</p>
				<p style="word-break: break-all; color: #666;">%s</p>
				<p>This link will expire in 1 hour.</p>
				<hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
				<p style="font-size: 12px; color: #999;">
					If you didn't request a password reset, please ignore this email.
				</p>
			</div>
		</body>
		</html>
	`, resetLink, resetLink)

	return e.sendEmail(toEmail, subject, body)
}

func (e *EmailService) sendEmail(to, subject, htmlBody string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", e.SMTPEmail)
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", htmlBody)

	d := gomail.NewDialer(e.SMTPHost, e.SMTPPort, e.SMTPEmail, e.SMTPPassword)

	if err := d.DialAndSend(m); err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}
