class FeactDOMComponent {
  constructor(element) {
    console.log("FeactDOMComponent::element", element);
    this._currentElement = element;
  }

  mountComponent(container) {
    console.log("FeactDOMComponent::mountComponent: ", this._currentElement);
    const { type, props } = this._currentElement;
    const { children } = props;

    const domElement = document.createElement(type);

    let nextNode = undefined;
    if (typeof children === "object") {
      nextNode = Feact.render(children, container);
    } else {
      nextNode = document.createTextNode(children);
    }
    domElement.appendChild(nextNode);

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
    console.log(
      "FeactCompositeComponentWrapper::mountComponent",
      this._currentElement
    );
    const Component = this._currentElement.type;
    const componentInstance = new Component(this._currentElement.props);
    let element = componentInstance.render();

    // Keep rendering the returned elements until the next
    // element is a primitive html type, e.g. 'div'.
    while (typeof element.type === "function") {
      element = new element.type(element.props).render();
      console.log("next element", element);
    }

    const domComponentInstance = new FeactDOMComponent(element);
    return domComponentInstance.mountComponent(container);
  }
}

// We use this by default in Feact.createElement. It is essentially
// a very simple Composite Component. It only returns
const TopLevelWrapper = function(props) {
  this.props = props;
};
TopLevelWrapper.prototype.render = function() {
  return this.props;
};

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
    const wrapperElement = Feact.createElement(TopLevelWrapper, element);
    console.log({ wrapperElement });
    const componentInstance = new FeactCompositeComponentWrapper(
      wrapperElement
    );
    return componentInstance.mountComponent(container);
  }
};

const MyTitle = Feact.createClass({
  render() {
    return Feact.createElement(
      "div",
      {},
      Feact.createElement("h1", {}, this.props.message)
    );
  }
});

const MyMessage = Feact.createClass({
  render() {
    if (this.props.asTitle) {
      return Feact.createElement(MyTitle, {
        message: this.props.message
      });
    } else {
      return Feact.createElement("p", null, this.props.message);
    }
  }
});

Feact.render(
  Feact.createElement(MyMessage, { asTitle: true, message: "Yo!" }),
  document.getElementById("app")
);
