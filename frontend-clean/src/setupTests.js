// src/setupTests.js
import '@testing-library/jest-dom';
import 'regenerator-runtime/runtime';

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
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// מוק עבור Google Maps API
jest.mock('@react-google-maps/api', () => ({
  useLoadScript: jest.fn(() => ({ isLoaded: true, loadError: null })),
  GoogleMap: ({ children }) => <div data-testid="google-map">{children}</div>,
  Marker: ({ label }) => <div data-testid="map-marker">{label}</div>,
  Circle: () => <div data-testid="map-circle">Circle</div>,
  InfoWindow: ({ children }) => <div data-testid="info-window">{children}</div>,
}));

// מוק לגיאולוקציה
Object.defineProperty(global.navigator, 'geolocation', {
  value: {
    getCurrentPosition: jest.fn(successCallback => {
      successCallback({
        coords: {
          latitude: 31.252973,
          longitude: 34.791462
        }
      });
    })
  },
  configurable: true
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