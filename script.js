const cartDrawer = document.querySelector('[data-cart-drawer]');
const cartBody = document.querySelector('[data-cart-body]');
const cartCount = document.querySelector('[data-cart-count]');
const cartTotal = document.querySelector('[data-cart-total]');
let cartQuantity = 0;
const unitPrice = 399;

function renderCart() {
  cartCount.textContent = cartQuantity;
  cartTotal.textContent = `₹${cartQuantity * unitPrice}`;
  cartBody.innerHTML = cartQuantity
    ? `<div class="cart-item"><div><strong>New Monk 4-pack</strong><small>250ml glass bottles · Nannari + Lemon</small></div><div><strong>₹${cartQuantity * unitPrice}</strong><button type="button" data-remove-item>Remove</button></div></div>`
    : '<p class="empty-cart">Your cart is waiting for a good plan.</p>';
}

function setDrawer(open) {
  cartDrawer.classList.toggle('is-open', open);
  cartDrawer.setAttribute('aria-hidden', String(!open));
  document.body.style.overflow = open ? 'hidden' : '';
}

document.querySelectorAll('[data-add-to-cart]').forEach((button) => {
  button.addEventListener('click', () => {
    cartQuantity += 1;
    renderCart();
    setDrawer(true);
  });
});

document.querySelector('[data-cart-open]').addEventListener('click', () => setDrawer(true));
document.querySelectorAll('[data-cart-close]').forEach((button) => button.addEventListener('click', () => setDrawer(false)));
cartBody.addEventListener('click', (event) => {
  if (event.target.matches('[data-remove-item]')) {
    cartQuantity = 0;
    renderCart();
  }
});

document.querySelector('.checkout-button').addEventListener('click', () => {
  if (cartQuantity) window.location.href = 'mailto:hello@newmonk.in?subject=New Monk order&body=I would like to order a 4-pack of New Monk.';
});

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

renderCart();
