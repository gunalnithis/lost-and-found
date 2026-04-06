# Contact Feature Implementation

## Overview

This document explains the implemented contact feature that allows item owners to contact item founders through email using nodemailer.

## How It Works

### 1. Item Registration (Founder)
- A founder registers a found item through the "Post Item" form
- The founder provides their email address and contact information
- The item is stored in the database with the founder's email

### 2. Contact Request (Owner)
- An owner finds their lost item in the Lost Items or Found Items list
- They click the "Contact Item Founder" button
- A contact form appears where they provide:
  - Their name
  - Their email address
  - Phone number
  - IT number
  - Studying year
  - Optional message

### 3. Email Notification
- When the owner submits the form, the system:
  - Saves the contact request to the database
  - Sends an email to the founder with the owner's details
  - Sends a confirmation email to the owner

## Files Modified

### Frontend Changes
- `frontend/src/pages/LostItems.jsx` - Updated button text to "Contact Item Founder"
- `frontend/src/pages/FoundItems.jsx` - Updated button text to "Contact Item Founder"
- `frontend/src/components/ContactForm.jsx` - Updated header and success message text

### Backend Changes
- `backend/controllers/contactController.js` - Enhanced email templates for clarity
- `backend/.env` - Added Gmail configuration for email sending

## Email Templates

### Founder Email (Item Founder Receives)
- Subject: "New Contact Request for Your Found Item: [Item Name]"
- Contains owner's contact details and instructions on how to proceed
- Includes verification steps and safety guidelines

### Owner Email (Item Owner Receives)
- Subject: "Contact Request Sent - Lost & Found System"
- Confirms their message was sent successfully
- Provides next steps and what to expect

## Configuration Required

To enable email functionality, you need to:

1. **Set up Gmail App Password:**
   - Enable 2-Step Verification in your Google Account
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the generated 16-character password

2. **Update .env file:**
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   ```

## Testing the Flow

1. **Register a Found Item:**
   - Go to "Post Item" page
   - Fill in item details with your email
   - Submit the form

2. **Contact the Founder:**
   - Go to "Lost Items" or "Found Items" page
   - Find the item you registered
   - Click "Contact Item Founder"
   - Fill in your details and submit

3. **Check Emails:**
   - Founder should receive an email with owner's contact details
   - Owner should receive a confirmation email

## Security Features

- Only logged-in users can contact item founders
- Users cannot contact their own items
- Email addresses are validated
- Contact requests are logged in the database

## Error Handling

- If email sending fails, the contact request is still saved
- Users receive appropriate error messages
- System provides fallback behavior when email service is unavailable

## Next Steps

1. Configure Gmail credentials in `.env` file
2. Test the complete flow with real email addresses
3. Monitor email delivery and adjust configuration as needed
4. Consider adding email templates for different scenarios