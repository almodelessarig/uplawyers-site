const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const BITRIX_WEBHOOK_URL = process.env.BITRIX_WEBHOOK_URL;

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sanitizePageUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.href.slice(0, 2000);
  } catch {
    return null;
  }
}

function formatPageLabel(pageUrl) {
  try {
    const u = new URL(pageUrl);
    const path = u.pathname || '/';
    return path === '/' ? u.hostname : `${u.hostname}${path}`;
  } catch {
    return '—';
  }
}

function normalizePhoneKZ(raw) {
  if (!raw) return null;
  const s = String(raw).replace(/[^\d+]/g, '');
  let digits = s.replace(/^\+/, '');
  if (digits.length === 10) digits = '7' + digits;
  if (digits.length === 11 && digits.startsWith('8')) digits = '7' + digits.slice(1);
  if (digits.length !== 11 || !digits.startsWith('7')) return null;
  return '+' + digits;
}

function clientIp(req) {
  const xfwd = req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For'] || '';
  if (typeof xfwd === 'string' && xfwd) return xfwd.split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '';
}

async function sendTelegram(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
  const j = await r.json().catch(() => null);
  if (!j || !j.ok) throw new Error('telegram: ' + JSON.stringify(j));
  return j;
}

async function sendBitrix({ name, phone, formType, pageUrl, comments, utm }) {
  if (!BITRIX_WEBHOOK_URL) return null;
  const base = BITRIX_WEBHOOK_URL.replace(/\/$/, '');
  const url = `${base}/crm.lead.add.json`;
  const fields = {
    TITLE: `Заявка с сайта — ${formType}`,
    NAME: name,
    PHONE: [{ VALUE: phone, VALUE_TYPE: 'WORK' }],
    SOURCE_DESCRIPTION: pageUrl || 'up-lawyers.kz',
    COMMENTS: comments,
    UTM_SOURCE: utm.source || '',
    UTM_MEDIUM: utm.medium || '',
    UTM_CAMPAIGN: utm.campaign || '',
    UTM_CONTENT: utm.content || '',
    UTM_TERM: utm.term || '',
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields, params: { REGISTER_SONET_EVENT: 'Y' } }),
  });
  const j = await r.json().catch(() => null);
  if (!j || j.error) throw new Error('bitrix: ' + JSON.stringify(j));
  return j;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error(JSON.stringify({ event: 'config_missing', missing: 'telegram' }));
    res.status(500).json({ success: false, message: 'Server misconfigured' });
    return;
  }

  try {
    const data = req.body || {};
    console.log(JSON.stringify({ event: 'incoming', body: data }));

    if (data.up_website || data.website) {
      console.warn(JSON.stringify({ event: 'honeypot_triggered', ip: clientIp(req) }));
      res.status(200).json({ success: true, message: 'OK' });
      return;
    }

    const name = String(data.name || '').trim();
    const phoneRaw = String(data.phone || '').trim();

    if (!name || !phoneRaw) {
      console.warn(JSON.stringify({ event: 'validation_failed', reason: 'missing_fields', got: { name: !!name, phone: !!phoneRaw } }));
      res.status(400).json({ success: false, message: 'Заполните имя и телефон' });
      return;
    }

    const phoneE164 = normalizePhoneKZ(phoneRaw) || phoneRaw;

    const formType = String(data.form_type || 'Форма').trim();
    const clinicType = String(data.clinic_type || '').trim();
    const venueType = String(data.venue_type || '').trim();
    const quizAnswers = Array.isArray(data.answers) ? data.answers.filter(Boolean) : [];

    const pageUrl = sanitizePageUrl(data.page_url);
    const referrer = String(data.referrer || '').trim().slice(0, 500);
    const timestamp = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' });

    const utm = {
      source: String(data.utm_source || '').trim().slice(0, 200),
      medium: String(data.utm_medium || '').trim().slice(0, 200),
      campaign: String(data.utm_campaign || '').trim().slice(0, 200),
      content: String(data.utm_content || '').trim().slice(0, 200),
      term: String(data.utm_term || '').trim().slice(0, 200),
    };

    let message = `🔔 <b>Новая заявка с сайта UP Lawyers</b>\n\n`;
    message += `👤 <b>Имя:</b> ${escapeHtml(name)}\n`;
    message += `📱 <b>Телефон:</b> ${escapeHtml(phoneE164)}\n`;
    message += `📝 <b>Форма:</b> ${escapeHtml(formType)}\n`;
    message += `🕐 <b>Время:</b> ${escapeHtml(timestamp)}\n\n`;

    if (pageUrl) {
      message += `🌐 <b>Страница:</b> <a href="${escapeHtml(pageUrl)}">${escapeHtml(formatPageLabel(pageUrl))}</a>\n\n`;
    }

    const details = [];
    if (clinicType) details.push(`Тип клиники: ${clinicType}`);
    if (venueType) details.push(`Тип заведения: ${venueType}`);
    if (quizAnswers.length) {
      quizAnswers.forEach((a, i) => details.push(`Ответ ${i + 1}: ${a}`));
    }
    if (details.length) {
      message += `📋 <b>Данные из формы:</b>\n`;
      details.forEach((line, i) => {
        const prefix = i === details.length - 1 ? '└' : '├';
        message += `${prefix} ${escapeHtml(line)}\n`;
      });
      message += `\n`;
    }

    message += `📊 <b>UTM-метки:</b>\n`;
    message += `├ Source: ${escapeHtml(utm.source || 'Прямой заход')}\n`;
    message += `├ Medium: ${escapeHtml(utm.medium || '-')}\n`;
    message += `├ Campaign: ${escapeHtml(utm.campaign || '-')}\n`;
    message += `├ Term: ${escapeHtml(utm.term || '-')}\n`;
    message += `└ Content: ${escapeHtml(utm.content || '-')}\n\n`;

    message += `🔗 <b>Источник перехода:</b> ${escapeHtml(referrer || '-')}`;

    const comments = [
      clinicType && `Тип клиники: ${clinicType}`,
      venueType && `Тип заведения: ${venueType}`,
      quizAnswers.length && `Ответы квиза: ${quizAnswers.join(' | ')}`,
      referrer && `Referrer: ${referrer}`,
      pageUrl && `Страница: ${pageUrl}`,
    ].filter(Boolean).join('\n');

    const [tgRes, bxRes] = await Promise.allSettled([
      sendTelegram(message),
      sendBitrix({ name, phone: phoneE164, formType, pageUrl, comments, utm }),
    ]);

    if (tgRes.status === 'rejected') {
      console.error(JSON.stringify({ event: 'telegram_failed', err: String(tgRes.reason) }));
    }
    if (bxRes.status === 'rejected') {
      console.error(JSON.stringify({ event: 'bitrix_failed', err: String(bxRes.reason) }));
    }

    const tgOk = tgRes.status === 'fulfilled';
    const bxOk = bxRes.status === 'fulfilled' && bxRes.value != null;

    if (tgOk || bxOk) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ success: false, message: 'Ошибка отправки' });
    }
  } catch (error) {
    console.error(JSON.stringify({ event: 'handler_error', err: String(error?.stack || error) }));
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}
