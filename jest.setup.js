
// Mock performance API if not available
if (!global.performance) {
  global.performance = {
    now: () => Date.now()
  };
}

const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

afterEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

expect.extend({
  toHaveClass(received, className) {
    const pass = received.classList.contains(className);
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to have class "${className}"`,
      pass,
    };
  }
});