// src/__tests__/allTests.test.js

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import axios from 'axios';

// רכיבים לבדיקה
import App from '../App';
import ForgotPassword from '../pages/ForgotPassword';
import Login from '../pages/Login';
import Register from '../pages/Register';
import MapComponent from '../components/MapComponent';

// מוקים גלובליים
jest.mock('axios'); // נוודא שכל הבקשות לשרת מדומות

// מדמה את useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

// מדמה את Google Maps API
jest.mock('@react-google-maps/api', () => ({
  useLoadScript: jest.fn(() => ({ isLoaded: true })),
  GoogleMap: ({ children, onLoad }) => {
    if (onLoad) onLoad({ panTo: jest.fn() });
    return <div data-testid="google-map">{children}</div>;
  },
  Marker: () => <div data-testid="map-marker" />,
  Circle: () => <div data-testid="map-circle" />
}));

// מדמה את localStorage
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

// מדמה את מיקום GPS
const mockGeolocation = {
  getCurrentPosition: jest.fn().mockImplementation(success =>
    success({
      coords: {
        latitude: 32.1,
        longitude: 34.8
      }
    })
  )
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
});

// מדמה את fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([
      {
        name: 'מסעדת בדיקה',
        lat: 32.1,
        lng: 34.8,
        rating: 4.5,
        distance_in_meters: 500,
        visited: false,
        load_level: 'medium'
      }
    ])
  })
);

// מדמה את window.alert
global.alert = jest.fn();

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

describe('🗺️ MapComponent Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  test('מציג טקסט טעינה כשהמפה לא נטענה', () => {
    // שינוי זמני של מוק המפה לimplementation שמחזיר isLoaded: false
    jest.spyOn(require('@react-google-maps/api'), 'useLoadScript').mockReturnValue({ isLoaded: false });

    render(
      <BrowserRouter>
        <MapComponent />
      </BrowserRouter>
    );
    expect(screen.getByText(/טוען מפה/i)).toBeInTheDocument();
  });

  test('מציג קלט ידני אם כשל ב-GPS', () => {
    // מוק כישלון geolocation
    jest.spyOn(global.navigator.geolocation, 'getCurrentPosition')
      .mockImplementationOnce((_, errorCallback) => errorCallback());

    render(
      <BrowserRouter>
        <MapComponent />
      </BrowserRouter>
    );
    expect(screen.getByText(/הזן מיקום ידני/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/הכנס כתובת/i)).toBeInTheDocument();
  });

  test('מציג כפתורי התחברות למשתמש לא מחובר', async () => {
    render(
      <BrowserRouter>
        <MapComponent />
      </BrowserRouter>
    );

    await waitFor(() => {
      // בודק שמוצגים כפתורי התחברות והרשמה
      const loginButton = screen.getByText(/התחברות/i);
      const registerButton = screen.getByText(/הרשמה/i);

      expect(loginButton).toBeInTheDocument();
      expect(registerButton).toBeInTheDocument();

      // בודק שלא מוצג כפתור התנתקות
      const logoutButton = screen.queryByText(/התנתק/i);
      expect(logoutButton).not.toBeInTheDocument();
    });
  });

  test('מציג כפתור התנתקות למשתמש מחובר', async () => {
    // מדמה משתמש מחובר
    window.localStorage.setItem('userEmail', 'test@example.com');

    render(
      <BrowserRouter>
        <MapComponent />
      </BrowserRouter>
    );

    await waitFor(() => {
      // בודק שמוצג כפתור התנתקות
      const logoutButton = screen.getByText(/התנתק/i);
      expect(logoutButton).toBeInTheDocument();

      // בודק שלא מוצגים כפתורי התחברות והרשמה
      const loginButton = screen.queryByText(/התחברות/i);
      const registerButton = screen.queryByText(/הרשמה/i);

      expect(loginButton).not.toBeInTheDocument();
      expect(registerButton).not.toBeInTheDocument();
    });
  });

  test('מציג הודעת התחברות כשמשתמש לא רשום מנסה לבקר במסעדה', async () => {
    // מדמה משתמש לא מחובר
    window.localStorage.removeItem('userEmail');

    render(
      <BrowserRouter>
        <MapComponent />
      </BrowserRouter>
    );

    await waitFor(() => {
      // מצא את כפתור "ביקרתי כאן" ולחץ עליו
      const visitButton = screen.getByText(/ביקרתי כאן/i);
      fireEvent.click(visitButton);

      // בדוק שמוצגת הודעת התחברות
      const loginMessage = screen.getByText(/פעולה זו דורשת התחברות למערכת/i);
      expect(loginMessage).toBeInTheDocument();
    });
  });

  test('מאפשר שמירת מסעדה רק למשתמש מחובר', async () => {
    // מדמה משתמש מחובר
    window.localStorage.setItem('userEmail', 'test@example.com');

    // מדמה תשובות מוצלחות מהשרת
    global.fetch
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [{ formatted_address: 'כתובת לדוגמה' }] })
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'נשמר' })
      }));

    render(
      <BrowserRouter>
        <MapComponent />
      </BrowserRouter>
    );

    await waitFor(() => {
      // אתר את כפתור "שמור כתובת" ולחץ עליו
      const saveButton = screen.getByText(/שמור כתובת/i);
      fireEvent.click(saveButton);

      // בדוק שנקראה פונקציית fetch
      expect(global.fetch).toHaveBeenCalled();

      // בדוק שנקראה פונקציית alert עם ההודעה המתאימה
      expect(global.alert).toHaveBeenCalledWith('נשמר');
    });
  });

  test('סינון "רק שביקרתי" דורש התחברות', async () => {
    // מדמה משתמש לא מחובר
    window.localStorage.removeItem('userEmail');

    render(
      <BrowserRouter>
        <MapComponent />
      </BrowserRouter>
    );

    await waitFor(() => {
      // אתר את תיבת הסימון "רק שביקרתי"
      const onlyVisitedCheckbox = screen.getByLabelText(/רק שביקרתי/i);

      // לחץ על התיבה
      fireEvent.click(onlyVisitedCheckbox);

      // וודא שמוצגת הודעת התחברות
      const loginMessage = screen.getByText(/פעולה זו דורשת התחברות למערכת/i);
      expect(loginMessage).toBeInTheDocument();
    });
  });
});

