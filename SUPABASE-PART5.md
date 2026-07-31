# Phần 5 - Xác thực máy chủ nhưng giữ tên đăng nhập

Ứng dụng đã có sẵn mã chuyển tiếp sang Supabase Auth qua Edge Function `scf-auth`. Không bật cờ xác thực máy chủ trước khi hoàn thành bước 1-3 dưới đây.

## Trình tự triển khai an toàn

1. Sao lưu dòng `scf_employees` và toàn bộ bảng `kv_store` trong Supabase.
2. Chạy file `supabase/migrations/20260713_part5_01_auth_tables.sql` trong SQL Editor. File này chỉ tạo bảng ánh xạ tài khoản và nhật ký đăng nhập sai, chưa khóa ứng dụng cũ.
3. Tạo/deploy Edge Function tên `scf-auth` từ `supabase/functions/scf-auth/index.ts`. Function đăng nhập phải cho phép lời gọi chưa có JWT (`verify_jwt = false`). Đặt secret `SCF_ALLOWED_ORIGINS=https://scfood.vn,https://www.scfood.vn`.
4. Thử gọi function bằng tài khoản Admin hiện tại. Lần đăng nhập đầu tiên sẽ tạo tài khoản Supabase Auth tương ứng nhưng người dùng vẫn nhập tên đăng nhập cũ.
5. Đổi `SCF_SERVER_AUTH_ENABLED=false` thành `true` trong `server-auth.js`, rồi phát hành website.
6. Đăng nhập thử trên `https://scfood.vn`. Không kiểm tra bước này bằng `file:///...` vì chính sách CORS chỉ cho phép tên miền website.
7. Chỉ sau khi bước 6 thành công, chạy `supabase/migrations/20260731_role_based_kv_rls.sql`. Migration này thay thế chính sách khóa cũ, chặn người chưa đăng nhập, không cho trình duyệt đọc trực tiếp `scf_employees`, giới hạn khóa được ghi theo vai trò và khóa thao tác ảnh đối với tài khoản ẩn danh.
8. Kiểm tra lại: đăng xuất, mở cửa sổ ẩn danh, xác nhận dữ liệu không tải; sau đó đăng nhập lại và thử thêm/sửa một bản ghi.

## Cơ chế chuyển tiếp

- Tên đăng nhập của nhân viên không thay đổi.
- Edge Function kiểm tra mật khẩu cũ ở phía máy chủ, kể cả mật khẩu PBKDF2 đã tồn tại trong giai đoạn chuyển đổi.
- Tài khoản Supabase Auth được tạo tự động khi người dùng đăng nhập thành công lần đầu.
- Sau đó Supabase cấp access token và trình duyệt dùng token này khi đọc/ghi dữ liệu.
- Đăng nhập sai quá 8 lần trong 15 phút từ cùng địa chỉ sẽ bị tạm chặn.

## Không được làm

- Không đưa `SUPABASE_SERVICE_ROLE_KEY` vào `storage.js`, `server-auth.js` hoặc bất kỳ file web nào.
- Không chạy migration `20260731_role_based_kv_rls.sql` trước khi Edge Function mới và chế độ đăng nhập máy chủ hoạt động.
- Không bật `SCF_SERVER_AUTH_ENABLED` trên bản đang dùng nếu chưa sao lưu dữ liệu.

Tài liệu tham khảo: https://supabase.com/docs/guides/functions, https://supabase.com/docs/guides/database/postgres/row-level-security

## Khôi phục mật khẩu Admin

Cơ chế OTP email dành riêng cho Admin được mô tả trong
`ADMIN-PASSWORD-RECOVERY.md`. Có thể triển khai cơ chế này mà chưa cần bật toàn
bộ xác thực máy chủ.
