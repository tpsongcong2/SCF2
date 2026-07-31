# Khôi phục mật khẩu Admin bằng email

Tính năng này hoạt động riêng với cách đăng nhập hiện tại. Không cần đổi
`SCF_SERVER_AUTH_ENABLED` sang `true`.

## Chuẩn bị

1. Trong hồ sơ nhân viên Admin, nhập đúng email khôi phục và lưu lại.
2. Tạo tài khoản gửi thư tại Resend, xác minh tên miền gửi thư và lấy API key.
3. Trong Supabase SQL Editor, chạy:

   `supabase/migrations/20260730_admin_password_recovery.sql`

4. Cấu hình secret cho Edge Function:

   ```powershell
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxx
   supabase secrets set SCF_RESET_FROM="SCF <no-reply@ten-mien-cua-ban.vn>"
   supabase secrets set SCF_ALLOWED_ORIGINS="https://tpsongcong2.github.io,null"
   ```

   `null` cho phép thử app đang mở trực tiếp bằng `file:///`. Khi chỉ dùng bản
   online, có thể bỏ `null`.

5. Phát hành lại Edge Function:

   ```powershell
   supabase functions deploy scf-auth --no-verify-jwt
   ```

## Cách sử dụng

Tại màn hình đăng nhập, chọn **Admin quên mật khẩu?**, nhập tên đăng nhập Admin,
nhận mã 6 số qua email rồi đặt mật khẩu mới.

## Quy tắc bảo mật

- Chỉ tài khoản có vai trò `admin` hoặc `administrator` được khôi phục.
- Mã có hiệu lực 10 phút, dùng một lần và bị khóa sau 5 lần nhập sai.
- Chỉ được yêu cầu một mã trong mỗi 60 giây.
- Cơ sở dữ liệu chỉ lưu mã đã băm, không lưu mã OTP dạng đọc được.
- API luôn trả thông báo chung ở bước gửi mã để không làm lộ tên đăng nhập hoặc
  email Admin.
- Mật khẩu mới được băm PBKDF2-SHA256 trước khi ghi vào dữ liệu nhân viên.
