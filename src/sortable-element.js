class SortableElement extends HTMLElement {

  static get styles() {
    const css = /* css */`
      :host {
        display: grid;
        grid-template-columns: repeat(var(--sortable-element--columns, 3), 1fr);
        grid-gap: var(--sortable-element--gap, 16px);
      }

      ::slotted(*) {
        transition: var(--__item--transition-duration, 200ms) transform ease;
      }
    `;
    return css;
  }

  static get template() {
    return /* html */ `
      <style>${this.styles}</style>
      <slot></slot>
    `;
  }

  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.innerHTML = this.constructor.template;
    this.shadowRoot.querySelector('slot').addEventListener('slotchange', this._handleSlotChange.bind(this));
    this.addEventListener('dragstart', this._handleDragstart.bind(this));
    this.addEventListener('dragover', this._handleDragover.bind(this));
    this.addEventListener('dragend', this._setItemOrder.bind(this));
  }

  get sortedChildren() {
    return [...this.children].sort((a, b) => {
      const aBounds = a.getBoundingClientRect();
      const bBounds = b.getBoundingClientRect();
      if(aBounds.top < bBounds.top) return -1;
      if(aBounds.top > bBounds.top) return 1;
      if(aBounds.left < bBounds.left) return -1;
      if(aBounds.left > bBounds.left) return 1;
      return 0;
    });
  }

  _handleSlotChange() {
    this._setItemOrder();
    this._enableDraggable();
  }

  _enableDraggable() {
    [...this.children].map(item => item.setAttribute('draggable', 'true'));
  }

  _handleDragstart(e) {
    this._startX = e.clientX;
    this._startY = e.clientY;
    this.__draggingItem = {node: e.target, bounds: e.target.getBoundingClientRect()};
    this.__draggingItemIndex = [...this.sortedChildren].indexOf(e.target);
    this._siblings = [...this.sortedChildren].map(node => { return {node: node, bounds: node.getBoundingClientRect()};});
  }

  _handleDragover(e) {
    e.preventDefault();

    const currentIndex = this.__draggingItemIndex;
    const newIndex = this._getNewIndex(e.clientX, e.clientY);

    if(this._newIndex !== newIndex) this._shuffleItems(currentIndex, newIndex);
    this._newIndex = newIndex;

  }

  _shuffleItems(currentIndex, newIndex) {
    if(newIndex === -1) return;
    const startIndex = Math.min(currentIndex, newIndex);
    const endIndex = Math.max(currentIndex, newIndex);
    for(let i=0;i<this._siblings.length;i++) this._shuffleItem(i, currentIndex, newIndex, startIndex, endIndex);
  }

  _shuffleItem(i, currentIndex, newIndex, startIndex, endIndex) {

    let translateX, translateY;
    
    if(i === this.__draggingItemIndex) {
      translateX = this._siblings[newIndex].bounds.left - this._siblings[i].bounds.left;
      translateY = this._siblings[newIndex].bounds.top - this._siblings[i].bounds.top;
    }
    
    else if(i < startIndex || i > endIndex) {
      translateX = 0;
      translateY = 0;
    }

    else if(i < currentIndex) {
      translateX = this._siblings[i+1].bounds.left - this._siblings[i].bounds.left;
      translateY = this._siblings[i+1].bounds.top - this._siblings[i].bounds.top;
    }

    else if(i > currentIndex) {
      translateX = this._siblings[i-1].bounds.left - this._siblings[i].bounds.left;
      translateY = this._siblings[i-1].bounds.top - this._siblings[i].bounds.top;
    }

    this._siblings[i].node.style.setProperty('transform', `translate(${translateX}px, ${translateY}px)`);

  }

  _getNewIndex(mouseX, mouseY) {
    let newIndex = -1;
    this._siblings.map((sibling, i) => {
      if( mouseX >= sibling.bounds.left && mouseX <= sibling.bounds.right && mouseY >= sibling.bounds.top && mouseY <= sibling.bounds.bottom) newIndex = i;
    });
    return newIndex;
  }

  _setItemOrder() {
    this.style.setProperty('--__item--transition-duration', 0);

    this.sortedChildren.forEach((item, i) => {
      item.style.setProperty('--__item--translateX', '');
      item.style.setProperty('--__item--translateY', '');
      item.style.setProperty('--__item--order', i);
    });

    window.setTimeout(() => this.style.setProperty('--__item--transition-duration', ''), 100);
    this.dispatchEvent(new CustomEvent('sort', {bubbles: true, composed: true}));
  }

}

window.customElements.define('sortable-element', SortableElement);