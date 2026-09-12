package com.chatapp.payload;

import com.chatapp.model.RoomType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreateRoomRequest {
    private String name;

    @NotNull(message = "Room type is required")
    private RoomType type;

    // List of user IDs to include as initial room members
    private List<Long> memberIds;
}

