package com.major.evoting_system.security;
import com.major.evoting_system.model.User;
import com.major.evoting_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import java.util.List;
@Service @RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {
    private final UserRepository userRepository;
    @Override public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User u=userRepository.findByEmail(email).orElseThrow(()->new UsernameNotFoundException("Not found: "+email));
        return new org.springframework.security.core.userdetails.User(u.getEmail(),u.getPassword(),List.of(new SimpleGrantedAuthority("ROLE_"+u.getRole().name())));
    }
}
