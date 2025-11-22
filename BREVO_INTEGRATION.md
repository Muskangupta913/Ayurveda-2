# Brevo Email Campaign Integration

This document explains how to use the Brevo (formerly Sendinblue) email campaign integration in this project.

## Setup

### 1. Environment Variables

Add the following environment variable to your `.env` or `.env.local` file:

```env
BREVO_API_KEY=xsmtpsib-f53ad2b62046533402b1f9ca904f1cd85c83894048c6e12fc3aa72c872151bc1-AkVbwiNXGpIU1xOi
```

### 2. SMTP Configuration (for Gmail marketing emails)

The Gmail marketing feature uses SMTP. Configure these in your `.env` file:

```env
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=9c2a53001@smtp-brevo.com
BREVO_SMTP_PASSWORD=3nmZLafgbzWPxpJh
BREVO_DEFAULT_SENDER_NAME=Ayurveda Clinic
BREVO_DEFAULT_SENDER_EMAIL=diglip4@gmail.com
```

**Important**: The sender email (`BREVO_DEFAULT_SENDER_EMAIL`) must be verified in your Brevo account. To verify:
1. Go to Brevo Dashboard → Senders & IP
2. Add and verify your sender email address
3. Use that verified email in `BREVO_DEFAULT_SENDER_EMAIL`

## API Endpoint

### Create Email Campaign

**Endpoint**: `POST /api/marketing/email-campaign`

**Headers**:
```
Authorization: Bearer <your-token>
Content-Type: application/json
```

**Request Body** (for Campaign):
```json
{
  "campaignType": "campaign",
  "name": "Campaign sent via the API",
  "subject": "My subject",
  "sender": {
    "name": "From name",
    "email": "myfromemail@mycompany.com"
  },
  "htmlContent": "<h1>Congratulations! You successfully sent this example campaign via the Brevo API.</h1>",
  "listIds": [2, 7],
  "scheduledAt": "2018-01-01 00:00:01",
  "type": "classic"
}
```

**Request Body** (for Transactional Email):
```json
{
  "campaignType": "transactional",
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "htmlContent": "<h1>Hello!</h1><p>This is a transactional email.</p>",
  "textContent": "Hello! This is a transactional email.",
  "sender": {
    "name": "From name",
    "email": "myfromemail@mycompany.com"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    // ... campaign data
  },
  "message": "Campaign created successfully"
}
```

## Usage Examples

### Example 1: Create a Scheduled Campaign

```javascript
const response = await fetch('/api/marketing/email-campaign', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    campaignType: 'campaign',
    name: 'Monthly Newsletter',
    subject: 'Your Monthly Update',
    sender: {
      name: 'Ayurveda Clinic',
      email: 'noreply@ayurvedaclinic.com'
    },
    htmlContent: '<h1>Welcome!</h1><p>This is your monthly newsletter.</p>',
    listIds: [2, 7],
    scheduledAt: '2024-12-25 10:00:00',
    type: 'classic'
  })
});

const result = await response.json();
```

### Example 2: Send Transactional Email

```javascript
const response = await fetch('/api/marketing/email-campaign', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    campaignType: 'transactional',
    to: 'patient@example.com',
    subject: 'Appointment Confirmation',
    htmlContent: '<h1>Your appointment is confirmed!</h1>',
    textContent: 'Your appointment is confirmed!',
    sender: {
      name: 'Ayurveda Clinic',
      email: 'noreply@ayurvedaclinic.com'
    }
  })
});

const result = await response.json();
```

## Permissions

The API endpoint requires authentication and one of the following roles:
- `admin`
- `clinic`
- `doctor`

## Service Functions

The Brevo service (`services/brevoEmailService.js`) provides two main functions:

1. **`createEmailCampaign(campaignData)`** - Creates an email campaign
2. **`sendTransactionalEmail(emailData)`** - Sends a transactional email

Both functions handle errors and return consistent response formats.

## Error Handling

The API returns appropriate HTTP status codes:
- `200` - Success
- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `500` - Internal Server Error (API key not configured or Brevo API error)

## Notes

- The Brevo SDK package (`sib-api-v3-sdk`) is currently deprecated but still functional
- Make sure your sender email is verified in your Brevo account
- List IDs must exist in your Brevo account
- Scheduled dates should be in the format: `YYYY-MM-DD HH:mm:ss`

