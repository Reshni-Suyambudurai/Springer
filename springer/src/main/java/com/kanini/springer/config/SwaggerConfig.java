package com.kanini.springer.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger/OpenAPI Configuration
 * Enables JWT Bearer token authentication in Swagger UI
 */
@Configuration
public class SwaggerConfig {
    
    private static final String SECURITY_SCHEME_NAME = "bearerAuth Token";
    
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Springer Talent Acquisition Management System (S-TAMS) API")
                        .version("1.0.0")
                        .description("REST API documentation for Springer Talent Acquisition Management System")
                        .contact(new Contact()
                                .name("Kanini Software Solutions")
                                .email("support@kanini.com")
                                .url("https://www.kanini.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name(SECURITY_SCHEME_NAME)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .in(SecurityScheme.In.HEADER)
                                        .description("Enter JWT token obtained from /api/auth/login endpoint")));
    }
}
