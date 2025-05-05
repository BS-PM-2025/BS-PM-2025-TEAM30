import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DetectRestaurant from './DetectRestaurant';
import { BrowserRouter } from 'react-router-dom';

const mockRestaurant = {
  id: 1,
  name: 'Pizza Mia',
  description: 'פיצה טעימה',
  address: 'אלנבי 99',
};

beforeEach(() => {
  global.fetch = jest.fn();
});

const renderComponent = () => {
  render(
    <BrowserRouter>
      <DetectRestaurant />
    </BrowserRouter>
  );
};

describe('DetectRestaurant Component', () => {
  test('renders input and buttons', () => {
    renderComponent();

    expect(screen.getByText('📍 זיהוי מסעדה לפי מיקום או שם')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('שם מסעדה')).toBeInTheDocument();
    expect(screen.getByText('זהה לפי מיקום')).toBeInTheDocument();
    expect(screen.getByText('זהה לפי שם')).toBeInTheDocument();
  });

  test('successful name detection', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRestaurant,
    });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText('שם מסעדה'), {
      target: { value: 'Pizza Mia' },
    });
    fireEvent.click(screen.getByText('זהה לפי שם'));

    await waitFor(() => {
      expect(screen.getByText('Pizza Mia')).toBeInTheDocument();
      expect(screen.getByText('פיצה טעימה')).toBeInTheDocument();
      expect(screen.getByText('כתובת: אלנבי 99')).toBeInTheDocument();
    });
  });

  test('handles detection error', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'לא נמצאה מסעדה' }),
    });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText('שם מסעדה'), {
      target: { value: 'NonExistent' },
    });
    fireEvent.click(screen.getByText('זהה לפי שם'));

    await waitFor(() => {
      expect(screen.getByText('לא נמצאה מסעדה')).toBeInTheDocument();
    });
  });

  test('promote button sends request', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRestaurant,
      })
      .mockResolvedValueOnce({ ok: true });

    window.alert = jest.fn();

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText('שם מסעדה'), {
      target: { value: 'Pizza Mia' },
    });
    fireEvent.click(screen.getByText('זהה לפי שם'));

    await waitFor(() => {
      expect(screen.getByText('Pizza Mia')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('סמן כמומלצת ⭐'));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('סומנה כמומלצת ✅');
    });
  });
});