# Supabase Auth Email Templates

These templates are designed to match the **Agasobanuye Movies** cinematic theme. Copy and paste the HTML content into your Supabase Dashboard under **Authentication > Email Templates**.

## Global Styles (For all templates)

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background-color: #080808;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      padding: 40px;
      background-color: #121212;
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      text-align: center;
    }
    .logo {
      margin-bottom: 30px;
    }
    h1 {
      font-size: 32px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -1px;
      margin-bottom: 10px;
    }
    .accent {
      color: #0071eb;
    }
    p {
      color: #a1a1aa;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .otp-code {
      background-color: rgba(0, 113, 235, 0.1);
      border: 2px solid #0071eb;
      color: #ffffff;
      font-size: 36px;
      font-weight: 900;
      padding: 20px;
      border-radius: 16px;
      letter-spacing: 8px;
      display: inline-block;
      margin: 20px 0;
    }
    .button {
      background-color: #0071eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 12px;
      font-weight: 900;
      text-transform: uppercase;
      display: inline-block;
      box-shadow: 0 10px 20px rgba(0, 113, 235, 0.3);
    }
    .footer {
      margin-top: 40px;
      font-size: 12px;
      color: #52525b;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <!-- Replace with your actual hosted logo URL if possible -->
      <img src="https://ag.micorp.pro/image.png" width="80" height="80" alt="Agasobanuye Movies">
    </div>
    
    {{ .Content }}

    <div class="footer">
      &copy; 2026 Agasobanuye Movies • All Rights Reserved
    </div>
  </div>
</body>
</html>
```

---

## 1. Confirm Signup
**Subject:** Confirm your Agasobanuye Movies account

```html
<h1>Welcome to <span class="accent">Agasobanuye</span></h1>
<p>You're almost there! Use the verification code below to confirm your account and start streaming.</p>

<div class="otp-code">{{ .Token }}</div>

<p>Or click the button below to confirm directly:</p>
<a href="{{ .ConfirmationURL }}" class="button">Confirm Email</a>

<p style="margin-top: 30px; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
```

---

## 2. Reset Password
**Subject:** Reset your Agasobanuye Movies password

```html
<h1>Reset <span class="accent">Password</span></h1>
<p>We received a request to reset your password. Use the code below to complete the process.</p>

<div class="otp-code">{{ .Token }}</div>

<p>Or click the button below to set a new password:</p>
<a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>

<p style="margin-top: 30px; font-size: 14px;">If you didn't request a password reset, please secure your account.</p>
```

---

## 3. Magic Link or OTP
**Subject:** Your Agasobanuye Movies sign-in code

```html
<h1>Sign <span class="accent">In</span></h1>
<p>Use the one-time code below to securely sign in to your account.</p>

<div class="otp-code">{{ .Token }}</div>

<p>Or click the button below to sign in directly:</p>
<a href="{{ .ConfirmationURL }}" class="button">Sign In Now</a>

<p style="margin-top: 30px; font-size: 14px;">This code will expire in a few minutes.</p>
```

---

## 4. Change Email Address
**Subject:** Confirm your new email address

```html
<h1>Change <span class="accent">Email</span></h1>
<p>Use the code below to confirm your new email address for Agasobanuye Movies.</p>

<div class="otp-code">{{ .Token }}</div>

<p>Or click the button below to confirm:</p>
<a href="{{ .ConfirmationURL }}" class="button">Confirm New Email</a>
```

---

## 5. Invite User
**Subject:** You're invited to Agasobanuye Movies

```html
<h1>Join the <span class="accent">Community</span></h1>
<p>You've been invited to join Agasobanuye Movies. Click the button below to accept your invitation and start watching.</p>

<a href="{{ .ConfirmationURL }}" class="button">Accept Invitation</a>
```

---

## 6. Reauthentication
**Subject:** Verify your identity

```html
<h1>Identity <span class="accent">Verification</span></h1>
<p>For your security, please use the code below to verify your identity before proceeding.</p>

<div class="otp-code">{{ .Token }}</div>
```
