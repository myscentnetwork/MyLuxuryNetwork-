/**
 * Base API Handler
 * Standardized API route handling with error handling and logging
 */

import { NextResponse } from "next/server";

// ============== TYPES ==============
export interface ApiHandlerContext {
  params?: Promise<Record<string, string>>;
}

export type ApiHandler<T = unknown> = (
  request: Request,
  context: ApiHandlerContext
) => Promise<NextResponse<T>>;

export interface ApiErrorResponse {
  error: string;
  details?: Record<string, string>;
}

// ============== ERROR CLASSES ==============
export class ApiError extends Error {
  public statusCode: number;
  public details?: Record<string, string>;

  constructor(message: string, statusCode: number, details?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NotFoundError extends ApiError {
  constructor(entity: string) {
    super(`${entity} not found`, 404);
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string, details?: Record<string, string>) {
    super(message, 400, details);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409);
  }
}

// ============== RESPONSE HELPERS ==============
export function successResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

export function createdResponse<T>(data: T): NextResponse<T> {
  return NextResponse.json(data, { status: 201 });
}

export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function errorResponse(
  message: string,
  status = 500,
  details?: Record<string, string>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ error: message, details }, { status });
}

// ============== ERROR HANDLER ==============
export function handleApiError(error: unknown, entityName: string): NextResponse<ApiErrorResponse> {
  console.error(`Error in ${entityName} API:`, error);

  if (error instanceof ApiError) {
    return errorResponse(error.message, error.statusCode, error.details);
  }

  if (error instanceof Error) {
    // Check for Prisma unique constraint error
    if (error.message.includes("Unique constraint")) {
      return errorResponse(`${entityName} already exists`, 409);
    }
    return errorResponse(error.message, 500);
  }

  return errorResponse(`Failed to process ${entityName} request`, 500);
}

// ============== WRAPPER FUNCTION ==============
export function withErrorHandling<T>(
  handler: ApiHandler<T>,
  entityName: string
): ApiHandler<T | ApiErrorResponse> {
  return async (request: Request, context: ApiHandlerContext) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error, entityName);
    }
  };
}

// ============== VALIDATION HELPERS ==============
export function validateRequired(
  fields: Record<string, unknown>,
  required: string[]
): void {
  const missing = required.filter((field) => {
    const value = fields[field];
    return value === undefined || value === null || value === "";
  });

  if (missing.length > 0) {
    throw new BadRequestError(
      `Missing required fields: ${missing.join(", ")}`,
      Object.fromEntries(missing.map((f) => [f, "This field is required"]))
    );
  }
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return await request.json();
  } catch {
    throw new BadRequestError("Invalid JSON body");
  }
}

export async function getIdParam(params: Promise<Record<string, string>>): Promise<string> {
  const { id } = await params;
  if (!id) {
    throw new BadRequestError("Missing ID parameter");
  }
  return id;
}
