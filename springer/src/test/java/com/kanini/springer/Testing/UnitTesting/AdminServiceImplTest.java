package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Authentication.CreateUserRequest;
import com.kanini.springer.dto.Authentication.UserResponse;
import com.kanini.springer.entity.HiringReq.Role;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.RoleName;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Authentication.AdminUserMapper;
import com.kanini.springer.mapper.Authentication.UserMapper;
import com.kanini.springer.repository.Hiring.RoleRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.User.impl.AdminServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link AdminServiceImpl}.
 *
 * All dependencies are mocked — no Spring context is loaded.
 * Covers every public service method with positive (happy path)
 * and negative (edge case / exception) scenarios.
 */
@ExtendWith(MockitoExtension.class)
class AdminServiceImplTest {

    // ---------------------------------------------------------------
    // Mocks
    // ---------------------------------------------------------------
    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private AdminUserMapper adminUserMapper;
    @Mock private UserMapper userMapper;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AdminServiceImpl adminService;

    // ---------------------------------------------------------------
    // Fixtures
    // ---------------------------------------------------------------
    private User stubUser;
    private UserResponse stubResponse;
    private Role stubRole;

    @BeforeEach
    void initFixtures() {
        stubRole = new Role();
        stubRole.setRoleId(1L);
        stubRole.setRoleName(RoleName.TA_MANAGER);

        stubUser = new User();
        stubUser.setUserId(1L);
        stubUser.setUsername("Test User");
        stubUser.setEmail("testuser@kanini.com");
        stubUser.setPassword("encodedPassword123");
        stubUser.setRole(stubRole);
        stubUser.setIsActive(true);
        stubUser.setCreatedAt(LocalDateTime.now());

        stubResponse = new UserResponse();
        stubResponse.setUserId(1L);
        stubResponse.setUsername("Test User");
        stubResponse.setEmail("testuser@kanini.com");
        stubResponse.setRoleName("TA_MANAGER");
        stubResponse.setIsActive(true);
    }

    // =======================================================================
    // createUser()
    // =======================================================================

    @Nested
    @DisplayName("createUser()")
    class CreateUser {

        @Test
        @DisplayName("success - creates user with TA_RECRUITER role")
        void createUser_validRequest_success() {
            CreateUserRequest request = new CreateUserRequest();
            request.setUsername("New User");
            request.setEmail("newuser@kanini.com");
            request.setPassword("plainPassword123");
            request.setRoleName("TA_MANAGER");

            when(roleRepository.findByRoleName(RoleName.TA_MANAGER))
                    .thenReturn(Optional.of(stubRole));
            when(passwordEncoder.encode("plainPassword123"))
                    .thenReturn("encodedPassword123");
            when(adminUserMapper.toEntity(request, stubRole, "encodedPassword123"))
                    .thenReturn(stubUser);
            when(userRepository.save(stubUser)).thenReturn(stubUser);
            when(userMapper.toResponse(stubUser)).thenReturn(stubResponse);

            UserResponse result = adminService.createUser(request);

            assertThat(result).isNotNull();
            assertThat(result.getUserId()).isEqualTo(1L);
            assertThat(result.getUsername()).isEqualTo("Test User");
            assertThat(result.getRoleName()).isEqualTo("TA_MANAGER");
            assertThat(result.getIsActive()).isTrue();
            
            verify(roleRepository).findByRoleName(RoleName.TA_MANAGER);
            verify(passwordEncoder).encode("plainPassword123");
            verify(userRepository).save(stubUser);
        }

