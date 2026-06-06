import { Resend } from 'resend';
import type { ScoredLead } from '../signals/base';

// Set SEND_EMAIL=true in GitHub Actions secrets when you're ready to activate delivery.
export async function sendWeeklyDigest(leads: ScoredLead[]): Promise<void> {
  const top = leads.sort((a, b) => b.score - a.score).slice(0, 15);
  const html = buildHtml(top);
  const text = buildText(top);

  const sendEnabled = process.env.SEND_EMAIL === 'true';

  if (!sendEnabled) {
    console.log('[digest] SEND_EMAIL not set — draft mode, not sending');
    console.log('[digest] Draft preview (text):');
    console.log(text);
    return;
  }

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
  const chCount = top.filter(l => l.source === 'companies-house').length;
  const planningCount = top.filter(l => l.source.startsWith('planning:')).length;
  const subjectParts: string[] = [];
  if (chCount > 0) subjectParts.push(`${chCount} Companies House`);
  if (planningCount > 0) subjectParts.push(`${planningCount} planning`);
  const subject = `MacFire Lead Scout — ${subjectParts.join(', ')} lead${top.length === 1 ? '' : 's'} this week`;

  await resend.emails.send({
    from: 'MacFire Lead Scout <scout@macfireltd.co.uk>',
    to,
    subject,
    html,
    text,
  });

  console.log(`[digest] Sent to ${to}`);
}

function buildHtml(leads: ScoredLead[]): string {
  if (leads.length === 0) return '<p>No significant new leads this week.</p>';

  const rows = leads.map(l => {
    const isChLead = l.source === 'companies-house';
    const nameCell = isChLead
      ? `<strong>${l.companyName ?? l.address}</strong><br><small style="color:#666">${l.sector ?? ''} · ${l.trigger ?? ''}</small>`
      : l.address;
    const descCell = isChLead
      ? `${l.directorName ? `Director: ${l.directorName}` : ''}${l.emailAddress ? ` · ${l.emailAddress}` : ''}${l.websiteUrl ? ` · <a href="${l.websiteUrl}">${l.websiteDomain ?? 'website'}</a>` : ''}`
      : (l.description ?? '');
    const sourceLabel = isChLead ? 'CH' : l.source.replace('planning:', '').toUpperCase();
    return `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;font-size:12px;color:#999">${sourceLabel}</td>
      <td style="padding:8px;border-bottom:1px solid #eee">${nameCell}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px">${descCell}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;font-weight:bold;color:${l.score >= 75 ? '#c0392b' : '#e67e22'}">${l.score}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;font-size:11px;color:#888">${l.flags.join(', ')}</td>
    </tr>`;
  }).join('');

  return `
    <h2 style="font-family:sans-serif;color:#c0392b">MacFire Lead Scout</h2>
    <p style="font-family:sans-serif">${leads.length} new lead${leads.length === 1 ? '' : 's'} found this week:</p>
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:13px">
      <thead>
        <tr style="background:#f5f5f5">
          <th style="padding:8px;text-align:left;font-size:11px">Source</th>
          <th style="padding:8px;text-align:left">Company / Address</th>
          <th style="padding:8px;text-align:left">Details</th>
          <th style="padding:8px;text-align:center">Score</th>
          <th style="padding:8px;text-align:left;font-size:11px">Signals</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-family:sans-serif;font-size:12px;color:#999;margin-top:20px">
      Full lead details including email drafts are in Supabase → leads table.
    </p>`;
}

function buildText(leads: ScoredLead[]): string {
  if (leads.length === 0) return 'No significant new leads this week.';

  const lines = leads.map((l, i) => {
    const isChLead = l.source === 'companies-house';
    const header = isChLead
      ? `${i + 1}. [CH] ${l.companyName ?? l.address} — ${l.sector ?? ''}`
      : `${i + 1}. [${l.source.replace('planning:', '').toUpperCase()}] ${l.address}`;
    const detail = isChLead
      ? [
          l.trigger,
          l.directorName ? `Director: ${l.directorName}` : null,
          l.emailAddress ? `Email: ${l.emailAddress}` : null,
          l.phoneNumber ? `Phone: ${l.phoneNumber}` : null,
          l.websiteUrl ? `Website: ${l.websiteUrl}` : null,
          l.mapsUrl ? `Maps: ${l.mapsUrl}` : null,
        ].filter(Boolean).join('\n   ')
      : l.description ?? '';

    return `${header}\n   ${detail}\n   Score: ${l.score} | ${l.flags.join(', ')}`;
  });

  return ['MacFire Lead Scout — weekly digest', '', ...lines].join('\n\n');
}
