package com.chatapp.payload;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {
    @NotBlank(message = "Tên hiển thị không được để trống")
    @Size(max = 80, message = "Tên hiển thị không được vượt quá 80 ký tự")
    private String displayName;

    @Size(max = 500, message = "URL ảnh đại diện không được vượt quá 500 ký tự")
    private String avatarUrl;

    @Size(max = 500, message = "Giới thiệu không được vượt quá 500 ký tự")
    private String bio;
}
