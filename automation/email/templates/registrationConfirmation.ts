export interface RegistrationEmailData {
  participantName: string;
  participantId: string;
  email: string;
  college: string;
  department: string;
  registeredEvents: string[];
  eventDate: string; // e.g. "26 September 2026"
  venue: string;     // e.g. "SRM Valliammai Engineering College, Chennai"
}

export function generateRegistrationConfirmationEmail(data: RegistrationEmailData): { subject: string; html: string; text: string } {
  const eventsListHtml = data.registeredEvents.length > 0
    ? data.registeredEvents.map(event => `<li style="margin-bottom: 8px; color: #e0e0e0;"><strong style="color: #ff4d4d;">•</strong> ${event}</li>`).join('')
    : '<li style="color: #a0a0a0;">No specific events listed</li>';

  const subject = `TARAS 2K26 — Registration Confirmed (${data.participantId})`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TARAS 2K26 Registration Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050508; font-family: 'Segoe UI', Arial, sans-serif; color: #ffffff; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #050508; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0d0d14; border: 1px solid rgba(229, 9, 20, 0.3); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(229, 9, 20, 0.15);">

          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a0003 0%, #8b0000 50%, #1a0003 100%); padding: 35px 25px; text-align: center; border-bottom: 2px solid #e50914;">
              <div style="font-size: 13px; font-weight: 700; letter-spacing: 4px; color: #ff9999; text-transform: uppercase; margin-bottom: 8px;">SRM Valliammai Engineering College</div>
              <h1 style="margin: 0; font-size: 32px; font-weight: 900; letter-spacing: 3px; color: #ffffff; text-transform: uppercase; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">TARAS 2K26</h1>
              <div style="font-size: 14px; font-weight: 600; color: #ffcccc; margin-top: 6px; letter-spacing: 1px;">National Level Technical Symposium • Department of ECE</div>
            </td>
          </tr>

          <!-- BADGE -->
          <tr>
            <td style="padding: 25px 30px 10px 30px; text-align: center;">
              <span style="display: inline-block; background-color: rgba(46, 204, 113, 0.15); border: 1px solid #2ecc71; color: #2ecc71; font-weight: 700; font-size: 13px; padding: 6px 18px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1.5px;">
                ✓ Registration Confirmed
              </span>
            </td>
          </tr>

          <!-- MAIN CONTENT -->
          <tr>
            <td style="padding: 10px 30px 30px 30px;">
              <h2 style="font-size: 22px; margin-top: 10px; margin-bottom: 15px; color: #ffffff; font-weight: 700;">
                Welcome, <span style="color: #ff4d4d;">${escapeHtml(data.participantName)}</span>!
              </h2>
              <p style="font-size: 15px; line-height: 1.6; color: #b3b3b3; margin-bottom: 25px;">
                Your registration for <strong>TARAS 2K26</strong> has been officially confirmed. Get ready to experience an extraordinary showcase of innovation, competitive technical events, and Marvel-themed challenges!
              </p>

              <!-- DETAILS CARD -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #14141f; border-left: 4px solid #e50914; border-radius: 6px; margin-bottom: 25px; padding: 20px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #a0a0a0; width: 140px;">Participant ID:</td>
                  <td style="padding: 6px 0; font-size: 15px; font-weight: 700; color: #ff4d4d; font-family: monospace;">${escapeHtml(data.participantId)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #a0a0a0;">Institution:</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #ffffff;">${escapeHtml(data.college)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #a0a0a0;">Department:</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #ffffff;">${escapeHtml(data.department)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #a0a0a0;">Event Date:</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #2ecc71;">${escapeHtml(data.eventDate)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #a0a0a0;">Venue:</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #ffffff;">${escapeHtml(data.venue)}</td>
                </tr>
              </table>

              <!-- REGISTERED EVENTS -->
              <div style="background-color: #12121c; border: 1px solid #262636; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 16px; color: #ffffff; border-bottom: 1px solid #262636; padding-bottom: 8px; font-weight: 700;">
                  Registered Event(s)
                </h3>
                <ul style="margin: 0; padding-left: 15px; list-style-type: none;">
                  ${eventsListHtml}
                </ul>
              </div>

              <!-- INSTRUCTIONS -->
              <div style="background-color: rgba(229, 9, 20, 0.08); border: 1px dashed rgba(229, 9, 20, 0.4); border-radius: 8px; padding: 18px; margin-bottom: 25px;">
                <h4 style="margin-top: 0; margin-bottom: 10px; color: #ff6666; font-size: 15px; font-weight: 700;">
                  📌 Essential Check-In Instructions
                </h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #cccccc; line-height: 1.6;">
                  <li>Bring your official College ID card on event day.</li>
                  <li>Present your <strong>Participant ID (${escapeHtml(data.participantId)})</strong> or QR Pass at the registration desk.</li>
                  <li>Venue check-in opens at <strong>08:30 AM IST</strong> on 26 September 2026.</li>
                  <li>Please arrive on time for inaugural instructions and event briefing.</li>
                </ul>
              </div>

              <!-- FOOTER & SUPPORT -->
              <div style="text-align: center; border-top: 1px solid #262636; padding-top: 20px; margin-top: 30px;">
                <p style="font-size: 13px; color: #888899; margin-bottom: 8px;">
                  Need assistance? Contact our team at <a href="mailto:taras2k26@valliammai.edu.in" style="color: #ff4d4d; text-decoration: none;">taras2k26@valliammai.edu.in</a>
                </p>
                <p style="font-size: 12px; color: #555566; margin: 0;">
                  Department of Electronics & Communication Engineering • SRM Valliammai Engineering College<br>
                  SRM Nagar, Kattankulathur, Chengalpattu District, Tamil Nadu 603203
                </p>
              </div>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `TARAS 2K26 — Registration Confirmed

Dear ${data.participantName},

Your registration for TARAS 2K26 has been officially confirmed!

Participant Details:
- Participant ID: ${data.participantId}
- College: ${data.college}
- Department: ${data.department}
- Event Date: ${data.eventDate}
- Venue: ${data.venue}

Registered Events:
${data.registeredEvents.map(e => `- ${e}`).join('\n')}

Check-In Instructions:
1. Bring your official College ID card on event day.
2. Present your Participant ID (${data.participantId}) at the desk.
3. Venue check-in opens at 08:30 AM IST on 26 September 2026.

Contact / Support: taras2k26@valliammai.edu.in
SRM Valliammai Engineering College, Department of ECE`;

  return { subject, html, text };
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
