export class Sortable {

  constructor(element) {
    this.__element = element;
    this.__element.dragstartHandler = this.__handleDragstart.bind(this);
    this.__element.dragoverHandler = this.__handleDragover.bind(this);
    this.__element.dragendHandler = this.__initItems.bind(this);
    this.__element.addEventListener('dragstart', this.__element.dragstartHandler);
    this.__element.addEventListener('dragover', this.__element.dragoverHandler);
    this.__element.addEventListener('dragend', this.__element.dragendHandler);
    this.__initItems();
    this.__observeChanges();
  }

  destroy() {
    this.__resetItems();
    this.__observer.disconnect();
    this.__element.removeEventListener('dragstart', this.__element.dragstartHandler);
    this.__element.removeEventListener('dragover', this.__element.dragoverHandler);
    this.__element.removeEventListener('dragend', this.__element.dragendHandler);
    this.__element = null;
  }

  get __sortedChildren() {
    return [...this.__element.children].sort((a, b) => {
      const aBounds = a.getBoundingClientRect();
      const bBounds = b.getBoundingClientRect();
      if(aBounds.top < bBounds.top) return -1;
      if(aBounds.top > bBounds.top) return 1;
      if(aBounds.left < bBounds.left) return -1;
      if(aBounds.left > bBounds.left) return 1;
      return 0;
    });
  }

  __observeChanges() {
    const targetNode = this.__element;
    const config = {childList: true };
    this.__observer = new MutationObserver(this.__processMutations.bind(this));
    this.__observer.observe(targetNode, config);
  }

  __processMutations(mutationsList) {
    mutationsList.forEach(this.__processMutation.bind(this));
    this.__initItems();
  }

  __processMutation(record) {
    record.addedNodes.forEach(item => {
      item.draggable = true;
      item.style.setProperty('order', [...this.__element.children].indexOf(item));  
    });
  }

  __handleDragstart(e) {
    this._startX = e.clientX;
    this._startY = e.clientY;
    this.__draggingItem = {node: e.target, bounds: e.target.getBoundingClientRect()};
    this.__draggingItemIndex = [...this.__sortedChildren].indexOf(e.target);
    this._siblings = [...this.__sortedChildren].map(node => { return {node: node, bounds: node.getBoundingClientRect()};});
  }

  __handleDragover(e) {
    e.preventDefault();

    const currentIndex = this.__draggingItemIndex;
    const newIndex = this.__getNewIndex(e.clientX, e.clientY);

    if(this._newIndex !== newIndex) this.__shuffleItems(currentIndex, newIndex);
    this._newIndex = newIndex;
  }

  __shuffleItems(currentIndex, newIndex) {
    if(newIndex === -1) return;
    const startIndex = Math.min(currentIndex, newIndex);
    const endIndex = Math.max(currentIndex, newIndex);
    for(let i=0;i<this._siblings.length;i++) this.__shuffleItem(i, currentIndex, newIndex, startIndex, endIndex);
  }

  __shuffleItem(i, currentIndex, newIndex, startIndex, endIndex) {

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

  __getNewIndex(mouseX, mouseY) {
    let newIndex = -1;
    this._siblings.map((sibling, i) => {
      if( mouseX >= sibling.bounds.left && mouseX <= sibling.bounds.right && mouseY >= sibling.bounds.top && mouseY <= sibling.bounds.bottom) newIndex = i;
    });
    return newIndex;
  }

  __initItems() {

    [...this.__element.children].forEach(item => item.draggable = true);

    this.__sortedChildren.forEach((item, i) => {
      item.style.setProperty('transition', 'none');
      item.style.setProperty('transform', '');
      item.style.setProperty('order', i);
    });

    window.setTimeout(() => {
      this.__sortedChildren.forEach((item) => item.style.setProperty('transition', '200ms transform ease'));
    });
      
    this.__element.dispatchEvent(new CustomEvent('sort', {detail: {children: this.__sortedChildren}}));
  }

  __resetItems() {
    [...this.__element.children].forEach(item => {
      item.style.setProperty('transition', '');
      item.draggable = false;
    });
  }

}