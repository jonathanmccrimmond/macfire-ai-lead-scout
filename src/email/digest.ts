import { Resend } from 'resend';
import type { ScoredLead } from '../signals/base';

export async function sendWeeklyDigest(leads: ScoredLead[]): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log('[digest] RESEND_API_KEY not set — skipping email');
    return;
  }

  const to = process.env.DOUGIE_EMAIL;
  if (!to) {
    console.log('[digest] DOUGIE_EMAIL not set — skipping email');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const top = leads.sort((a, b) => b.score - a.score).slice(0, 10);

  await resend.emails.send({
    from: 'MacFire Lead Scout <scout@macfireltd.co.uk>',
    to,
    subject: `MacFire Lead Scout — ${top.length} new lead${top.length === 1 ? '' : 's'} this week`,
    html: buildHtml(top),
    text: buildText(top),
  });
}

function buildHtml(leads: ScoredLead[]): string {
  if (leads.length === 0) return '<p>No significant new leads this week.</p>';

  const rows = leads.map(l => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${l.address}</td>
      <td style="padding:8px;border-bottom:1px solid #eee">${l.description}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;font-weight:bold">${l.score}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;font-size:12px;color:#666">${l.flags.join(', ')}</td>
    </tr>`).join('');

  return `
    <h2 style="font-family:sans-serif;color:#c0392b">MacFire Lead Scout</h2>
    <p style="font-family:sans-serif">${leads.length} new lead${leads.length === 1 ? '' : 's'} found this week:</p>
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
      <thead>
        <tr style="background:#f5f5f5">
          <th style="padding:8px;text-align:left">Address</th>
          <th style="padding:8px;text-align:left">Proposal</th>
          <th style="padding:8px;text-align:center">Score</th>
          <th style="padding:8px;text-align:left">Signals</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildText(leads: ScoredLead[]): string {
  if (leads.length === 0) return 'No significant new leads this week.';

  return [
    'MacFire Lead Scout — weekly digest',
    '',
    ...leads.map((l, i) =>
      `${i + 1}. ${l.address}\n   ${l.description}\n   Score: ${l.score} | ${l.flags.join(', ')}`
    ),
  ].join('\n');
}
