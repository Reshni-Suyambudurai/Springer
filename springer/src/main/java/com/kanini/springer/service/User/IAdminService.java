package com.kanini.springer.service.User;

import com.kanini.springer.dto.Authentication.CreateUserRequest;
import com.kanini.springer.dto.Authentication.UserResponse;

import java.util.List;

public interface IAdminService {

    /**
     * Create a new user and persist to the users table
     */
    UserResponse createUser(CreateUserRequest request);

    /**
     * Retrieve all users except those assigned the INTERN role
     */
    List<UserResponse> getAllUsersExceptInternRole();

    /**
     * Toggle the isActive status of a user identified by userId
     */
    UserResponse toggleStatusUsingId(Long userId);
}
