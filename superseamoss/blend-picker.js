import { blends } from './blend-preview-data.mjs?v=water-colours1';

export function createBlendPickers(form, selects) {
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
    header.append(selected);
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
      photo.style.setProperty('--jar-image', `url("${new URL(`./assets/preview/jars-fit/${blend.id}.webp?v=edges-clean1`, import.meta.url).href}")`);
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
    footer.textContent = '15 blends · choose your favourite';
    picker.append(header, track, footer);
    select.after(picker);
    // Keep the existing form value and pricing flow; the visible control is the image picker.
    select.hidden = true;

    function choose(id) {
      if (select.disabled) return;
      select.value = id;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function sync() {
      selectedName.textContent = select.selectedOptions[0].textContent;
      choices.forEach(button => {
        const checked = button.dataset.blend === select.value;
        button.setAttribute('aria-checked', String(checked));
        button.tabIndex = checked ? 0 : -1;
        button.disabled = select.disabled;
      });
    }
    track.addEventListener('keydown', event => {
      const index = choices.indexOf(event.target);
      if (index === -1 || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const columns = getComputedStyle(track).gridTemplateColumns.split(' ').length;
      const step = event.key === 'ArrowUp' ? -columns : event.key === 'ArrowDown' ? columns
        : event.key === 'ArrowLeft' ? -1 : 1;
      const targetIndex = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1
        : (index + step + choices.length) % choices.length;
      choose(choices[targetIndex].dataset.blend);
      choices[targetIndex].focus();
    });
    label.addEventListener('click', event => {
      event.preventDefault();
      choices.find(button => button.dataset.blend === select.value)?.focus({ preventScroll: true });
    });
    sync();
    return { sync };
  });
  form.addEventListener('change', () => pickers.forEach(picker => picker.sync()));
}
