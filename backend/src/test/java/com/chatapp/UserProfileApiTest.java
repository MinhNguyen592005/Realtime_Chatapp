package com.chatapp;

import com.chatapp.model.User;
import com.chatapp.repository.UserRepository;
import com.chatapp.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
@TestPropertySource(properties = {
        "spring.sql.init.mode=never",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class UserProfileApiTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired JwtTokenProvider tokens;
    @Autowired ObjectMapper json;

    @Test
    void ownerCanEditProfileWhileOtherUsersCannotSeeEmailOrEditIt() throws Exception {
        User admin = users.findByUsername("admin").orElseThrow();
        User friend = users.findByUsername("user1").orElseThrow();
        String adminToken = "Bearer " + tokens.generateTokenFromUsername(admin.getUsername(), admin.getId());
        String friendToken = "Bearer " + tokens.generateTokenFromUsername(friend.getUsername(), friend.getId());

        JsonNode ownBefore = json.readTree(mvc.perform(get("/api/users/me/profile")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertEquals(admin.getEmail(), ownBefore.path("email").asText());

        mvc.perform(patch("/api/users/me/profile")
                        .header("Authorization", adminToken)
                        .contentType("application/json")
                        .content("{\"displayName\":\"Tên mới\",\"avatarUrl\":\"https://example.com/avatar.png\",\"bio\":\"Xin chào\",\"email\":\"changed@example.com\"}"))
                .andExpect(status().isOk());

        JsonNode publicProfile = json.readTree(mvc.perform(get("/api/users/{id}/profile", admin.getId())
                        .header("Authorization", friendToken))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertEquals("Tên mới", publicProfile.path("displayName").asText());
        assertEquals("Xin chào", publicProfile.path("bio").asText());
        assertTrue(publicProfile.path("email").isNull());
        assertEquals(admin.getEmail(), users.findById(admin.getId()).orElseThrow().getEmail());

        JsonNode search = json.readTree(mvc.perform(get("/api/users")
                        .header("Authorization", friendToken))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertFalse(search.toString().contains(admin.getEmail()));

        mvc.perform(patch("/api/users/{id}/profile", admin.getId())
                        .header("Authorization", friendToken)
                        .contentType("application/json")
                .content("{\"displayName\":\"Should fail\"}"))
                .andExpect(status().isMethodNotAllowed());
        assertEquals("Tên mới", users.findById(admin.getId()).orElseThrow().getDisplayName());
    }
}
