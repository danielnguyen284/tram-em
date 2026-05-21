export function animateFlyToCart(sourceImage: HTMLImageElement | null) {
  if (!sourceImage) return;

  // Find the cart icon (desktop or mobile)
  const cartIcon = 
    (document.getElementById('global-cart-icon-desktop') && window.getComputedStyle(document.getElementById('global-cart-icon-desktop')!).display !== 'none' 
      ? document.getElementById('global-cart-icon-desktop') 
      : document.getElementById('global-cart-icon-mobile')) 
    || document.getElementById('global-cart-icon-desktop');
    
  if (!cartIcon) return;

  const sourceRect = sourceImage.getBoundingClientRect();
  const targetRect = cartIcon.getBoundingClientRect();

  // Create clone
  const clone = sourceImage.cloneNode(true) as HTMLImageElement;
  
  // Style clone for animation
  clone.style.position = 'fixed';
  clone.style.top = `${sourceRect.top}px`;
  clone.style.left = `${sourceRect.left}px`;
  clone.style.width = `${sourceRect.width}px`;
  clone.style.height = `${sourceRect.height}px`;
  clone.style.objectFit = 'cover';
  clone.style.borderRadius = '8px';
  clone.style.zIndex = '99999';
  clone.style.transition = 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
  clone.style.pointerEvents = 'none';
  clone.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';

  document.body.appendChild(clone);

  // Trigger animation on next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      clone.style.top = `${targetRect.top + targetRect.height / 2 - 10}px`;
      clone.style.left = `${targetRect.left + targetRect.width / 2 - 10}px`;
      clone.style.width = '20px';
      clone.style.height = '20px';
      clone.style.opacity = '0.3';
      clone.style.borderRadius = '50%';
    });
  });

  // Remove clone after transition and bump cart icon
  setTimeout(() => {
    clone.remove();
    cartIcon.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.2)' },
        { transform: 'scale(1)' }
      ],
      { duration: 300, easing: 'ease-out' }
    );
  }, 600);
}
