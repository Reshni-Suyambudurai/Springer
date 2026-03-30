package com.kanini.springer.entity.utils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Contains all the email templates used in the app
 */
@Entity
@Table(name = "email_templates"
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailTemplate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer templateId;
    
    @Column(columnDefinition = "TEXT")
    private String templateName;
    
    @Column(columnDefinition = "TEXT")
    private String subject;
    
    @Column(columnDefinition = "TEXT")
    private String body;
}
