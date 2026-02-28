package com.major.evoting_system.config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Value("${cors.allowed.origins}") private String origins;
    @Override public void addCorsMappings(CorsRegistry r) {
        r.addMapping("/api/**").allowedOrigins(origins).allowedMethods("GET","POST","PUT","DELETE","OPTIONS").allowedHeaders("*").allowCredentials(true);
    }
}
