# Realtime Chat Application

## 1. Giới thiệu Tổng quan

**Realtime Chat Application** là hệ thống ứng dụng nhắn tin thời gian thực hoàn chỉnh, được xây dựng theo kiến trúc Client - Server hiện đại:

- **Backend**: Spring Boot 3 (Java 21), Spring Security, Spring WebSocket (STOMP), Spring Data JPA.
- **Frontend**: React 18, Vite, TailwindCSS, `@stomp/stompjs`, `sockjs-client`, `lucide-react`.
- **Database**: MySQL (cấu hình tự động khởi tạo cơ sở dữ liệu `chatapp_db`) kèm profile H2 in-memory dự phòng.
- **Bảo mật & Xác thực**: JSON Web Token (JWT) được bảo vệ hai lớp trên cả HTTP REST APIs và STOMP WebSocket frames (`CONNECT`).

---

## 2. Cấu trúc Dự án

```text
Realtime_ChatApp/
├── backend/                                # Mã nguồn Backend (Spring Boot 3 + Java 21)
│   ├── pom.xml                             # Cấu hình thư viện Maven
│   └── src/
│       ├── main/
│       │   ├── java/com/chatapp/
│       │   │   ├── config/                 # Cấu hình WebSocket, STOMP & Interceptor JWT
│       │   │   ├── controller/             # REST APIs (Auth, Room, User) & WebSocket Controller (Chat)
│       │   │   ├── event/                  # Bắt sự kiện Online/Offline qua WebSocket
│       │   │   ├── model/                  # Entity: User, Role, ChatRoom, RoomMember, Message
│       │   │   ├── payload/                # Các DTO Request/Response
│       │   │   ├── repository/             # Spring Data JPA Repositories
│       │   │   ├── security/               # Xử lý JWT, SecurityConfig, UserDetailsService
│       │   │   └── service/                # Business logic: Auth, Room, Message, User
│       │   └── resources/
│       │       ├── application.yml         # File cấu hình Server, MySQL, JWT, CORS
│       │       └── schema.sql              # Script DDL tạo bảng cơ sở dữ liệu
│       └── test/
├── frontend/                               # Mã nguồn Frontend (React + Vite + TailwindCSS)
│   ├── package.json                        # Cấu hình thư viện npm
│   ├── vite.config.js                      # Cấu hình Vite & Proxy
│   ├── tailwind.config.js                  # Cấu hình giao diện TailwindCSS
│   └── src/
│       ├── components/
│       │   ├── auth/                       # Giao diện Đăng nhập / Đăng ký (AuthPage)
│       │   └── chat/                       # Dashboard, Sidebar, ChatArea, RoomDetails, CreateRoomModal
│       ├── services/                       # API Axios, Auth, Chat và WebSocket STOMP Client
│       ├── App.jsx                         # Điều hướng trạng thái đăng nhập
│       └── main.jsx                        # Entry point React
├── start-backend.bat                       # Script chạy nhanh Backend (Windows)
├── start-frontend.bat                      # Script chạy nhanh Frontend (Windows)
└── README.md                               # Hướng dẫn dự án
```

## ##Cách doawload dự án

Link git :https://github.com/MinhNguyen592005/Realtime_Chatapp.git

## 3. Các Tính Năng Nổi Bật

- **Xác thực & Bảo mật (JWT + BCrypt)**:
  - Đăng ký và đăng nhập an toàn, mật khẩu được băm bằng `BCryptPasswordEncoder`.
  - **Quy định mật khẩu chặt chẽ**: Tối thiểu 8 ký tự và phải chứa ít nhất 1 ký tự đặc biệt (`!@#$%^&*...`).
  - **Kiểm tra định dạng email**: Ngăn chặn các địa chỉ email không hợp lệ.
  - **Tính năng Quên mật khẩu (OTP Reset)**: Khôi phục mật khẩu dễ dàng qua mã xác thực OTP 6 số (hiệu lực 15 phút).
  - Toàn bộ thông báo lỗi và phản hồi được Việt hóa rõ ràng, dễ hiểu.
