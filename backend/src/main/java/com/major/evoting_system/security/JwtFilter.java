package com.major.evoting_system.security;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
@Component @RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain) throws ServletException,IOException {
        String auth=req.getHeader("Authorization");
        if(auth==null||!auth.startsWith("Bearer ")){chain.doFilter(req,res);return;}
        String jwt=auth.substring(7),user=jwtUtil.extractUsername(jwt);
        if(user!=null&&SecurityContextHolder.getContext().getAuthentication()==null){
            UserDetails ud=userDetailsService.loadUserByUsername(user);
            if(jwtUtil.validateToken(jwt,ud)){
                var at=new UsernamePasswordAuthenticationToken(ud,null,ud.getAuthorities());
                at.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                SecurityContextHolder.getContext().setAuthentication(at);
            }
        }
        chain.doFilter(req,res);
    }
}
