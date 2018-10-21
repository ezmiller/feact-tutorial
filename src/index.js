// We use this by default in Feact.createElement. It is essentially
// a very simple Composite Component. It only returns
const TopLevelWrapper = function(props) {
  this.props = props;
};
TopLevelWrapper.prototype.render = function() {
  return this.props;
};

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
    console.log("next node is: ", nextNode);
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
    this._instance = componentInstance;

    if (typeof componentInstance.componentWillMount === "function") {
      componentInstance.componentWillMount();
    }

    const markup = this.performInitialMount(container);

    if (typeof componentInstance.componentDidMount === "function") {
      componentInstance.componentDidMount();
    }

    return markup;
  }

  performInitialMount(container) {
    const renderedElement = this._instance.render();
    const child = instantiateFeactComponent(renderedElement);
    this._renderedComponent = child;
    return FeactReconciler.mountComponent(child, container);
  }
}

function instantiateFeactComponent(element) {
  if (typeof element.type === "string") {
    return new FeactDOMComponent(element);
  } else if (typeof element.type === "function") {
    return new FeactCompositeComponentWrapper(element);
  }
}

const FeactReconciler = {
  mountComponent(internalInstance, container) {
    return internalInstance.mountComponent(container);
  }
};

const Feact = {
  createClass(spec) {
    function Constructor(props) {
      this.props = props;
    }

    // Add the whole spec to the prototype.
    Constructor.prototype = Object.assign(Constructor.prototype, spec);

    console.log(Constructor.prototype);

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
    const componentInstance = new FeactCompositeComponentWrapper(
      wrapperElement
    );
    return FeactReconciler.mountComponent(componentInstance, container);
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
