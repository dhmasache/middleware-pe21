import { createHmac } from 'crypto';
import { type Request, type Response, type NextFunction } from 'express';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { requireJwt } from './auth.js';

function base64url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function createToken(payload: Record<string, unknown>, secret = ''): string {
  const headerB64 = base64url({ alg: 'HS256', typ: 'JWT' });
  const payloadB64 = base64url(payload);
  const signature = createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  return `${headerB64}.${payloadB64}.${signature}`;
}

describe('JWT Auth Middleware', () => {
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

  it('header Authorization ausente -> responde 401', () => {
    requireJwt(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token ausente' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('token malformado -> responde 401', () => {
    mockRequest.headers = { authorization: 'Bearer token.incompleto' };

    requireJwt(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token malformado' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('token con alg none -> responde 401', () => {
    mockRequest.headers = {
      authorization: `Bearer ${base64url({ alg: 'none' })}.${base64url({ sub: 'user' })}.`
    };

    requireJwt(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Algoritmo no permitido' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('firma invalida -> responde 401', () => {
    const token = createToken({
      sub: '20251042',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    mockRequest.headers = { authorization: `Bearer ${token.slice(0, -1)}x` };

    requireJwt(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Firma invalida' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('token expirado -> responde 401', () => {
    const token = createToken({
      sub: '20251042',
      exp: Math.floor(Date.now() / 1000) - 1
    });

    mockRequest.headers = { authorization: `Bearer ${token}` };

    requireJwt(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token expirado' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('claim sub ausente -> responde 401', () => {
    const token = createToken({
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    mockRequest.headers = { authorization: `Bearer ${token}` };

    requireJwt(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Claim sub ausente' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('token valido -> invoca next e inyecta user', () => {
    const token = createToken({
      sub: '20251042',
      scope: 'inscripciones:write',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    mockRequest.headers = { authorization: `Bearer ${token}` };

    requireJwt(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect((mockRequest as Request & { user?: unknown }).user).toEqual({
      sub: '20251042',
      scope: 'inscripciones:write'
    });
  });
});
