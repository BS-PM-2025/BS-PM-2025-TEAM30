import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AddRestaurantForm from './addrestaurantform';

describe('AddRestaurantForm', () => {
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

    fireEvent.change(screen.getByPlaceholderText('שם מסעדה'), { target: { value: 'Test Restaurant' } });
    fireEvent.change(screen.getByPlaceholderText('כתובת / מיקום'), { target: { value: 'Tel Aviv' } });
    fireEvent.change(screen.getByPlaceholderText('טלפון'), { target: { value: '0501234567' } });
    fireEvent.change(screen.getByPlaceholderText('כתובת מלאה'), { target: { value: 'Main St 5' } });
    fireEvent.change(screen.getByPlaceholderText('תיאור קצר'), { target: { value: 'טעים' } });
    fireEvent.change(screen.getByPlaceholderText('כתובת אתר'), { target: { value: 'https://example.com' } });

    fireEvent.click(screen.getByRole('button', { name: /הוסף/i }));

    // כאן נוכל לבדוק האם נשלח הפוסט או נוספה הודעה
    // לדוגמה: screen.getByText('המסעדה נוספה בהצלחה')
  });
});