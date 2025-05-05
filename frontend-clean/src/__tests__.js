// src/__tests__/allTests.test.js

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';

// רכיבים לבדיקה
import ForgotPassword from '../pages/ForgotPassword';

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
});