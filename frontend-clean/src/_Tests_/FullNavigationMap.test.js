import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import FullNavigationMap from './FullNavigationMap';

jest.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children }) => <div data-testid="mock-map">{children}</div>,
  Marker: () => <div data-testid="mock-marker" />,
  DirectionsRenderer: () => <div data-testid="mock-directions" />,
  useLoadScript: () => ({ isLoaded: true }),
}));

describe('FullNavigationMap Component', () => {
  const defaultProps = {
    origin: { lat: 32.0853, lng: 34.7818 },
    destination: { lat: 32.0809, lng: 34.7806 },
    restaurantName: 'טוסט בורגרים',
    onClose: jest.fn(),
  };

  it('renders loading state if directions are loading', async () => {
    render(<FullNavigationMap {...defaultProps} />);
    expect(screen.getByText(/טוען הוראות נסיעה/i)).toBeInTheDocument();
  });

  it('renders map and directions once loaded', async () => {
    render(<FullNavigationMap {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('mock-map')).toBeInTheDocument();
      expect(screen.getByTestId('mock-marker')).toBeInTheDocument();
    });
  });

  it('renders restaurant name in header', () => {
    render(<FullNavigationMap {...defaultProps} />);
    expect(screen.getByText(/טוסט בורגרים/i)).toBeInTheDocument();
  });
});
