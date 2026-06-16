import { type Request, type Response, type NextFunction } from 'express';
import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { requestLogger } from './logger.js'; 

describe('Logger Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/api/v1/usuarios'
    };
    
    mockResponse = {
      statusCode: 200,
      on: jest.fn() as any
    };
    
    nextFunction = jest.fn() as unknown as NextFunction;
    
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('(a) que el logger invoque next() al recibir una petición', () => {
    requestLogger(mockRequest as Request, mockResponse as Response, nextFunction);
    
    expect(nextFunction).toHaveBeenCalled();
  });

  it('(b) que registre el método y la ruta correctamente', () => {
    let finishCallback: () => void = () => {};
    
    (mockResponse.on as any).mockImplementation((event: string, cb: () => void) => {
      if (event === 'finish') {
        finishCallback = cb;
      }
    });

    requestLogger(mockRequest as Request, mockResponse as Response, nextFunction);
    
    finishCallback();
    
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('GET'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('/api/v1/usuarios'));
  });
});