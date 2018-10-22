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
    this._currentElement = element;
  }

  _updateDomProperties(lastProps, nextProps) {
    // Need to figure this out.... it is used to update CSS mostly.
  }

  _updateDomChildren(lastProps, nextProps) {
    console.log("FeactCompostComponentWrapper#_updateDomChildren", {
      lastProps,
      nextProps
    });
    const lastContent = lastProps.children;
    const nextContent = nextProps.children;

    if (!nextContent) {
      this.updateTextContent("");
    } else if (lastContent !== nextContent) {
      this.updateTextContent("" + nextContent);
    }
  }

  updateTextContent(text) {
    const node = this._hostNode;

    const firstChild = node.firstChild;

    if (
      firstChild &&
      firstChild === node.lastChild &&
      firstChild.nodeType === 3
    ) {
      firstChild.nodeValue = text;
      return;
    }

    node.textContent = text;
  }

  updateComponent(prevElement, nextElement) {
    const lastProps = prevElement.props;
    const nextProps = nextElement.props;
    console.log({ lastProps, nextProps });

    this._updateDomProperties(lastProps, nextProps);
    this._updateDomChildren(lastProps, nextProps);

    this._currentElement = nextElement;
  }

  mountComponent(container) {
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
    this._currentElement = element;
  }

  updateComponent(prevElement, nextElement) {
    const nextProps = nextElement.props;
    const inst = this._instance;

    if (inst.componentWillReceiveProps) {
      inst.componentWillReceiveProps(nextProps);
    }

    let shouldUpdate = true;

    if (inst.shouldComponentUpdate) {
      shouldUpdate = inst.shouldComponentUpdate(nextProps);
    }

    if (shouldUpdate) {
      this._performComponentUpdate(nextElement, nextProps);
    } else {
      inst.props = nextProps;
    }
  }

  _performComponentUpdate(nextElement, nextProps) {
    this._currentElement = nextElement;
    const inst = this._instance;

    inst.props = nextProps;

    this._updateRenderedComponent();
  }

  _updateRenderedComponent() {
    const prevComponentInstance = this._renderedComponent;
    const inst = this._instance;
    const nextRenderedElement = inst.render();

    FeactReconciler.receiveComponent(
      prevComponentInstance,
      nextRenderedElement
    );
  }

  mountComponent(container) {
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
  receiveComponent(internalInstance, nextElement) {
    internalInstance.updateComponent(
      internalInstance._currentElement,
      nextElement
    );
  },

  mountComponent(internalInstance, container) {
    return internalInstance.mountComponent(container);
  }
};

const Feact = {
  createClass(spec) {
    function Constructor(props) {
      this.props = props;

      const initialState = this.getInitialState ? this.getInitialState() : null;

      this.state = initialState;
    }

    // Add the whole spec to the prototype.
    Constructor.prototype = Object.assign(Constructor.prototype, spec);

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
    const prevComponent = getTopLevelComponentInContainer(container);

    console.log({ prevComponent });

    if (prevComponent) {
      console.log("component already rendered.");
      return updateRootComponent(prevComponent, element);
    }

    return renderNewRootComponent(element, container);
  }
};

function getTopLevelComponentInContainer(container) {
  return container.__feactComponentInstance;
}

function updateRootComponent(prevComponent, nextElement) {
  FeactReconciler.receiveComponent(prevComponent, nextElement);
}

function renderNewRootComponent(element, container) {
  const wrapperElement = Feact.createElement(TopLevelWrapper, element);
  const componentInstance = new FeactCompositeComponentWrapper(wrapperElement);
  const markup = FeactReconciler.mountComponent(componentInstance, container);

  container.__feactComponentInstance = componentInstance._renderedComponent;

  return markup;
}

//////////////////
//////////////////

const MyTitle = Feact.createClass({
  render() {
    return Feact.createElement("h1", {}, this.props.message);
  }
});

Feact.render(
  Feact.createElement(MyTitle, { message: "Yo!" }),
  document.getElementById("app")
);

setTimeout(function() {
  Feact.render(
    Feact.createElement(MyTitle, { message: "Yo, again!" }),
    document.getElementById("app")
  );
}, 3000);