        @Test
        @DisplayName("success - creates user with TA_HEAD role")
        void createUser_taHeadRole_success() {
            CreateUserRequest request = new CreateUserRequest();
            request.setUsername("TA Head User");
            request.setEmail("tahead@kanini.com");
            request.setPassword("password123");
            request.setRoleName("TA_HEAD");

            Role taHeadRole = new Role();
            taHeadRole.setRoleId(2L);
            taHeadRole.setRoleName(RoleName.TA_HEAD);

            when(roleRepository.findByRoleName(RoleName.TA_HEAD))
                    .thenReturn(Optional.of(taHeadRole));
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(adminUserMapper.toEntity(any(), eq(taHeadRole), anyString())).thenReturn(stubUser);
            when(userRepository.save(any(User.class))).thenReturn(stubUser);
            when(userMapper.toResponse(any(User.class))).thenReturn(stubResponse);

            UserResponse result = adminService.createUser(request);

            assertThat(result).isNotNull();
            verify(roleRepository).findByRoleName(RoleName.TA_HEAD);
        }

        @Test
        @DisplayName("success - creates user with HIRING_MANAGER role")
        void createUser_hiringManagerRole_success() {
            CreateUserRequest request = new CreateUserRequest();
            request.setUsername("Hiring Manager");
            request.setEmail("manager@kanini.com");
            request.setPassword("password123");
            request.setRoleName("HIRING_MANAGER");

            Role hiringManagerRole = new Role();
            hiringManagerRole.setRoleId(3L);
            hiringManagerRole.setRoleName(RoleName.HIRING_MANAGER);

            when(roleRepository.findByRoleName(RoleName.HIRING_MANAGER))
                    .thenReturn(Optional.of(hiringManagerRole));
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(adminUserMapper.toEntity(any(), eq(hiringManagerRole), anyString())).thenReturn(stubUser);
            when(userRepository.save(any(User.class))).thenReturn(stubUser);
            when(userMapper.toResponse(any(User.class))).thenReturn(stubResponse);

            UserResponse result = adminService.createUser(request);

            assertThat(result).isNotNull();
            verify(roleRepository).findByRoleName(RoleName.HIRING_MANAGER);
        }

        @Test
        @DisplayName("success - creates user with PANEL_MEMBER role")
        void createUser_panelMemberRole_success() {
            CreateUserRequest request = new CreateUserRequest();
            request.setUsername("Panel Member");
            request.setEmail("panel@kanini.com");
            request.setPassword("password123");
            request.setRoleName("MEMBERS");

            Role panelRole = new Role();
            panelRole.setRoleId(4L);
            panelRole.setRoleName(RoleName.MEMBERS);

            when(roleRepository.findByRoleName(RoleName.MEMBERS))
                    .thenReturn(Optional.of(panelRole));
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(adminUserMapper.toEntity(any(), eq(panelRole), anyString())).thenReturn(stubUser);
            when(userRepository.save(any(User.class))).thenReturn(stubUser);
            when(userMapper.toResponse(any(User.class))).thenReturn(stubResponse);

            UserResponse result = adminService.createUser(request);

            assertThat(result).isNotNull();
            verify(roleRepository).findByRoleName(RoleName.MEMBERS);
        }

        @Test
        @DisplayName("success - creates user with TRAINING_COORDINATOR role")
        void createUser_trainingCoordinatorRole_success() {
            CreateUserRequest request = new CreateUserRequest();
            request.setUsername("Training Coordinator");
            request.setEmail("trainer@kanini.com");
            request.setPassword("password123");
            request.setRoleName("TRAINING_COORDINATOR");

            Role coordinatorRole = new Role();
            coordinatorRole.setRoleId(5L);
            coordinatorRole.setRoleName(RoleName.TRAINING_COORDINATOR);

            when(roleRepository.findByRoleName(RoleName.TRAINING_COORDINATOR))
                    .thenReturn(Optional.of(coordinatorRole));
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(adminUserMapper.toEntity(any(), eq(coordinatorRole), anyString())).thenReturn(stubUser);
            when(userRepository.save(any(User.class))).thenReturn(stubUser);
            when(userMapper.toResponse(any(User.class))).thenReturn(stubResponse);

            UserResponse result = adminService.createUser(request);

            assertThat(result).isNotNull();
            verify(roleRepository).findByRoleName(RoleName.TRAINING_COORDINATOR);
        }

