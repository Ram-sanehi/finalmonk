const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

document.querySelectorAll('.info-trigger').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const currentItem = trigger.closest('.info-item');
    const shouldOpen = !currentItem.classList.contains('is-open');
    document.querySelectorAll('.info-item').forEach((item) => {
      item.classList.remove('is-open');
      item.querySelector('.info-trigger').setAttribute('aria-expanded', 'false');
      item.querySelector('.info-trigger strong').textContent = '+';
      item.querySelector('.info-panel').hidden = true;
    });
    if (shouldOpen) {
      currentItem.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      trigger.querySelector('strong').textContent = '−';
      currentItem.querySelector('.info-panel').hidden = false;
    }
  });
});

const BLINKIT_FALLBACK = 'https://blinkit.com/prn/x/prid/785887';
const BLINKIT_SESSION_KEY = 'newMonkBlinkitLocation';
const blinkitLinks = document.querySelectorAll('.blinkit-cta');
let blinkitLocationRequest = null;

let blinkitUrlConfig = { IN_DEFAULT: BLINKIT_FALLBACK, cities: {} };

function normalizeCity(city) {
  return city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

function getCityUrl(city) {
  const normalizedCity = normalizeCity(city);
  const cityKey = Object.keys(blinkitUrlConfig.cities).find((key) => normalizeCity(key) === normalizedCity);
  const destination = blinkitUrlConfig.cities[cityKey] || blinkitUrlConfig.cities[normalizedCity];
  const fallback = blinkitUrlConfig.IN_DEFAULT;
  const resolvedDestination = destination || fallback;
  return typeof resolvedDestination === 'string' && resolvedDestination.startsWith('https://blinkit.com/')
    ? resolvedDestination
    : BLINKIT_FALLBACK;
}

function setBlinkitDestination(city) {
  const destination = city ? getCityUrl(city) : BLINKIT_FALLBACK;
  blinkitLinks.forEach((link) => {
    link.href = destination;
  });
  return destination;
}

function getBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 300000
    });
  });
}

async function getCityFromCoordinates(latitude, longitude) {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`, {
    headers: { Accept: 'application/json' }
  });
  if (!response.ok) throw new Error('Location lookup failed');

  const location = await response.json();
  if (location.address?.country_code !== 'in') throw new Error('Location is outside India');
  return location.address.city || location.address.town || location.address.village || location.address.municipality || null;
}

async function resolveBlinkitFromBrowserLocation() {
  const position = await getBrowserPosition();
  return getCityFromCoordinates(position.coords.latitude, position.coords.longitude);
}

async function handleBlinkitClick(event) {
  if (event.currentTarget.dataset.locationResolved === 'true') {
    delete event.currentTarget.dataset.locationResolved;
    return;
  }

  event.preventDefault();
  const clickedLink = event.currentTarget;
  const fallbackDestination = clickedLink.href || BLINKIT_FALLBACK;

  if (!blinkitLocationRequest) {
    blinkitLocationRequest = resolveBlinkitFromBrowserLocation()
      .then((city) => city ? setBlinkitDestination(city) : Promise.reject(new Error('City not found')))
      .catch(() => resolveBlinkitDestination().then(() => clickedLink.href || fallbackDestination))
      .finally(() => {
        blinkitLocationRequest = null;
      });
  }

  const destination = await blinkitLocationRequest;
  clickedLink.href = destination || fallbackDestination;
  clickedLink.dataset.locationResolved = 'true';
  clickedLink.click();
}

async function loadBlinkitConfig() {
  try {
    const response = await fetch('/config/blinkit-urls.json', { headers: { Accept: 'application/json' } });
    if (response.ok) {
      blinkitUrlConfig = await response.json();
    }
  } catch {
    blinkitUrlConfig = { IN_DEFAULT: BLINKIT_FALLBACK, cities: {} };
  }
}

async function resolveBlinkitDestination() {
  setBlinkitDestination('');
  let cachedLocation = null;
  try {
    cachedLocation = JSON.parse(sessionStorage.getItem(BLINKIT_SESSION_KEY) || 'null');
  } catch {
    cachedLocation = null;
  }
  if (cachedLocation?.city) {
    setBlinkitDestination(cachedLocation.city);
    return;
  }

  try {
    const response = await fetch('/api/detect-city', { headers: { Accept: 'application/json' } });
    if (!response.ok) return;
    const location = await response.json();
    if (location.city) {
      try {
        sessionStorage.setItem(BLINKIT_SESSION_KEY, JSON.stringify({ city: location.city }));
      } catch {
      }
      setBlinkitDestination(location.city);
    }
  } catch {
    setBlinkitDestination('');
  }
}

loadBlinkitConfig().then(resolveBlinkitDestination);
