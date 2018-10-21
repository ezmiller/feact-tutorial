class FeactDOMComponent {
  constructor(element) {
    this._currentElement = element;
  }

  mountComponent(container) {
    console.log("FeactDOMComponent::mountComponent: ", this._currentElement);
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

class FeactCompositeComponentWrapper {
  constructor(element) {
    console.log("FeactCompositeComponentWrapper::element", element);
    this._currentElement = element;
  }

  mountComponent(container) {
    const Component = this._currentElement.type;
    const componentInstance = new Component(this._currentElement.props);
    const element = componentInstance.render();
    const domComponentInstance = new FeactDOMComponent(element);
    return domComponentInstance.mountComponent(container);
  }
}

const Feact = {
  createClass(spec) {
    function Constructor(props) {
      this.props = props;
    }

    Constructor.prototype.render = spec.render;

    return Constructor;
  },

  createElement(type, props, children) {
    const element = {
      type: type,
      props: props || {}
    };

    if (children) {
      element.props.children = children;
    }

    return element;
  },

  render(element, container) {
    const componentInstance =
      typeof element.type === "function"
        ? new FeactCompositeComponentWrapper(element)
        : new FeactDOMComponent(element);
    return componentInstance.mountComponent(container);
  }
};

const HelloFeact = Feact.createClass({
  constructor(props) {
    this.props = props;
  },

  render() {
    return Feact.createElement("h1", {}, this.props.message);
  }
});

Feact.render(
  Feact.createElement(HelloFeact, { message: "Hello there Feact!" }),
  document.getElementById("app")
);
