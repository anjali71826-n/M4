# 📅 Advisor Appointment Scheduler

A voice-enabled appointment scheduling agent built with **Next.js 14**, **TypeScript**, and **Google APIs**. This intelligent chatbot helps users book, reschedule, and cancel advisor appointments through natural language conversations.

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)

---

## ✨ Features

### Core Functionality
- **📆 Book Appointments** – Schedule new meetings with advisors using natural language
- **🔄 Reschedule Appointments** – Modify existing appointments to new time slots
- **❌ Cancel Appointments** – Cancel scheduled appointments with confirmation
- **🎫 Booking Codes** – Unique 8-character codes generated for each appointment

### Integrations
- **Google Calendar** – Real-time availability checking and event management
- **Gmail** – Automated email notifications for confirmations, reschedules, and cancellations
- **Google Sheets** – Logging all appointment actions for record-keeping

### User Experience
- **💬 Conversational Interface** – Natural language processing for intuitive interactions
- **📱 Responsive Design** – Works seamlessly on desktop and mobile devices
- **⏰ Smart Slot Suggestions** – Presents available 30-minute time slots for selection

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Main chat API endpoint
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/
│   ├── ChatInterface.tsx         # Main chat UI component
│   ├── MessageBubble.tsx         # Individual message display
│   └── SlotSelector.tsx          # Time slot selection UI
└── lib/
    ├── agent/
    │   ├── intent-parser.ts      # NLP intent detection
    │   ├── date-parser.ts        # Date/time parsing
    │   └── slot-generator.ts     # Available slot generation
    ├── google/
    │   ├── calendar.ts           # Google Calendar integration
    │   ├── gmail.ts              # Gmail email notifications
    │   ├── sheets.ts             # Google Sheets logging
    │   └── auth.ts               # Google API authentication
    └── utils/
        └── bookingCode.ts        # Booking code generation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Google Cloud Project** with enabled APIs:
  - Google Calendar API
  - Gmail API
  - Google Sheets API

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/advisor-appointment-scheduler.git
   cd advisor-appointment-scheduler
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Google Service Account Credentials
   GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_PROJECT_ID=your-project-id
   
   # Google Calendar
   GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
   
   # Google Sheets
   GOOGLE_SPREADSHEET_ID=your-google-sheets-id
   
   # Gmail Configuration
   GMAIL_SENDER_EMAIL=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-app-password
   ADVISOR_EMAIL=advisor@example.com
   ```

   > ⚠️ **Security Note:** Never commit `.env` to version control. It contains sensitive credentials.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📸 Demo Screenshots

### 📅 Google Calendar Hold
Calendar event created with booking code in the title:

![Calendar Event with Booking Code](./screenshots/calendar-hold.png)

> **Event Title Format:** `Advisor Appointment [BOOKING_CODE]`  
> Example: `Advisor Appointment [ABC12DEF]`

---

### 📧 Email Notification

Confirmation email sent to the user:

![Email Confirmation](./screenshots/email-confirmation.png)

**Sample Email Content:**
```
Subject: Appointment Confirmed - Booking Code: ABC12DEF

Dear User,

Your appointment with the advisor has been confirmed!

📅 Date: January 12, 2026
⏰ Time: 2:00 PM - 2:30 PM
🎫 Booking Code: ABC12DEF

Please save your booking code for future reference. You can use it to 
reschedule or cancel your appointment.

Best regards,
Advisor Appointment Scheduler
```

---

### 📊 Google Sheets Log Entry

All actions are logged to Google Sheets:

![Google Sheets Log](./screenshots/sheets-log.png)

| Timestamp | User Request | Action Taken | Appointment DateTime | Status | Booking Code |
|-----------|--------------|--------------|---------------------|--------|--------------|
| 2026-01-11 23:00:00 | Book appointment for tomorrow at 2pm | BOOKED | 2026-01-12 14:00:00 | Success | ABC12DEF |
| 2026-01-11 23:05:00 | Reschedule to Wednesday | RESCHEDULED | 2026-01-14 15:00:00 | Success | ABC12DEF |
| 2026-01-11 23:10:00 | Cancel my appointment | CANCELLED | 2026-01-14 15:00:00 | Success | ABC12DEF |

---

## 🎭 Sample Test Script

Use these prompts/utterances to test the voice agent:

### Booking Flow
```
1. "I want to book an appointment"
2. "Book a meeting for tomorrow at 3pm"
3. "Schedule an appointment for next Monday morning"
4. "I need to see an advisor on January 15th at 10am"
5. "Can I get a slot for this Friday afternoon?"
```

### Slot Selection
```
1. "I'll take the first one"
2. "Option 2 please"
3. "The 2:30 PM slot works"
4. "Yes, confirm that time"
```

### Rescheduling Flow
```
1. "I need to reschedule my appointment"
2. "Move my Monday meeting to Wednesday"
3. "Can I change my appointment from tomorrow to next week?"
4. "Reschedule my 3pm appointment to 5pm"
```

### Cancellation Flow
```
1. "Cancel my appointment"
2. "I need to cancel my meeting for tomorrow"
3. "Please cancel the appointment on Friday"
4. "Delete my booking"
```

### Confirmation Responses
```
1. "Yes"
2. "Confirm"
3. "That works"
4. "Book it"
5. "No, show me other options"
6. "Cancel that"
```

---

## 📝 Usage Examples

### Booking an Appointment
```
User: "I'd like to book an appointment for tomorrow at 2pm"
Agent: "I found an available slot tomorrow at 2:00 PM. Would you like me to confirm this booking?"
User: "Yes, confirm it"
Agent: "Your appointment has been booked! Your booking code is ABC12DEF."
```

### Rescheduling
```
User: "I need to reschedule my appointment from Monday to Wednesday"
Agent: "I found your appointment on Monday. Here are the available slots for Wednesday..."
```

### Cancelling
```
User: "Cancel my appointment for Friday"
Agent: "I found your appointment on Friday at 3:00 PM. Would you like me to cancel it?"
```

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Ensure all environment variables from your `.env` file are configured in your deployment platform.

---

## 📊 Google Sheets Logging

All appointment actions are logged to Google Sheets with the following columns:

| Column | Description |
|--------|-------------|
| Timestamp | When the action occurred |
| User Request | Original user message |
| Action Taken | BOOKED, RESCHEDULED, or CANCELLED |
| Appointment DateTime | Scheduled date and time |
| Status | Success or failure status |
| Booking Code | Unique appointment identifier |

---

## 🔒 Security Notes

- Never commit `.env` or `service_account.json` to version control
- Use environment variables for all sensitive credentials
- Rotate API keys and passwords regularly
- Use App Passwords for Gmail (not your main password)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Powered by [Google APIs](https://developers.google.com/apis-explorer)
