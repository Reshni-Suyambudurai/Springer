package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Common.EmailTemplateRequest;
import com.kanini.springer.dto.Common.EmailTemplateResponse;
import com.kanini.springer.dto.Common.EmailTemplateUpdateRequest;
import com.kanini.springer.entity.utils.EmailTemplate;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.mapper.Common.EmailTemplateMapper;
import com.kanini.springer.repository.Common.EmailTemplateRepository;
import com.kanini.springer.service.Common.impl.EmailTemplateServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Executor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link EmailTemplateServiceImpl}.
 *
 * All dependencies are mocked — no Spring context is loaded.
 * Covers every public service method with positive (happy path)
 * and negative (edge case / exception) scenarios.
 */
@ExtendWith(MockitoExtension.class)
class EmailTemplateServiceImplTest {

    // ---------------------------------------------------------------
    // Mocks
    // ---------------------------------------------------------------
    @Mock private EmailTemplateRepository emailTemplateRepository;
    @Mock private EmailTemplateMapper mapper;
    @Mock private JavaMailSender mailSender;
    @Mock private Executor mailExecutor;

    @InjectMocks
    private EmailTemplateServiceImpl emailTemplateService;

    // ---------------------------------------------------------------
    // Fixtures
    // ---------------------------------------------------------------
    private EmailTemplate stubTemplate;
    private EmailTemplateResponse stubResponse;

    @BeforeEach
    void initFixtures() {
        stubTemplate = new EmailTemplate();
        stubTemplate.setTemplateId(1);
        stubTemplate.setTemplateName("Test Template");
        stubTemplate.setSubject("Test Subject");
        stubTemplate.setBody("<html><body><h1>Test Body</h1></body></html>");

        stubResponse = new EmailTemplateResponse();
        stubResponse.setTemplateId(1);
        stubResponse.setTemplateName("Test Template");
        stubResponse.setSubject("Test Subject");
        stubResponse.setBody("<html><body><h1>Test Body</h1></body></html>");
    }

    // =======================================================================
    // createEmailTemplate()
    // =======================================================================

    @Nested
    @DisplayName("createEmailTemplate()")
    class CreateEmailTemplate {

        @Test
        @DisplayName("success - creates and returns new email template")
        void createEmailTemplate_newTemplate_success() {
            EmailTemplateRequest request = new EmailTemplateRequest();
            request.setTemplateName("New Template");
            request.setSubject("New Subject");
            request.setBody("<html><body>New Body</body></html>");

            when(mapper.toEntity(request)).thenReturn(stubTemplate);
            when(emailTemplateRepository.save(any(EmailTemplate.class))).thenReturn(stubTemplate);
            when(mapper.toResponse(stubTemplate)).thenReturn(stubResponse);

            EmailTemplateResponse result = emailTemplateService.createEmailTemplate(request);

            assertThat(result).isNotNull();
            assertThat(result.getTemplateId()).isEqualTo(1);
            assertThat(result.getTemplateName()).isEqualTo("Test Template");
            verify(emailTemplateRepository).save(any(EmailTemplate.class));
            verify(mapper).toEntity(request);
            verify(mapper).toResponse(stubTemplate);
        }

        @Test
        @DisplayName("success - creates template with HTML body")
        void createEmailTemplate_htmlBody_success() {
            EmailTemplateRequest request = new EmailTemplateRequest();
            request.setTemplateName("HTML Template");
            request.setSubject("HTML Subject");
            request.setBody("<html><body><p style='color:red;'>Styled content</p></body></html>");

            when(mapper.toEntity(request)).thenReturn(stubTemplate);
            when(emailTemplateRepository.save(any(EmailTemplate.class))).thenReturn(stubTemplate);
            when(mapper.toResponse(stubTemplate)).thenReturn(stubResponse);

            EmailTemplateResponse result = emailTemplateService.createEmailTemplate(request);

            assertThat(result).isNotNull();
            verify(emailTemplateRepository).save(any(EmailTemplate.class));
        }
    }

    // =======================================================================
    // getAllEmailTemplates()
    // =======================================================================

    @Nested
    @DisplayName("getAllEmailTemplates()")
    class GetAllEmailTemplates {

        @Test
        @DisplayName("success - returns all email templates")
        void getAllEmailTemplates_multipleTemplates_success() {
            EmailTemplate template1 = new EmailTemplate();
            template1.setTemplateId(1);
            template1.setTemplateName("Template 1");

            EmailTemplate template2 = new EmailTemplate();
            template2.setTemplateId(2);
            template2.setTemplateName("Template 2");

            List<EmailTemplate> templates = Arrays.asList(template1, template2);

            EmailTemplateResponse response1 = new EmailTemplateResponse();
            response1.setTemplateId(1);
            response1.setTemplateName("Template 1");

            EmailTemplateResponse response2 = new EmailTemplateResponse();
            response2.setTemplateId(2);
            response2.setTemplateName("Template 2");

            when(emailTemplateRepository.findAll()).thenReturn(templates);
            when(mapper.toResponse(template1)).thenReturn(response1);
            when(mapper.toResponse(template2)).thenReturn(response2);

            List<EmailTemplateResponse> result = emailTemplateService.getAllEmailTemplates();

            assertThat(result).hasSize(2);
            assertThat(result.get(0).getTemplateName()).isEqualTo("Template 1");
            assertThat(result.get(1).getTemplateName()).isEqualTo("Template 2");
            verify(emailTemplateRepository).findAll();
        }

