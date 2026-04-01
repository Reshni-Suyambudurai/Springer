package com.kanini.springer.exception;

/**
 * Exception thrown when validation fails
 */
public class ValidationException extends RuntimeException {
    
    public ValidationException(String message) {
        super(message);
    }
    
    public ValidationException(String fieldName, String errorMessage) {
        super(String.format("%s: %s", fieldName, errorMessage));
    }
}
