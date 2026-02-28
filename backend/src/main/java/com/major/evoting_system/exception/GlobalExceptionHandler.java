package com.major.evoting_system.exception;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;
@RestControllerAdvice @Slf4j
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> h1(ResourceNotFoundException e) { return err(HttpStatus.NOT_FOUND, e.getMessage()); }
    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<?> h2(UserAlreadyExistsException e) { return err(HttpStatus.CONFLICT, e.getMessage()); }
    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<?> h3(InvalidCredentialsException e) { return err(HttpStatus.UNAUTHORIZED, e.getMessage()); }
    @ExceptionHandler(AccountNotVerifiedException.class)
    public ResponseEntity<?> h4(AccountNotVerifiedException e) { return err(HttpStatus.FORBIDDEN, e.getMessage()); }
    @ExceptionHandler(TwoFactorException.class)
    public ResponseEntity<?> h5(TwoFactorException e) { return err(HttpStatus.UNAUTHORIZED, e.getMessage()); }
    @ExceptionHandler(VotingException.class)
    public ResponseEntity<?> h6(VotingException e) { return err(HttpStatus.BAD_REQUEST, e.getMessage()); }
    @ExceptionHandler(InvalidOtpException.class)
    public ResponseEntity<?> h7(InvalidOtpException e) { return err(HttpStatus.BAD_REQUEST, e.getMessage()); }
    @ExceptionHandler(ElectionException.class)
    public ResponseEntity<?> h8(ElectionException e) { return err(HttpStatus.BAD_REQUEST, e.getMessage()); }
    @ExceptionHandler(AdminException.class)
    public ResponseEntity<?> h9(AdminException e) { return err(HttpStatus.BAD_REQUEST, e.getMessage()); }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> h0(Exception e) { log.error("Err: {}", e.getMessage(), e); return err(HttpStatus.INTERNAL_SERVER_ERROR, "Internal error"); }
    private ResponseEntity<Map<String,Object>> err(HttpStatus s, String msg) {
        return ResponseEntity.status(s).body(Map.of("error",s.getReasonPhrase(),"message",msg,"timestamp",LocalDateTime.now().toString()));
    }
}
