methodsToMonitor = [
    'appendChild', 'assign', 'cloneNode', 'createElement', 'createTextNode',
    'insertBefore', 'replaceChild',
    'replaceWith', 'setAttribute', 'adoptNode', 'importNode', 'append',
    'insertAdjacentElement', 'insertAdjacentHTML','innerHTML','outerHTML'
];

// Function to wrap a prototype method with logging
function wrapMethod(proto, methodName) {
    const originalMethod = proto[methodName]
    proto[methodName] = function (...args) {
				let mres = originalMethod.apply(this, args);
        console.log(`Called ${methodName} with arguments:`, args,"on",this,"res:",mres);
        return mres;
    };
}

// Function to wrap properties (like innerHTML, outerHTML) with a getter/setter
function wrapProperty(proto, propertyName) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, propertyName);

    if (descriptor && (descriptor.get || descriptor.set)) {
        Object.defineProperty(proto, propertyName, {
            get() {
                return descriptor.get && descriptor.get.call(this);
            },
            set(value) {
                console.log(`Setting ${propertyName} to:`, value,"on",this);
                if (descriptor.set) {
                    descriptor.set.call(this, value);
                }
            }
        });
    }
}

// Detect the appropriate prototype for each method or property and wrap it
function monitorDOMMutations() {
    methodsToMonitor.forEach((name) => {
        if (name === 'innerHTML' || name === 'outerHTML') {
                wrapProperty(Element.prototype, name);
            }
        else if (name in HTMLElement.prototype) {
            wrapMethod(HTMLElement.prototype, name);
        } else if (name in Document.prototype) {
            wrapMethod(Document.prototype, name);
        } else if (name in Node.prototype) {
            wrapMethod(Node.prototype, name);
        }
    });
}

// Run the monitor setup
monitorDOMMutations();
