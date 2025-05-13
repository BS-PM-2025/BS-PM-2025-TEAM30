// src/__tests__/allTests.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MapComponent from '../components/MapComponent';

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';

import ForgotPassword from '../src/pages/ForgotPassword';
import MapComponent from "./components/MapComponent";
import Register from "./pages/Register";
import Login from "./pages/Login";
import { markAsVisited } from '../src/components/MapComponent';
import {removeVisit} from '../src/components/MapComponent';
import * as test from "node:test";


jest.mock('axios'); // נוודא שכל הבקשות לשרת מדומות

describe('🔐 ForgotPassword Component', () => {
  test('מציג שדה אימייל וכפתור שליחה', () => {
    render(<ForgotPassword />);
    expect(screen.getByPlaceholderText(/הכנס אימייל/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /שלח קישור/i })).toBeInTheDocument();
  });

  test('מציג הודעת הצלחה לאחר שליחה תקינה', async () => {
    axios.post.mockResolvedValue({});

    render(<ForgotPassword />);
    const input = screen.getByPlaceholderText(/הכנס אימייל/i);
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /שלח קישור/i }));

    await waitFor(() => {
      expect(screen.getByText(/✔ קישור לשחזור נשלח/i)).toBeInTheDocument();
    });
  });

  test('מציג הודעת שגיאה אם השליחה נכשלת', async () => {
    axios.post.mockRejectedValue(new Error('Network error'));

    render(<ForgotPassword />);
    fireEvent.change(screen.getByPlaceholderText(/הכנס אימייל/i), {
      target: { value: 'fail@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /שלח קישור/i }));

    await waitFor(() => {
      expect(screen.getByText(/✖ שגיאה בשליחה/i)).toBeInTheDocument();
    });
  });
});
describe('🗺️ MapComponent', () => {
  test('מציג טקסט טעינה כשהמפה לא נטענה', () => {
    jest.mock('@react-google-maps/api', () => ({
      ...jest.requireActual('@react-google-maps/api'),
      useLoadScript: () => ({ isLoaded: false }),
    }));

    const { container } = render(<MapComponent />);
    expect(container).toHaveTextContent('טוען מפה');
  });

  test('מציג קלט ידני אם כשל ב-GPS', () => {
    // mock geolocation failure
    global.navigator.geolocation = {
      getCurrentPosition: (_, errorCallback) => errorCallback(),
    };

    render(<MapComponent />);
    expect(screen.getByText(/הזן מיקום ידני/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/הכנס כתובת/i)).toBeInTheDocument();
  });
});
describe('🔐 Login Component', () => {
  test('מציג שדות אימייל וסיסמה וכפתור התחברות', () => {
    render(<Login />);
    expect(screen.getByPlaceholderText(/אימייל/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/סיסמה/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /התחבר/i })).toBeInTheDocument();
  });

  test('מציג הודעת הצלחה בהתחברות תקינה', async () => {
    axios.post.mockResolvedValue({ data: { message: 'ברוך הבא!' } });
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText(/אימייל/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/סיסמה/i), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /התחבר/i }));

    await waitFor(() =>
      expect(screen.getByText(/ברוך הבא!/i)).toBeInTheDocument()
    );
  });

  test('מציג הודעת שגיאה כשיש כשל בהתחברות', async () => {
    axios.post.mockRejectedValue({ response: { data: { error: 'אימייל או סיסמה שגויים' } } });

    render(<Login />);
    fireEvent.change(screen.getByPlaceholderText(/אימייל/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/סיסמה/i), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /התחבר/i }));

    await waitFor(() =>
      expect(screen.getByText(/אימייל או סיסמה שגויים/i)).toBeInTheDocument()
    );
  });
});
describe('📝 Register Component', () => {
  beforeEach(() => {
    render(<Register />);
  });

  test('מציג את שדות ההרשמה ואת כפתור השליחה', () => {
    expect(screen.getByPlaceholderText(/אימייל/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/שם פרטי/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/שם משפחה/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/סיסמה/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /הרשמה/i })).toBeInTheDocument();
  });

  test('מראה הודעת הצלחה בהרשמה תקינה', async () => {
    axios.post.mockResolvedValue({ data: {} });

    fireEvent.change(screen.getByPlaceholderText(/אימייל/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/שם פרטי/i), { target: { value: 'דוד' } });
    fireEvent.change(screen.getByPlaceholderText(/שם משפחה/i), { target: { value: 'כהן' } });
    fireEvent.change(screen.getByPlaceholderText(/סיסמה/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /הרשמה/i }));

    await waitFor(() => {
      expect(screen.getByText(/נרשמת בהצלחה!/i)).toBeInTheDocument();
    });
  });

  test('מראה שגיאה אם ההרשמה נכשלה', async () => {
    axios.post.mockRejectedValue({ response: { data: { error: 'שגיאה כלשהי' } } });

    fireEvent.change(screen.getByPlaceholderText(/אימייל/i), { target: { value: 'bad@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/שם פרטי/i), { target: { value: 'רע' } });
    fireEvent.change(screen.getByPlaceholderText(/שם משפחה/i), { target: { value: 'מישהו' } });
    fireEvent.change(screen.getByPlaceholderText(/סיסמה/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /הרשמה/i }));

    await waitFor(() =>
      expect(screen.getByText(/אירעה שגיאה בהרשמה/i)).toBeInTheDocument()
    );
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
      'http://localhost:8000/api/visit/',
      expect.objectContaining({
        email: expect.any(String),
        restaurant_name: 'Test Restaurant',
      }),
      expect.anything()
    );
  });

});
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MapComponent from '../components/MapComponent';

// מדמה את טעינת המפה
jest.mock('@react-google-maps/api', () => ({
  ...jest.requireActual('@react-google-maps/api'),
  useLoadScript: () => ({ isLoaded: true }),
  GoogleMap: ({ children }) => <div>{children}</div>,
  Marker: ({ label }) => <div>{label}</div>,
  Circle: () => <div>Circle</div>
}));

describe('🗺️ MapComponent – סינון לפי רמת עומס', () => {
  beforeEach(() => {
    // מדמה מיקום GPS קיים
    global.navigator.geolocation = {
      getCurrentPosition: (successCallback) =>
        successCallback({ coords: { latitude: 31.252973, longitude: 34.791462 } })
    };
  });

  test('סינון מסעדות לפי עומס – מציג רק את מה שמתאים', async () => {
    const mockPlaces = [
      { name: 'Pizza A', lat: 0, lng: 0, rating: 4.2, distance_in_meters: 100, load_level: 'low' },
      { name: 'Pizza B', lat: 0, lng: 0, rating: 4.2, distance_in_meters: 200, load_level: 'high' },
      { name: 'Pizza C', lat: 0, lng: 0, rating: 4.2, distance_in_meters: 300, load_level: 'medium' }
    ];

    // מדמה fetch מוצלח
    global.fetch = jest.fn(() =>
      Promise.resolve({
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
});
