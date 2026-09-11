const IPINFO_TIMEOUT_MS = 1500;

function getHeader(headers, name) {
  const target = name.toLowerCase();
  const key = Object.keys(headers || {}).find((headerName) => headerName.toLowerCase() === target);
  return key ? headers[key] : '';
}

function getVisitorIp(request) {
  const forwardedFor = getHeader(request.headers, 'x-forwarded-for');
  return (
    getHeader(request.headers, 'cf-connecting-ip') ||
    forwardedFor.split(',')[0].trim() ||
    getHeader(request.headers, 'x-real-ip') ||
    request.socket?.remoteAddress ||
    ''
  );
}

module.exports = async (request, response) => {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ city: null });
  }

  const token = process.env.IPINFO_TOKEN;
  const ip = getVisitorIp(request);
  if (!token || !ip) {
    return response.status(200).json({ city: null });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IPINFO_TIMEOUT_MS);

  try {
    const result = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}/json?token=${encodeURIComponent(token)}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    if (!result.ok) {
      return response.status(200).json({ city: null });
    }

    const location = await result.json();
    response.setHeader('Cache-Control', 'private, max-age=300');
    return response.status(200).json({ city: location.country === 'IN' ? location.city || null : null });
  } catch {
    return response.status(200).json({ city: null });
  } finally {
    clearTimeout(timeout);
  }
};
