package com.chatapp;

import com.chatapp.model.Role;
import com.chatapp.model.RoleName;
import com.chatapp.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ChatApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChatApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData(
            RoleRepository roleRepository,
            com.chatapp.repository.UserRepository userRepository,
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder
    ) {
        return args -> {
            // 1. Initialize Roles
            for (RoleName roleName : RoleName.values()) {
                if (roleRepository.findByName(roleName).isEmpty()) {
                    roleRepository.save(new Role(roleName));
                }
            }

            Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN).orElse(null);
            Role userRole = roleRepository.findByName(RoleName.ROLE_USER).orElse(null);

            // 2. Initialize Default Admin Account if not exists
            if (!userRepository.existsByUsername("admin")) {
                java.util.Set<Role> adminRoles = new java.util.HashSet<>();
                if (adminRole != null) adminRoles.add(adminRole);
                if (userRole != null) adminRoles.add(userRole);

                com.chatapp.model.User admin = com.chatapp.model.User.builder()
                        .username("admin")
                        .email("admin@chatapp.com")
                        .password(passwordEncoder.encode("admin123"))
                        .avatarUrl("https://api.dicebear.com/7.x/bottts/svg?seed=admin")
                        .status(com.chatapp.model.UserStatus.ONLINE)
                        .roles(adminRoles)
                        .build();
                userRepository.save(admin);
                System.out.println(">>> Created default admin account: username='admin', password='admin123'");
            }

            // 3. Initialize Default Test User Account if not exists
            if (!userRepository.existsByUsername("user1")) {
                java.util.Set<Role> defaultUserRoles = new java.util.HashSet<>();
                if (userRole != null) defaultUserRoles.add(userRole);

                com.chatapp.model.User testUser = com.chatapp.model.User.builder()
                        .username("user1")
                        .email("user1@chatapp.com")
                        .password(passwordEncoder.encode("user123"))
                        .avatarUrl("https://api.dicebear.com/7.x/bottts/svg?seed=user1")
                        .status(com.chatapp.model.UserStatus.ONLINE)
                        .roles(defaultUserRoles)
                        .build();
                userRepository.save(testUser);
                System.out.println(">>> Created default user account: username='user1', password='user123'");
            }
        };
    }
}

