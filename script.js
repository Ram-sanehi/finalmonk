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

const BLINKIT_FALLBACK = 'https://blinkit.com/';
const BLINKIT_CITY_URLS = {
  Bangalore: '',
  Bengaluru: '',
  Mumbai: '',
  Delhi: '',
  Hyderabad: '',
  Chennai: '',
  Pune: '',
  Kolkata: ''
};
const blinkitLinks = document.querySelectorAll('[data-blinkit-cta]');

function normalizeCity(city) {
  return city.trim().toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function setBlinkitDestination(city) {
  const destination = BLINKIT_CITY_URLS[normalizeCity(city)] || BLINKIT_FALLBACK;
  blinkitLinks.forEach((link) => {
    link.href = destination;
  });
}

async function resolveBlinkitDestination() {
  const cachedCity = sessionStorage.getItem('newMonkBlinkitCity');
  if (cachedCity) {
    setBlinkitDestination(cachedCity);
    return;
  }
  setBlinkitDestination('');
  try {
    const response = await fetch('https://ipapi.co/json/', { headers: { Accept: 'application/json' } });
    if (!response.ok) return;
    const location = await response.json();
    if (location.city) {
      sessionStorage.setItem('newMonkBlinkitCity', location.city);
      setBlinkitDestination(location.city);
    }
  } catch {
    setBlinkitDestination('');
  }
}

resolveBlinkitDestination();
