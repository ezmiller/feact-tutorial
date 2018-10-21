class FeactDOMComponent {
  constructor(element) {
    this._currentElement = element;
  }

  mountComponent(container) {
    const { type, props, children } = this._currentElement;

    const domElement = document.createElement(type);
    const text = props.children;
    const textNode = document.createTextNode(text);
    domElement.appendChild(textNode);

    container.appendChild(domElement);

    this._hostNode = domElement;
    return domElement;
  }
}

const Feact = {
  createElement(type, props, children) {
    const element = {
      type,
      props: props || {}
    };

    if (children) {
      element.props.children = children;
    }

    return element;
  },

  render(element, container) {
    const componentInstance = new FeactDOMComponent(element);
    return componentInstance.mountComponent(container);
  }
};

Feact.render(
  Feact.createElement("h1", {}, "Hello Feact!"),
  document.getElementById("app")
);
