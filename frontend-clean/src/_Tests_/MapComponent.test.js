// src/__tests__/MapComponent.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MapComponent, { markAsVisited, fetchPopularData } from '../components/MapComponent';
import axios from 'axios';

jest.mock('axios');

describe('🗺️ MapComponent', () => {
  beforeEach(() => {
    // נאפס את המוקים לפני כל בדיקה
    jest.clearAllMocks();
  });

  test('מציג טקסט טעינה כשהמפה לא נטענה', () => {
    // override המוק החיובי מ-setupTests.js
    const useLoadScriptMock = require('@react-google-maps/api').useLoadScript;
    useLoadScriptMock.mockReturnValueOnce({ isLoaded: false });

    render(<MapComponent />);
    expect(screen.getByText(/טוען מפה/i)).toBeInTheDocument();
  });

  test('מציג קלט ידני אם כשל ב-GPS', () => {
    // override המוק החיובי מ-setupTests.js
    const origGeolocation = global.navigator.geolocation;

    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: (success, error) => {
          error(new Error('User denied geolocation'));
        }
      },
      configurable: true
    });

    render(<MapComponent />);

    expect(screen.getByText(/הזן מיקום ידני/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/הכנס כתובת/i)).toBeInTheDocument();

    // החזרת המוק המקורי
    Object.defineProperty(global.navigator, 'geolocation', {
      value: origGeolocation,
      configurable: true
    });
  });

  test('סינון מסעדות לפי עומס – מציג רק את מה שמתאים', async () => {
    const mockPlaces = [
      { name: 'Pizza A', lat: 0, lng: 0, rating: 4.2, distance_in_meters: 100, load_level: 'low' },
      { name: 'Pizza B', lat: 0, lng: 0, rating: 4.2, distance_in_meters: 200, load_level: 'high' },
      { name: 'Pizza C', lat: 0, lng: 0, rating: 4.2, distance_in_meters: 300, load_level: 'medium' }
    ];

    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPlaces)
      })
    );

    render(<MapComponent />);

    // בוחר "נמוך" בתפריט הסינון
    const loadSelect = await screen.findByLabelText(/רמת עומס/i);
    fireEvent.change(loadSelect, { target: { value: 'low' } });

    // מחכה שהמקומות יסוננו
    await waitFor(() => {
      expect(screen.getByText('Pizza A')).toBeInTheDocument();
      expect(screen.queryByText('Pizza B')).not.toBeInTheDocument();
      expect(screen.queryByText('Pizza C')).not.toBeInTheDocument();
    });
  });

  test('שולח בקשת ביקור לשרת', async () => {
    axios.post.mockResolvedValue({ data: { message: 'Visit saved!' } });

    await markAsVisited({
      name: 'Test Restaurant',
      lat: 32.1,
      lng: 34.8,
      rating: 4.7
    });

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/visit/'),
      expect.objectContaining({
        restaurant_name: 'Test Restaurant',
      }),
      expect.anything()
    );
  });
});

describe('📡 fetchPopularData', () => {
  beforeEach(() => {
    global.fetch = jest.fn(); // נבטיח שכל fetch יהיה מדומה
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('מחזיר נתונים אמיתיים עם is_fake=false כשהשרת מחזיר תשובה תקינה', async () => {
    const mockApiResponse = {
      popular_times: [
        {
          day: 1,
          day_text: "Monday",
          popular_times: [
            { hour: 10, percentage: 30 },
            { hour: 14, percentage: 60 }
          ]
        }
      ]
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    const callback = jest.fn();
    await fetchPopularData('Some Restaurant', callback);

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      popular_times: mockApiResponse.popular_times,
      is_fake: false
    }));
  });

  test('מחזיר is_fake=true כשיש שגיאה מהשרת', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const callback = jest.fn();
    await fetchPopularData('Some Restaurant', callback);

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      is_fake: true,
      popular_times: expect.any(Array)
    }));
  });
});