        @Test
        @DisplayName("success - returns empty list when no templates exist")
        void getAllEmailTemplates_noTemplates_returnsEmpty() {
            when(emailTemplateRepository.findAll()).thenReturn(Collections.emptyList());

            List<EmailTemplateResponse> result = emailTemplateService.getAllEmailTemplates();

            assertThat(result).isEmpty();
            verify(emailTemplateRepository).findAll();
        }
    }

    // =======================================================================
    // getEmailTemplatesByIds()
    // =======================================================================

    @Nested
    @DisplayName("getEmailTemplatesByIds()")
    class GetEmailTemplatesByIds {

        @Test
        @DisplayName("success - returns templates for valid IDs")
        void getEmailTemplatesByIds_validIds_success() {
            List<Integer> templateIds = Arrays.asList(1, 2);

            EmailTemplate template1 = new EmailTemplate();
            template1.setTemplateId(1);
            EmailTemplate template2 = new EmailTemplate();
            template2.setTemplateId(2);

            when(emailTemplateRepository.findByTemplateIdIn(templateIds))
                    .thenReturn(Arrays.asList(template1, template2));
            when(mapper.toResponse(any(EmailTemplate.class))).thenReturn(stubResponse);

            List<EmailTemplateResponse> result = emailTemplateService.getEmailTemplatesByIds(templateIds);

            assertThat(result).hasSize(2);
            verify(emailTemplateRepository).findByTemplateIdIn(templateIds);
        }

        @Test
        @DisplayName("success - returns empty list for non-existent IDs")
        void getEmailTemplatesByIds_nonExistentIds_returnsEmpty() {
            List<Integer> templateIds = Arrays.asList(99999, 88888);

            when(emailTemplateRepository.findByTemplateIdIn(templateIds))
                    .thenReturn(Collections.emptyList());

            List<EmailTemplateResponse> result = emailTemplateService.getEmailTemplatesByIds(templateIds);

            assertThat(result).isEmpty();
            verify(emailTemplateRepository).findByTemplateIdIn(templateIds);
        }

        @Test
        @DisplayName("success - returns empty list when input is null")
        void getEmailTemplatesByIds_nullInput_returnsEmpty() {
            List<EmailTemplateResponse> result = emailTemplateService.getEmailTemplatesByIds(null);

            assertThat(result).isEmpty();
            verify(emailTemplateRepository, never()).findByTemplateIdIn(any());
        }

        @Test
        @DisplayName("success - returns empty list when input is empty")
        void getEmailTemplatesByIds_emptyInput_returnsEmpty() {
            List<EmailTemplateResponse> result = emailTemplateService.getEmailTemplatesByIds(Collections.emptyList());

            assertThat(result).isEmpty();
            verify(emailTemplateRepository, never()).findByTemplateIdIn(any());
        }

        @Test
        @DisplayName("success - returns partial results when some IDs not found")
        void getEmailTemplatesByIds_partialMatch_returnsFound() {
            List<Integer> templateIds = Arrays.asList(1, 99999);

            EmailTemplate template1 = new EmailTemplate();
            template1.setTemplateId(1);

            when(emailTemplateRepository.findByTemplateIdIn(templateIds))
                    .thenReturn(Collections.singletonList(template1));
            when(mapper.toResponse(template1)).thenReturn(stubResponse);

            List<EmailTemplateResponse> result = emailTemplateService.getEmailTemplatesByIds(templateIds);

            assertThat(result).hasSize(1);
            verify(emailTemplateRepository).findByTemplateIdIn(templateIds);
        }
    }

    // =======================================================================
    // getEmailTemplateById()
    // =======================================================================

    @Nested
    @DisplayName("getEmailTemplateById()")
    class GetEmailTemplateById {

        @Test
        @DisplayName("success - returns template for valid ID")
        void getEmailTemplateById_validId_success() {
            when(emailTemplateRepository.findById(1)).thenReturn(Optional.of(stubTemplate));
            when(mapper.toResponse(stubTemplate)).thenReturn(stubResponse);

            EmailTemplateResponse result = emailTemplateService.getEmailTemplateById(1);

            assertThat(result).isNotNull();
            assertThat(result.getTemplateId()).isEqualTo(1);
            verify(emailTemplateRepository).findById(1);
        }

        @Test
        @DisplayName("error - throws ResourceNotFoundException for non-existent ID")
        void getEmailTemplateById_notFound_throwsException() {
            when(emailTemplateRepository.findById(99999)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> emailTemplateService.getEmailTemplateById(99999))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Email Template")
                    .hasMessageContaining("99999");

            verify(emailTemplateRepository).findById(99999);
        }
    }