        @Test
        @DisplayName("error - throws ValidationException for invalid role name")
        void createUser_invalidRoleName_throwsValidationException() {
            CreateUserRequest request = new CreateUserRequest();
            request.setUsername("Test User");
            request.setEmail("test@kanini.com");
            request.setPassword("password123");
            request.setRoleName("INVALID_ROLE");

            assertThatThrownBy(() -> adminService.createUser(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Invalid role name")
                    .hasMessageContaining("INVALID_ROLE");

            verify(roleRepository, never()).findByRoleName(any());
            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("error - throws ResourceNotFoundException when role not found in DB")
        void createUser_roleNotFoundInDb_throwsResourceNotFoundException() {
            CreateUserRequest request = new CreateUserRequest();
            request.setUsername("Test User");
            request.setEmail("test@kanini.com");
            request.setPassword("password123");
            request.setRoleName("TA_MANAGER");

            when(roleRepository.findByRoleName(RoleName.TA_MANAGER))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminService.createUser(request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Role")
                    .hasMessageContaining("TA_MANAGER");

            verify(roleRepository).findByRoleName(RoleName.TA_MANAGER);
            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("success - password is encoded before saving")
        void createUser_passwordEncoded_success() {
            CreateUserRequest request = new CreateUserRequest();
            request.setUsername("Test User");
            request.setEmail("test@kanini.com");
            request.setPassword("plainPassword");
            request.setRoleName("TA_MANAGER");

            when(roleRepository.findByRoleName(RoleName.TA_MANAGER))
                    .thenReturn(Optional.of(stubRole));
            when(passwordEncoder.encode("plainPassword"))
                    .thenReturn("$2a$10$encodedHashValue");
            when(adminUserMapper.toEntity(request, stubRole, "$2a$10$encodedHashValue"))
                    .thenReturn(stubUser);
            when(userRepository.save(stubUser)).thenReturn(stubUser);
            when(userMapper.toResponse(stubUser)).thenReturn(stubResponse);

            adminService.createUser(request);

            verify(passwordEncoder).encode("plainPassword");
            verify(adminUserMapper).toEntity(request, stubRole, "$2a$10$encodedHashValue");
        }
    }

    // =======================================================================
    // getAllUsersExceptInternRole()
    // =======================================================================

    @Nested
    @DisplayName("getAllUsersExceptInternRole()")
    class GetAllUsersExceptInternRole {

        @Test
        @DisplayName("success - returns all non-intern users")
        void getAllUsersExceptInternRole_multipleUsers_success() {
            User user1 = new User();
            user1.setUserId(1L);
            user1.setUsername("User 1");
            user1.setEmail("user1@kanini.com");
            user1.setRole(stubRole);

            User user2 = new User();
            user2.setUserId(2L);
            user2.setUsername("User 2");
            user2.setEmail("user2@kanini.com");
            user2.setRole(stubRole);

            List<User> users = Arrays.asList(user1, user2);

            UserResponse response1 = new UserResponse();
            response1.setUserId(1L);
            response1.setUsername("User 1");

            UserResponse response2 = new UserResponse();
            response2.setUserId(2L);
            response2.setUsername("User 2");

            when(userRepository.findAllExceptInternRole(RoleName.INTERN))
                    .thenReturn(users);
            when(userMapper.toResponse(user1)).thenReturn(response1);
            when(userMapper.toResponse(user2)).thenReturn(response2);

            List<UserResponse> result = adminService.getAllUsersExceptInternRole();

            assertThat(result).hasSize(2);
            assertThat(result.get(0).getUserId()).isEqualTo(1L);
            assertThat(result.get(1).getUserId()).isEqualTo(2L);
            verify(userRepository).findAllExceptInternRole(RoleName.INTERN);
        }

        @Test
        @DisplayName("success - returns empty list when no non-intern users exist")
        void getAllUsersExceptInternRole_noUsers_returnsEmpty() {
            when(userRepository.findAllExceptInternRole(RoleName.INTERN))
                    .thenReturn(Collections.emptyList());

            List<UserResponse> result = adminService.getAllUsersExceptInternRole();

            assertThat(result).isEmpty();
            verify(userRepository).findAllExceptInternRole(RoleName.INTERN);
        }

        @Test
        @DisplayName("success - excludes INTERN role users")
        void getAllUsersExceptInternRole_excludesInterns_success() {
            User nonInternUser = new User();
            nonInternUser.setUserId(1L);
            nonInternUser.setUsername("Non-Intern User");
            nonInternUser.setRole(stubRole);

            when(userRepository.findAllExceptInternRole(RoleName.INTERN))
                    .thenReturn(Collections.singletonList(nonInternUser));
            when(userMapper.toResponse(nonInternUser)).thenReturn(stubResponse);

            List<UserResponse> result = adminService.getAllUsersExceptInternRole();

            assertThat(result).hasSize(1);
            verify(userRepository).findAllExceptInternRole(RoleName.INTERN);
        }
    }

    // =======================================================================
    // toggleStatusUsingId()
    // =======================================================================

    @Nested
    @DisplayName("toggleStatusUsingId()")
    class ToggleStatusUsingId {

        @Test
        @DisplayName("success - toggles status from true to false")
        void toggleStatusUsingId_trueToFalse_success() {
            stubUser.setIsActive(true);

            when(userRepository.findById(1L)).thenReturn(Optional.of(stubUser));
            when(userRepository.save(stubUser)).thenReturn(stubUser);
            
            UserResponse updatedResponse = new UserResponse();
            updatedResponse.setUserId(1L);
            updatedResponse.setIsActive(false);
            when(userMapper.toResponse(stubUser)).thenReturn(updatedResponse);

            UserResponse result = adminService.toggleStatusUsingId(1L);

            assertThat(result).isNotNull();
            assertThat(result.getIsActive()).isFalse();
            assertThat(stubUser.getIsActive()).isFalse(); // Verify entity was modified
            verify(userRepository).findById(1L);
            verify(userRepository).save(stubUser);
        }

        @Test
        @DisplayName("success - toggles status from false to true")
        void toggleStatusUsingId_falseToTrue_success() {
            stubUser.setIsActive(false);

            when(userRepository.findById(1L)).thenReturn(Optional.of(stubUser));
            when(userRepository.save(stubUser)).thenReturn(stubUser);
            
            UserResponse updatedResponse = new UserResponse();
            updatedResponse.setUserId(1L);
            updatedResponse.setIsActive(true);
            when(userMapper.toResponse(stubUser)).thenReturn(updatedResponse);

            UserResponse result = adminService.toggleStatusUsingId(1L);

            assertThat(result).isNotNull();
            assertThat(result.getIsActive()).isTrue();
            assertThat(stubUser.getIsActive()).isTrue(); // Verify entity was modified
            verify(userRepository).findById(1L);
            verify(userRepository).save(stubUser);
        }

        @Test
        @DisplayName("error - throws ResourceNotFoundException for non-existent user ID")
        void toggleStatusUsingId_userNotFound_throwsResourceNotFoundException() {
            when(userRepository.findById(99999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminService.toggleStatusUsingId(99999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User")
                    .hasMessageContaining("99999");

            verify(userRepository).findById(99999L);
            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("success - toggling multiple times works correctly")
        void toggleStatusUsingId_multipleToggles_success() {
            stubUser.setIsActive(true);

            when(userRepository.findById(1L)).thenReturn(Optional.of(stubUser));
            when(userRepository.save(stubUser)).thenReturn(stubUser);
            when(userMapper.toResponse(stubUser)).thenReturn(stubResponse);

            // First toggle: true -> false
            adminService.toggleStatusUsingId(1L);
            assertThat(stubUser.getIsActive()).isFalse();

            // Second toggle: false -> true
            stubUser.setIsActive(false);
            adminService.toggleStatusUsingId(1L);
            assertThat(stubUser.getIsActive()).isTrue();

            verify(userRepository, times(2)).findById(1L);
            verify(userRepository, times(2)).save(stubUser);
        }
    }
}
