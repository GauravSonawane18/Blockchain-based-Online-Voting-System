package com.major.evoting_system.security;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.*;
import java.util.function.Function;
@Component
public class JwtUtil {
    @Value("${jwt.secret}") private String secret;
    @Value("${jwt.expiration}") private long expiration;
    private Key key() { return Keys.hmacShaKeyFor(secret.getBytes()); }
    public String generateToken(UserDetails ud, String role) {
        return Jwts.builder().setClaims(Map.of("role",role)).setSubject(ud.getUsername())
            .setIssuedAt(new Date()).setExpiration(new Date(System.currentTimeMillis()+expiration))
            .signWith(key(),SignatureAlgorithm.HS256).compact();
    }
    public String extractUsername(String t) { return claim(t,Claims::getSubject); }
    public String extractRole(String t) { return all(t).get("role",String.class); }
    public boolean validateToken(String t, UserDetails ud) { return extractUsername(t).equals(ud.getUsername())&&!expired(t); }
    private boolean expired(String t) { return claim(t,Claims::getExpiration).before(new Date()); }
    private <T> T claim(String t,Function<Claims,T> r) { return r.apply(all(t)); }
    private Claims all(String t) { return Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(t).getBody(); }
}