    // =======================================================================
    // updateEmailTemplate()
    // =======================================================================

    @Nested
    @DisplayName("updateEmailTemplate()")
    class UpdateEmailTemplate {

        @Test
        @DisplayName("success - updates all fields when provided")
        void updateEmailTemplate_allFields_success() {
            EmailTemplateUpdateRequest request = new EmailTemplateUpdateRequest();
            request.setTemplateName("Updated Name");
            request.setSubject("Updated Subject");
            request.setBody("<html><body>Updated Body</body></html>");

            EmailTemplate updatedTemplate = new EmailTemplate();
            updatedTemplate.setTemplateId(1);
            updatedTemplate.setTemplateName("Updated Name");
            updatedTemplate.setSubject("Updated Subject");
            updatedTemplate.setBody("<html><body>Updated Body</body></html>");

            when(emailTemplateRepository.findById(1)).thenReturn(Optional.of(stubTemplate));
            when(emailTemplateRepository.save(any(EmailTemplate.class))).thenReturn(updatedTemplate);
            when(mapper.toResponse(updatedTemplate)).thenReturn(stubResponse);

            EmailTemplateResponse result = emailTemplateService.updateEmailTemplate(1, request);

            assertThat(result).isNotNull();
            verify(emailTemplateRepository).findById(1);
            verify(emailTemplateRepository).save(any(EmailTemplate.class));
        }

        @Test
        @DisplayName("success - partial update (only subject)")
        void updateEmailTemplate_onlySubject_success() {
            EmailTemplateUpdateRequest request = new EmailTemplateUpdateRequest();
            request.setSubject("Partially Updated Subject");

            when(emailTemplateRepository.findById(1)).thenReturn(Optional.of(stubTemplate));
            when(emailTemplateRepository.save(any(EmailTemplate.class))).thenReturn(stubTemplate);
            when(mapper.toResponse(stubTemplate)).thenReturn(stubResponse);

            EmailTemplateResponse result = emailTemplateService.updateEmailTemplate(1, request);

            assertThat(result).isNotNull();
            assertThat(stubTemplate.getSubject()).isEqualTo("Partially Updated Subject");
            verify(emailTemplateRepository).findById(1);
            verify(emailTemplateRepository).save(any(EmailTemplate.class));
        }

        @Test
        @DisplayName("success - partial update (only body)")
        void updateEmailTemplate_onlyBody_success() {
            EmailTemplateUpdateRequest request = new EmailTemplateUpdateRequest();
            request.setBody("<html><body>New Body Only</body></html>");

            when(emailTemplateRepository.findById(1)).thenReturn(Optional.of(stubTemplate));
            when(emailTemplateRepository.save(any(EmailTemplate.class))).thenReturn(stubTemplate);
            when(mapper.toResponse(stubTemplate)).thenReturn(stubResponse);

            EmailTemplateResponse result = emailTemplateService.updateEmailTemplate(1, request);

            assertThat(result).isNotNull();
            assertThat(stubTemplate.getBody()).isEqualTo("<html><body>New Body Only</body></html>");
            verify(emailTemplateRepository).findById(1);
            verify(emailTemplateRepository).save(any(EmailTemplate.class));
        }

        @Test
        @DisplayName("error - throws ResourceNotFoundException for non-existent ID")
        void updateEmailTemplate_notFound_throwsException() {
            EmailTemplateUpdateRequest request = new EmailTemplateUpdateRequest();
            request.setSubject("Test");

            when(emailTemplateRepository.findById(99999)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> emailTemplateService.updateEmailTemplate(99999, request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Email Template")
                    .hasMessageContaining("99999");

            verify(emailTemplateRepository).findById(99999);
            verify(emailTemplateRepository, never()).save(any(EmailTemplate.class));
        }
    }

    // =======================================================================
    // deleteEmailTemplate()
    // =======================================================================

    @Nested
    @DisplayName("deleteEmailTemplate()")
    class DeleteEmailTemplate {

        @Test
        @DisplayName("success - deletes template for valid ID")
        void deleteEmailTemplate_validId_success() {
            when(emailTemplateRepository.findById(1)).thenReturn(Optional.of(stubTemplate));
            doNothing().when(emailTemplateRepository).delete(stubTemplate);

            emailTemplateService.deleteEmailTemplate(1);

            verify(emailTemplateRepository).findById(1);
            verify(emailTemplateRepository).delete(stubTemplate);
        }

        @Test
        @DisplayName("error - throws ResourceNotFoundException for non-existent ID")
        void deleteEmailTemplate_notFound_throwsException() {
            when(emailTemplateRepository.findById(99999)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> emailTemplateService.deleteEmailTemplate(99999))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Email Template")
                    .hasMessageContaining("99999");

            verify(emailTemplateRepository).findById(99999);
            verify(emailTemplateRepository, never()).delete(any(EmailTemplate.class));
        }
    }
}
