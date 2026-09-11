const IPINFO_TIMEOUT_MS = 1500;

function getHeader(headers, name) {
  const target = name.toLowerCase();
  const key = Object.keys(headers || {}).find((headerName) => headerName.toLowerCase() === target);
  return key ? headers[key] : '';
}

function getVisitorIp(event) {
  const forwardedFor = getHeader(event.headers, 'x-forwarded-for');
  return (
    getHeader(event.headers, 'cf-connecting-ip') ||
    forwardedFor.split(',')[0].trim() ||
    getHeader(event.headers, 'x-real-ip') ||
    event.requestContext?.identity?.sourceIp ||
    event.clientContext?.ip ||
    ''
  );
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: { Allow: 'GET' }, body: JSON.stringify({ city: null }) };
  }

  const token = process.env.IPINFO_TOKEN;
  const ip = getVisitorIp(event);
  if (!token || !ip) {
    return { statusCode: 200, body: JSON.stringify({ city: null }) };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IPINFO_TIMEOUT_MS);

  try {
    const response = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}/json?token=${encodeURIComponent(token)}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    if (!response.ok) {
      return { statusCode: 200, body: JSON.stringify({ city: null }) };
    }

    const location = await response.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=300' },
      body: JSON.stringify({ city: location.country === 'IN' ? location.city || null : null })
    };
  } catch {
    return { statusCode: 200, body: JSON.stringify({ city: null }) };
  } finally {
    clearTimeout(timeout);
  }
};
