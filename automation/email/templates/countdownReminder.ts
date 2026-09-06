export type CountdownTrigger = '7d' | '3d' | '1d' | '0d';

export interface CountdownEmailData {
  participantName: string;
  participantId: string;
  email: string;
  college: string;
  registeredEvents: string[];
  trigger: CountdownTrigger;
  eventDate: string; // e.g. "26 September 2026"
  venue: string;
}

export function generateCountdownReminderEmail(data: CountdownEmailData): { subject: string; html: string; text: string } {
  let titleHeadline = '';
  let badgeLabel = '';
  let subMessage = '';

  switch (data.trigger) {
    case '7d':
      titleHeadline = '⏳ 7 DAYS TO GO!';
      badgeLabel = '1 WEEK COUNTDOWN';
      subMessage = 'The ultimate technical battlefield is just one week away! Finalize your preparations and sharpen your skills.';
      break;
    case '3d':
      titleHeadline = '⚡ 3 DAYS TO GO!';
      badgeLabel = '3 DAYS COUNTDOWN';
      subMessage = 'Just 3 days remaining! Get ready to crack the code, outsmart the cartel, and present your engineering breakthroughs.';
      break;
    case '1d':
      titleHeadline = '🔥 TOMORROW IS THE DAY!';
      badgeLabel = '1 DAY REMAINING';
      subMessage = 'TARAS 2K26 kicks off tomorrow morning! Double-check your presentations, models, and college ID card.';
      break;
    case '0d':
      titleHeadline = '🚀 TODAY IS THE DAY!';
      badgeLabel = 'EVENT DAY';
      subMessage = 'Welcome to TARAS 2K26! Venue doors and check-in desks are OPEN. We look forward to seeing you at SRM VEC!';
      break;
  }

  const subject = `TARAS 2K26 — ${titleHeadline} (${data.participantId})`;

  const eventsListHtml = data.registeredEvents.length > 0
    ? data.registeredEvents.map(event => `<li style="margin-bottom: 8px; color: #e0e0e0;"><strong style="color: #ff4d4d;">•</strong> ${event}</li>`).join('')
    : '<li style="color: #a0a0a0;">No specific events listed</li>';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titleHeadline}</title>
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
              <div style="font-size: 14px; font-weight: 600; color: #ffcccc; margin-top: 6px; letter-spacing: 1px;">Department of ECE • Official Countdown</div>
            </td>
          </tr>

          <!-- BADGE & HEADLINE -->
          <tr>
            <td style="padding: 30px 30px 10px 30px; text-align: center;">
              <span style="display: inline-block; background-color: rgba(229, 9, 20, 0.2); border: 1px solid #e50914; color: #ff4d4d; font-weight: 800; font-size: 13px; padding: 6px 18px; border-radius: 20px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px;">
                ${badgeLabel}
              </span>
              <h2 style="font-size: 28px; margin: 10px 0; color: #ffffff; font-weight: 900; letter-spacing: 1px;">
                ${titleHeadline}
              </h2>
            </td>
          </tr>

          <!-- MAIN CONTENT -->
          <tr>
            <td style="padding: 10px 30px 30px 30px;">
              <p style="font-size: 16px; line-height: 1.6; color: #e0e0e0; margin-bottom: 20px; text-align: center;">
                Hello <strong style="color: #ff4d4d;">${escapeHtml(data.participantName)}</strong>, ${subMessage}
              </p>

              <!-- SUMMARY CARD -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #14141f; border-left: 4px solid #e50914; border-radius: 6px; margin-bottom: 25px; padding: 20px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #a0a0a0; width: 140px;">Participant ID:</td>
                  <td style="padding: 6px 0; font-size: 15px; font-weight: 700; color: #ff4d4d; font-family: monospace;">${escapeHtml(data.participantId)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #a0a0a0;">Symposium Date:</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #2ecc71;">${escapeHtml(data.eventDate)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #a0a0a0;">Reporting Time:</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #ffffff;">08:30 AM IST</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #a0a0a0;">Venue:</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #ffffff;">${escapeHtml(data.venue)}</td>
                </tr>
              </table>

              <!-- REGISTERED EVENTS -->
              <div style="background-color: #12121c; border: 1px solid #262636; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 16px; color: #ffffff; border-bottom: 1px solid #262636; padding-bottom: 8px; font-weight: 700;">
                  Your Events Schedule
                </h3>
                <ul style="margin: 0; padding-left: 15px; list-style-type: none;">
                  ${eventsListHtml}
                </ul>
              </div>

              <!-- CHECKLIST -->
              <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid #262636; border-radius: 8px; padding: 18px; margin-bottom: 25px;">
                <h4 style="margin-top: 0; margin-bottom: 10px; color: #ff9999; font-size: 15px; font-weight: 700;">
                  📋 Event Day Readiness Checklist
                </h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #cccccc; line-height: 1.6;">
                  <li>Original College Physical ID Card (Mandatory).</li>
                  <li>Participant ID / QR Pass stored on your phone or printed.</li>
                  <li>Presentation slides on USB Drive & Cloud Backup (for Paper-X-Verse).</li>
                  <li>Arrive by 08:30 AM IST for seamless registration & check-in.</li>
                </ul>
              </div>

              <!-- FOOTER & SUPPORT -->
              <div style="text-align: center; border-top: 1px solid #262636; padding-top: 20px; margin-top: 30px;">
                <p style="font-size: 13px; color: #888899; margin-bottom: 8px;">
                  Have questions? Contact us at <a href="mailto:taras2k26@valliammai.edu.in" style="color: #ff4d4d; text-decoration: none;">taras2k26@valliammai.edu.in</a>
                </p>
                <p style="font-size: 12px; color: #555566; margin: 0;">
                  Department of ECE • SRM Valliammai Engineering College • Kattankulathur
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

  const text = `TARAS 2K26 — ${titleHeadline}

Hello ${data.participantName},

${subMessage}

Details:
- Participant ID: ${data.participantId}
- Event Date: ${data.eventDate}
- Reporting Time: 08:30 AM IST
- Venue: ${data.venue}

Your Registered Events:
${data.registeredEvents.map(e => `- ${e}`).join('\n')}

Event Day Checklist:
1. Original College Physical ID Card (Mandatory)
2. Participant ID (${data.participantId}) / QR Pass
3. Presentation slides on USB Drive (if applicable)

Contact: taras2k26@valliammai.edu.in`;

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
