import { blends } from './blend-preview-data.mjs?v=qc2';

export function createBlendPickers(form, selects) {
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const pickers = selects.map((select, jarIndex) => {
    const field = select.closest('.order-blend-field');
    const label = field.querySelector('label');
    label.id = `blend-picker-label-${jarIndex + 1}`;
    const picker = document.createElement('div');
    picker.className = 'blend-picker';
    picker.dataset.jar = jarIndex + 1;
    const header = document.createElement('div');
    header.className = 'blend-picker-header';
    const selected = document.createElement('p');
    selected.className = 'blend-picker-selected';
    const prefix = document.createElement('span');
    prefix.textContent = 'Selected: ';
    const selectedName = document.createElement('strong');
    selected.append(prefix, selectedName);
    const controls = document.createElement('div');
    controls.className = 'blend-picker-controls';
    const previous = document.createElement('button');
    const next = document.createElement('button');
    for (const [button, direction, symbol] of [[previous, 'Previous', '‹'], [next, 'Next', '›']]) {
      button.type = 'button';
      button.className = 'blend-picker-arrow';
      button.setAttribute('aria-label', `${direction} blends for jar ${jarIndex + 1}`);
      button.textContent = symbol;
      controls.append(button);
    }
    header.append(selected, controls);
    const track = document.createElement('div');
    track.className = 'blend-picker-track';
    track.setAttribute('role', 'radiogroup');
    track.setAttribute('aria-labelledby', label.id);
    const choices = [...select.options].map(option => {
      const blend = blends.find(item => item.id === option.value);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'blend-picker-choice';
      button.dataset.blend = blend.id;
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-label', option.textContent);
      const frame = document.createElement('span');
      frame.className = 'blend-picker-frame';
      frame.setAttribute('aria-hidden', 'true');
      const photo = document.createElement('span');
      photo.className = 'blend-picker-photo';
      photo.style.setProperty('--jar-image', `url("${new URL(`./assets/preview/jars-fit/${blend.id}.webp?v=repack1`, import.meta.url).href}")`);
      const tick = document.createElement('span');
      tick.className = 'blend-picker-tick';
      tick.textContent = '✓';
      frame.append(photo, tick);
      const name = document.createElement('span');
      name.className = 'blend-picker-name';
      name.textContent = option.textContent;
      button.append(frame, name);
      button.addEventListener('click', () => choose(blend.id));
      track.append(button);
      return button;
    });
    const footer = document.createElement('p');
    footer.className = 'blend-picker-hint';
    footer.textContent = '15 blends · swipe or use the arrows';
    picker.append(header, track, footer);
    select.after(picker);
    // Keep the existing form value and pricing flow; the visible control is the image picker.
    select.hidden = true;

    function choose(id) {
      if (select.disabled) return;
      select.value = id;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const shouldAnimate = () => !media.matches && !document.body.classList.contains('paused');
    function centre(button, smooth = false) {
      const trackBox = track.getBoundingClientRect();
      const buttonBox = button.getBoundingClientRect();
      track.scrollTo({
        left: track.scrollLeft + buttonBox.left - trackBox.left - (track.clientWidth - buttonBox.width) / 2,
        behavior: smooth && shouldAnimate() ? 'smooth' : 'instant'
      });
    }
    function updateArrows() {
      previous.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    }
    function sync() {
      selectedName.textContent = select.selectedOptions[0].textContent;
      choices.forEach(button => {
        const checked = button.dataset.blend === select.value;
        button.setAttribute('aria-checked', String(checked));
        button.tabIndex = checked ? 0 : -1;
        button.disabled = select.disabled;
      });
      if (track.clientWidth) centre(choices.find(button => button.dataset.blend === select.value));
      updateArrows();
    }
    track.addEventListener('keydown', event => {
      const index = choices.indexOf(event.target);
      if (index === -1 || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const targetIndex = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1
        : (index + (['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1) + choices.length) % choices.length;
      choose(choices[targetIndex].dataset.blend);
      choices[targetIndex].focus({ preventScroll: true });
      centre(choices[targetIndex]);
    });
    const browse = direction => track.scrollBy({ left: direction * track.clientWidth * .85, behavior: shouldAnimate() ? 'smooth' : 'instant' });
    previous.addEventListener('click', () => browse(-1));
    next.addEventListener('click', () => browse(1));
    track.addEventListener('scroll', updateArrows, { passive: true });
    label.addEventListener('click', event => {
      event.preventDefault();
      choices.find(button => button.dataset.blend === select.value)?.focus({ preventScroll: true });
    });
    // A hidden bundle field has no measurable width until its jar is enabled.
    const resize = new ResizeObserver(() => {
      if (!track.clientWidth) return;
      centre(choices.find(button => button.dataset.blend === select.value));
      updateArrows();
    });
    resize.observe(track);
    sync();
    return { sync };
  });
  form.addEventListener('change', () => pickers.forEach(picker => picker.sync()));
}
