import { type Request, type Response, type NextFunction } from 'express';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { rateLimiter } from './rateLimiter.js';

describe('Rate Limiter Middleware', () => {
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockResponse = {
      setHeader: jest.fn() as any,
      status: jest.fn(() => mockResponse) as any,
      json: jest.fn() as any
    };

    nextFunction = jest.fn() as unknown as NextFunction;
  });

  it('permite las primeras 10 peticiones con el mismo token', () => {
    const request = {
      headers: { authorization: 'Bearer token-rate-ok' },
      ip: '127.0.0.1'
    } as Request;

    for (let i = 0; i < 10; i++) {
      rateLimiter(request, mockResponse as Response, nextFunction);
    }

    expect(nextFunction).toHaveBeenCalledTimes(10);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('responde 429 y Retry-After al superar el limite', () => {
    const request = {
      headers: { authorization: 'Bearer token-rate-limit' },
      ip: '127.0.0.1'
    } as Request;

    for (let i = 0; i < 11; i++) {
      rateLimiter(request, mockResponse as Response, nextFunction);
    }

    expect(nextFunction).toHaveBeenCalledTimes(10);
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(Number));
    expect(mockResponse.status).toHaveBeenCalledWith(429);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Demasiadas peticiones. Intenta mas tarde.'
    });
  });

  it('usa contadores independientes para tokens distintos', () => {
    const firstRequest = {
      headers: { authorization: 'Bearer token-rate-a' },
      ip: '127.0.0.1'
    } as Request;
    const secondRequest = {
      headers: { authorization: 'Bearer token-rate-b' },
      ip: '127.0.0.1'
    } as Request;

    rateLimiter(firstRequest, mockResponse as Response, nextFunction);
    rateLimiter(secondRequest, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(2);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});
