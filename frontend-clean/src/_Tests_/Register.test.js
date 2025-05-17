// src/__tests__/Register.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from '../pages/Register';
import axios from 'axios';

jest.mock('axios');

describe('📝 Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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