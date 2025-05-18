
// src/__tests__/Login.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../pages/Login';
import axios from 'axios';

jest.mock('axios');

describe('🔐 Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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