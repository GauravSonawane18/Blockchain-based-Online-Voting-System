package com.major.evoting_system.exception;
public class UserAlreadyExistsException extends RuntimeException {
    public UserAlreadyExistsException(String message) { super(message); }
}
