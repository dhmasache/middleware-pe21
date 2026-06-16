import { type Request, type Response, type NextFunction } from 'express';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { requireApiKey } from './auth.js'; //

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    
    mockResponse = {
      status: jest.fn(() => mockResponse) as any,
      json: jest.fn() as any
    };
    
    nextFunction = jest.fn() as unknown as NextFunction;
  });

  it('(a) header x-api-key ausente -> llama a res.status(401)', () => {
    requireApiKey(mockRequest as Request, mockResponse as Response, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'API key inválida o ausente' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('(b) clave incorrecta -> llama a res.status(401)', () => {
    mockRequest.headers = { 'x-api-key': 'clave-inventada' };
    
    requireApiKey(mockRequest as Request, mockResponse as Response, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalled();
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('(c) clave válida -> invoca next() sin emitir respuesta', () => {
    mockRequest.headers = { 'x-api-key': 'secreto-demo' };
    
    requireApiKey(mockRequest as Request, mockResponse as Response, nextFunction);
    
    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});