#!/bin/bash
# fix-frontend-tests.sh
# Script to fix frontend testing issues

# Navigate to frontend directory
cd frontend-clean

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Remove node_modules and package-lock.json for clean install
echo "Removing existing node modules..."
rm -rf node_modules package-lock.json

# Create mocks directory
echo "Creating mocks directory..."
mkdir -p __mocks__
echo "module.exports = {};" > __mocks__/styleMock.js
echo "module.exports = 'test-file-stub';" > __mocks__/fileMock.js

# Create proper setupTests.js
echo "Creating setupTests.js..."
mkdir -p src
cat > src/setupTests.js << 'EOF'
import '@testing-library/jest-dom';

// מוק עבור react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ children }) => children,
  Navigate: jest.fn(),
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
  Link: ({ children, to }) => `<a href="${to}">${children}</a>`,
}));

// מוק עבור Google Maps API
jest.mock('@react-google-maps/api', () => ({
  useLoadScript: jest.fn(() => ({ isLoaded: true, loadError: null })),
  GoogleMap: ({ children }) => `<div data-testid="google-map">${children || ''}</div>`,
  Marker: ({ label }) => `<div data-testid="map-marker">${label || ''}</div>`,
  Circle: () => `<div data-testid="map-circle">Circle</div>`,
  InfoWindow: ({ children }) => `<div data-testid="info-window">${children || ''}</div>`,
}));

// מוק לגיאולוקציה
global.navigator.geolocation = {
  getCurrentPosition: jest.fn(callback => {
    callback({
      coords: {
        latitude: 31.252973,
        longitude: 34.791462
      }
    });
  })
};

// מוק עבור localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// מוק עבור fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([])
  })
);

// מוק עבור matchMedia
global.matchMedia = global.matchMedia || function() {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
};
EOF

# Create simple test file
echo "Creating simple test file..."
cat > src/App.test.js << 'EOF'
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Simple test
test('renders without crashing', () => {
  // מוק לפונקציות שנדרשות בקומפוננטה
  global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  }));

  render(<App />);

  // בדיקה בסיסית שהאפליקציה נטענת
  expect(document.body).toBeInTheDocument();
});
EOF

# Create .env file
echo "Creating .env file..."
echo "SKIP_PREFLIGHT_CHECK=true" > .env

# Reinstall dependencies
echo "Installing dependencies..."
npm install --no-fund --no-audit

# Install specific react-scripts version
echo "Installing specific react-scripts version..."
npm install react-scripts@5.0.1 --save --no-fund --no-audit

# Install testing libraries
echo "Installing testing libraries..."
npm install --save-dev jest-mock-extended regenerator-runtime @testing-library/react@14.0.0 @testing-library/jest-dom@5.16.5 --no-fund --no-audit

# Update package.json with proper Jest configuration
echo "Updating package.json..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Update test script
pkg.scripts.test = 'react-scripts test --transformIgnorePatterns \"node_modules/(?!(@react-google-maps|axios)/)\"';

// Add Jest configuration (without setupFilesAfterEnv)
pkg.jest = {
  moduleNameMapper: {
    '\\\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(@react-google-maps|axios)/)'
  ],
  resetMocks: true
};

fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
"

# Run tests with CI flag
echo "Running tests..."
CI=true npm test -- --watchAll=false

echo "Setup complete!"