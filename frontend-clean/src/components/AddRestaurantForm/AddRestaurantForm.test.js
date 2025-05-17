import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AddRestaurantForm from './addrestaurantform';
import '@testing-library/jest-dom';

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ message: '✅ המסעדה נוספה בהצלחה' })
  })
);

describe('AddRestaurantForm', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders the form inputs', () => {
    render(<AddRestaurantForm />);

    expect(screen.getByPlaceholderText('שם מסעדה')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('כתובת / מיקום')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('טלפון')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('כתובת מלאה')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('תיאור קצר')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('כתובת אתר')).toBeInTheDocument();
  });

  test('can fill and submit the form', async () => {
    render(<AddRestaurantForm />);

    fireEvent.change(screen.getByPlaceholderText('שם מסעדה'), {
      target: { value: 'Test Restaurant' }
    });
    fireEvent.change(screen.getByPlaceholderText('כתובת / מיקום'), {
      target: { value: 'Tel Aviv' }
    });
    fireEvent.change(screen.getByPlaceholderText('טלפון'), {
      target: { value: '0501234567' }
    });
    fireEvent.change(screen.getByPlaceholderText('כתובת מלאה'), {
      target: { value: 'Main St 5' }
    });
    fireEvent.change(screen.getByPlaceholderText('תיאור קצר'), {
      target: { value: 'טעים' }
    });
    fireEvent.change(screen.getByPlaceholderText('כתובת אתר'), {
      target: { value: 'https://example.com' }
    });

    fireEvent.click(screen.getByRole('button', { name: /הוסף/i }));

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/restaurants/',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String)
      })
    );

    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.name).toBe('Test Restaurant');
    expect(body.location).toBe('Tel Aviv');
    expect(body.phone).toBe('0501234567');
    expect(body.address).toBe('Main St 5');
    expect(body.description).toBe('טעים');
    expect(body.website).toBe('https://example.com');
  });
});