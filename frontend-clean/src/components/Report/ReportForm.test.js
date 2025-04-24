import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportForm from './ReportForm';

// Mock fetch
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ status: 'דוח נשלח בהצלחה' }),
    })
  );
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('ReportForm Component', () => {
  test('renders form fields and button', () => {
    render(<ReportForm />);
    expect(screen.getByPlaceholderText('המייל שלך')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('מה התקלה?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /שלח דיווח/i })).toBeInTheDocument();
  });

  test('can fill and submit the form successfully', async () => {
    render(<ReportForm />);

    fireEvent.change(screen.getByPlaceholderText('המייל שלך'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('מה התקלה?'), {
      target: { value: 'יש שגיאה בחיבור לאינטרנט' },
    });

    fireEvent.click(screen.getByRole('button', { name: /שלח דיווח/i }));

    await waitFor(() => {
      expect(screen.getByText('דוח נשלח בהצלחה')).toBeInTheDocument();
    });
  });

  test('handles fetch error gracefully', async () => {
    global.fetch = jest.fn(() => Promise.reject('API is down'));
    render(<ReportForm />);

    fireEvent.change(screen.getByPlaceholderText('המייל שלך'), {
      target: { value: 'fail@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('מה התקלה?'), {
      target: { value: 'ניסיון כושל' },
    });

    fireEvent.click(screen.getByRole('button', { name: /שלח דיווח/i }));

    await waitFor(() => {
      expect(screen.getByText('שגיאה בשליחה לשרת')).toBeInTheDocument();
    });
  });
});