describe('🔐 Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  test('מציג שדות אימייל וסיסמה וכפתור התחברות', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    expect(screen.getByPlaceholderText(/אימייל/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/סיסמה/i)).toBeInTheDocument();
    expect(screen.getByText(/התחבר/i)).toBeInTheDocument();
  });

  test('מציג הודעת הצלחה בהתחברות תקינה', async () => {
    axios.post.mockResolvedValue({ data: { message: 'ברוך הבא!' } });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/אימייל/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/סיסמה/i), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByText(/התחבר/i));

    await waitFor(() => {
      expect(screen.getByText(/ברוך הבא!/i)).toBeInTheDocument();
      // בדיקה שנשמר בלוקל סטורג'
      expect(window.localStorage.setItem).toHaveBeenCalledWith('userEmail', 'test@example.com');
      // בדיקה שיש ניווט לדף המסעדות
      expect(mockNavigate).toHaveBeenCalledWith('/restaurants');
    });
  });

  test('מציג הודעת שגיאה כשיש כשל בהתחברות', async () => {
    axios.post.mockRejectedValue({ response: { data: { error: 'אימייל או סיסמה שגויים' } } });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/אימייל/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/סיסמה/i), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByText(/התחבר/i));

    await waitFor(() => {
      expect(screen.getByText(/אימייל או סיסמה שגויים/i)).toBeInTheDocument();
      // בדיקה שלא היה ניווט
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  test('כפתור "המשך ללא התחברות" מנווט לדף המסעדות', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // לחיצה על כפתור "המשך ללא התחברות"
    fireEvent.click(screen.getByText(/המשך ללא התחברות/i));

    // בדיקה שיש ניווט לדף המסעדות
    expect(mockNavigate).toHaveBeenCalledWith('/restaurants');
  });
});

