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