- **Nhắn tin Thời gian thực (Realtime Chat)**:
  - Giao tiếp tức thời qua giao thức WebSocket STOMP (`/topic/room.{roomId}`).
  - Hỗ trợ cả trò chuyện 1-1 (Direct Chat) và nhóm chat nhiều người (Group Chat).
  - Tự động cuộn xuống tin nhắn mới nhất (Auto scroll to bottom).
- **Trạng thái & Trải nghiệm (UX)**:
  - Hiệu ứng người dùng đang gõ tin nhắn (Typing Indicator: `"... is typing..."`).
  - Tự động phát hiện và đồng bộ trạng thái Online / Offline khi kết nối hoặc ngắt kết nối.
- **Quản lý Phòng chat & Phân quyền**:
  - Trưởng phòng (`ADMIN_ROOM`) có quyền thêm thành viên hoặc mời ra khỏi nhóm (Kick).
  - Thành viên có thể tự do rời phòng chat khi không còn nhu cầu.

---

## 4. Cách Chạy Dự Án

### Bước 1: Chuẩn bị Cơ sở dữ liệu (MySQL)

- Đảm bảo MySQL server đang chạy trên máy (`localhost:3306`).
- Tài khoản mặc định trong `backend/src/main/resources/application.yml`:
  - **User**: `root` | **Password**: `root` _(có thể đổi theo máy của bạn)_.
  - Cơ sở dữ liệu `chatapp_db` sẽ được backend tự tạo tự động khi chạy.

> 💡 **Mẹo:** Nếu bạn chưa bật MySQL và muốn kiểm thử ngay lập tức, bạn có thể chạy Backend bằng profile H2 in-memory:
>
> ```bash
> cd backend
> mvn spring-boot:run -Dspring-boot.run.profiles=h2
> ```

### Bước 2: Khởi chạy Backend (Spring Boot)

- **Cách 1**: Nhấp đúp vào file `start-backend.bat`.
- **Cách 2**: Mở terminal tại thư mục dự án và chạy:
  ```bash
  cd backend
  mvn spring-boot:run
  ```
  _Backend sẽ hoạt động tại: `http://localhost:8080`_.

### Bước 3: Khởi chạy Frontend (React)

- **Cách 1**: Nhấp đúp vào file `start-frontend.bat`.
- **Cách 2**: Mở một cửa sổ terminal mới và chạy:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
  _Frontend sẽ hoạt động tại: `http://localhost:5173`_.

### Bước 4: Tài khoản Mẫu có sẵn (Default Accounts)

Khi Backend khởi chạy lần đầu, hệ thống đã tự động tạo sẵn 2 tài khoản:

| Tài khoản    | Username | Password   | Email               | Vai trò                   |
| :----------- | :------- | :--------- | :------------------ | :------------------------ |
| **Admin**    | `admin`  | `admin123` | `admin@chatapp.com` | `ROLE_ADMIN`, `ROLE_USER` |
| **User mẫu** | `user1`  | `user123`  | `user1@chatapp.com` | `ROLE_USER`               |

> Bạn có thể dùng ngay tài khoản `admin` / `admin123` để đăng nhập mà không cần đăng ký, hoặc tạo thêm bất kỳ tài khoản mới nào tùy ý!

### Bước 5: Trải nghiệm & Kiểm thử Realtime

1. Đăng nhập tài khoản `admin` trên trình duyệt chính.
2. Mở một cửa sổ trình duyệt **Ẩn danh (Incognito)**, truy cập `http://localhost:5173` và đăng nhập tài khoản `user1` (hoặc tạo tài khoản mới).
3. Tạo phòng chat hoặc nhắn tin qua lại để kiểm tra tính năng thời gian thực.
