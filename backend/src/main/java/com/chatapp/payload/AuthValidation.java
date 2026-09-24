package com.chatapp.payload;

public final class AuthValidation {
    public static final String EMAIL_REGEX = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,63}$";
    public static final String PASSWORD_REGEX =
            "^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9\\s])\\S{8,64}$";
    public static final String PASSWORD_MESSAGE =
            "Mật khẩu phải dài 8-64 ký tự, có chữ cái, chữ số, ký tự đặc biệt và không có khoảng trắng";

    private AuthValidation() {
    }
}
