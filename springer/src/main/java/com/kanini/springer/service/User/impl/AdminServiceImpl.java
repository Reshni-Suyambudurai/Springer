package com.kanini.springer.service.User.impl;

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
import com.kanini.springer.service.User.IAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements IAdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AdminUserMapper adminUserMapper;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        // Validate and parse role name
        RoleName roleName;
        try {
            roleName = RoleName.valueOf(request.getRoleName());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid role name: " + request.getRoleName());
        }

        // Look up the role entity
        Role role = roleRepository.findByRoleName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", request.getRoleName()));

        // Encode password before persisting
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // Map request to entity and save
        User user = adminUserMapper.toEntity(request, role, encodedPassword);
        User savedUser = userRepository.save(user);

        return userMapper.toResponse(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsersExceptInternRole() {
        List<User> users = userRepository.findAllExceptInternRole(RoleName.INTERN);
        return users.stream()
                .map(userMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public UserResponse toggleStatusUsingId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "ID", userId));

        user.setIsActive(!user.getIsActive());
        User updatedUser = userRepository.save(user);

        return userMapper.toResponse(updatedUser);
    }
}