describe('📝 Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
  });

  test('מציג את שדות ההרשמה ואת כפתור השליחה', () => {
    expect(screen.getByPlaceholderText(/אימייל/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/שם פרטי/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/שם משפחה/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/סיסמה/i)).toBeInTheDocument();
    expect(screen.getByText(/הרשמה/i)).toBeInTheDocument();
  });

  test('מראה הודעת הצלחה בהרשמה תקינה', async () => {
    axios.post.mockResolvedValue({ data: {} });

    fireEvent.change(screen.getByPlaceholderText(/אימייל/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/שם פרטי/i), { target: { value: 'דוד' } });
    fireEvent.change(screen.getByPlaceholderText(/שם משפחה/i), { target: { value: 'כהן' } });
    fireEvent.change(screen.getByPlaceholderText(/סיסמה/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByText(/הרשמה/i));

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
    fireEvent.click(screen.getByText(/הרשמה/i));

    await waitFor(() =>
      expect(screen.getByText(/אירעה שגיאה בהרשמה/i)).toBeInTheDocument()
    );
  });

  test('בודק שאפשר לנווט לדף התחברות מדף ההרשמה', () => {
    // בדיקה שיש קישור לדף ההתחברות
    const loginLink = screen.getByText(/התחבר כאן/i);
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.getAttribute('href')).toBe('/login');
  });
});

describe('🧭 App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('מנווט לדף MapComponent כברירת מחדל', () => {
    // מדמה את הקומפוננטות
    jest.mock('../components/MapComponent', () => () => <div data-testid="map-component">Map Component</div>);

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    // בדיקה שדף המפה מוצג כברירת מחדל
    expect(screen.getByTestId('map-component')).toBeInTheDocument();
  });

  test('מנווט לדף התחברות בניתוב /login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    // בדיקה שדף ההתחברות מוצג
    expect(screen.getByText(/התחברות/i)).toBeInTheDocument();
  });

  test('מנווט לדף הרשמה בניתוב /register', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <App />
      </MemoryRouter>
    );

    // בדיקה שדף ההרשמה מוצג
    expect(screen.getByText(/הרשמה/i)).toBeInTheDocument();
  });
});

describe('🌍 אינטגרציה של מיקום ומפה', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  test('המפה טוענת ומציגה מיקום נוכחי', async () => {
    // מדמה מיקום GPS מוצלח
    jest.spyOn(global.navigator.geolocation, 'getCurrentPosition')
      .mockImplementationOnce(success =>
        success({
          coords: {
            latitude: 32.1,
            longitude: 34.8
          }
        })
      );

    render(
      <BrowserRouter>
        <MapComponent />
      </BrowserRouter>
    );

    await waitFor(() => {
      // בדיקה שהמפה נטענה
      expect(screen.getByTestId('google-map')).toBeInTheDocument();

      // בדיקה שנקראה פונקציית getCurrentPosition
      expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalled();

      // בדיקה שמוצג מרקר
      expect(screen.getByTestId('map-marker')).toBeInTheDocument();
    });
  });

  test('מציג והחלף סינון לפי רמת עומס', async () => {
    // מדמה תשובות מהשרת לשתי בקשות fetch
    global.fetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        {
          name: 'מסעדת הצפון',
          lat: 32.1,
          lng: 34.8,
          rating: 4.5,
          distance_in_meters: 500,
          visited: false,
          load_level: 'medium'
        }
      ])
    })).mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        {
          name: 'מסעדת הדרום',
          lat: 32.2,
          lng: 34.9,
          rating: 4.8,
          distance_in_meters: 1000,
          visited: false,
          load_level: 'low'
        }
      ])
    }));

    render(
      <BrowserRouter>
        <MapComponent />
      </BrowserRouter>
    );

    await waitFor(() => {
      // בדיקה שיש רשימת בחירה לסינון לפי רמת עומס
      const loadLevelSelect = screen.getByLabelText(/רמת עומס/i);

      // שינוי הבחירה
      fireEvent.change(loadLevelSelect, { target: { value: 'low' } });

      // בדיקה שנקראה פונקציית fetch פעמיים
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});