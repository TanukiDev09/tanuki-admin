import '@testing-library/jest-dom';

declare global {
  namespace jest {
    type Matchers<R = void> = TestingLibraryMatchers<
      typeof expect.stringContaining,
      R
    >;
  }
}
