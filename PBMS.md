# Parking Manager

## QUẢN LÝ THÔNG TIN TÒA NHÀ GỬI XE

**1\. Thông tin chung (General Information)**

* **Mã Use Case:** UC-MNG01  
* **Tên Use Case:** Quản lý Thông tin Cơ sở Tòa nhà (Building Profile Management)  
* **Tác nhân (Actor):** Quản lý Bãi xe (Manager)  
* **Mô tả ngắn gọn:** Cho phép Manager thiết lập và cập nhật các thông tin định danh mang tính toàn cục của bãi giữ xe. Các thông tin này sẽ được sử dụng làm dữ liệu gốc để in lên Hóa đơn, Vé điện tử (QR Code), Nội dung Email và hiển thị trên giao diện Đặt chỗ của Khách hàng.

**2\. Tiền điều kiện (Preconditions)**

* Manager đã đăng nhập thành công vào hệ thống với phân quyền MANAGER.  
* Đang ở giao diện Thiết lập Tòa nhà (Building Settings).

**3\. Luồng sự kiện chính (Main Success Scenario / Happy Path)**

* **Bước 1:** Manager truy cập vào menu "Thông tin Tòa nhà".  
* **Bước 2:** Hệ thống truy xuất cơ sở dữ liệu và hiển thị Form thông tin hiện tại của tòa nhà. Nếu là lần đầu tiên thiết lập, Form sẽ ở trạng thái trống.  
* **Bước 3:** Manager tiến hành nhập hoặc chỉnh sửa các trường thông tin cơ bản:  
  * Tên Tòa nhà / Bãi xe (Ví dụ: F-Town 3 Parking).  
  * Địa chỉ chi tiết.  
  * Hotline Hỗ trợ (Số điện thoại để khách gọi khi gặp sự cố tại cổng).  
  * Giờ vận hành (Operating Hours) (Ví dụ: 24/7 hoặc 06:00 \- 23:00).  
  * Nội quy bãi xe (Terms & Conditions) (Văn bản quy định đền bù, giới hạn tốc độ).  
* **Bước 4:** Manager bấm nút "Lưu Thay Đổi" (Save Changes).  
* **Bước 5:** Hệ thống tiến hành kiểm tra tính hợp lệ của dữ liệu (Validation).  
* **Bước 6:** Hệ thống ghi nhận cập nhật vào cơ sở dữ liệu.  
* **Bước 7:** Hệ thống hiển thị thông báo "Cập nhật thông tin tòa nhà thành công" và áp dụng dữ liệu mới lên toàn bộ các phân hệ liên quan (Web khách hàng, Mẫu in hóa đơn).

**4\. Luồng ngoại lệ & Luồng thay thế (Alternative / Exception Flows)**

* **4.1. Bỏ trống thông tin bắt buộc (Missing Mandatory Fields):**  
  * *Tại Bước 5:* Nếu Manager bỏ trống các trường trọng yếu như Tên tòa nhà hoặc Hotline.  
  * *Xử lý:* Hệ thống chặn thao tác lưu, bôi đỏ các trường bị thiếu và hiển thị cảnh báo: *"Vui lòng không bỏ trống thông tin bắt buộc"*.  
* **4.2. Sai định dạng dữ liệu (Invalid Data Format):**  
  * *Tại Bước 5:* Nếu trường Hotline chứa ký tự chữ cái hoặc số lượng chữ số không hợp lệ.  
  * *Xử lý:* Hệ thống báo lỗi: *"Số điện thoại Hotline không hợp lệ, vui lòng kiểm tra lại"*.

**5\. Quy tắc nghiệp vụ (Business Rules / Constraints)**

* **BR-01 (Mô hình Singleton trong Database):** Vì hệ thống PBMS này được xây dựng để phục vụ cho **một tòa nhà cụ thể**, bảng building\_profile trong Database chỉ được phép chứa **duy nhất 01 bản ghi (record)**. Thao tác của Manager ở Use Case này về bản chất luôn là thao tác Cập nhật (UPDATE), tuyệt đối không có thao tác Thêm mới tạo ra tòa nhà thứ 2 (INSERT) hay Xóa tòa nhà (DELETE).  
* **BR-02 (Cập nhật Thời gian thực \- Realtime Rendering):** Bất kỳ thay đổi nào về "Nội quy bãi xe" hoặc "Hotline" phải được tự động cập nhật ngay lập tức vào phần chân trang (Footer) của hệ thống gửi Email (khi khách Booking) mà không cần can thiệp vào code.

**6\. Hậu điều kiện (Postconditions)**

* Toàn bộ thông tin định danh của tòa nhà được lưu trữ thành công.  
* Hành động cập nhật được lưu vết vào hệ thống Audit Log để Admin có thể theo dõi.

### 

## QUẢN LÝ LOẠI PHƯƠNG TIỆN

**1\. Thông tin chung (General Information)**

* **Mã Use Case:** UC-MNG02  
* **Tên Use Case:** Quản lý Danh mục Loại phương tiện (Vehicle Type Management)  
* **Tác nhân (Actor):** Quản lý Bãi xe (Manager)  
* **Mô tả ngắn gọn:** Cho phép Manager định nghĩa, thêm mới, chỉnh sửa hoặc vô hiệu hóa các loại phương tiện được phép gửi tại tòa nhà. Đặc biệt, Use Case này đóng vai trò thiết lập kích thước gốc (tính bằng số lượng ô lưới) cho từng loại xe để làm cơ sở render bản đồ sau này.

**2\. Tiền điều kiện (Preconditions)**

* Manager đã đăng nhập hệ thống thành công với phân quyền MANAGER.  
* Đang ở giao diện Danh mục Phương tiện (Vehicle Categories).

**3\. Luồng sự kiện chính (Main Success Scenario / Happy Path)**

* **Bước 1:** Manager truy cập màn hình "Quản lý Loại phương tiện". Hệ thống truy xuất cơ sở dữ liệu và hiển thị danh sách các loại xe hiện có dưới dạng bảng.  
* **Bước 2 (Thêm mới):** Manager bấm nút "Thêm Loại Xe Mới" (Add New Vehicle Type).  
* **Bước 3:** Hệ thống hiển thị Form khai báo. Manager tiến hành nhập các trường thông tin:  
  * Mã loại xe (Vehicle Code): Mã định danh viết liền không dấu (VD: CAR-4S, MOTO-E).  
  * Tên hiển thị (Display Name): (VD: Ô tô 4 chỗ, Xe máy tay ga).  
  * **Kích thước Slot tiêu chuẩn (Grid Cell Dimensions)**:  
    * Chiều ngang (Width): Số phần tử ô lưới trên ma trận (VD: Nhập 3 ô).  
    * Chiều dọc (Height): Số phần tử ô lưới trên ma trận (VD: Nhập 5 ô).  
  * Thuộc tính xe điện (Is EV): Checkbox đánh dấu nếu đây là loại xe cần dùng trạm sạc điện.  
  * Biểu tượng (Icon): Chọn biểu tượng (ô tô/xe máy) để hiển thị lên UI/UX của khách hàng.  
* **Bước 4:** Manager bấm nút "Lưu" (Save).  
* **Bước 5:** Hệ thống kiểm tra tính hợp lệ và sự trùng lặp của Mã loại xe.  
* **Bước 6:** Hệ thống lưu bản ghi vào Database.  
* **Bước 7:** Hệ thống hiển thị thông báo "Thêm loại phương tiện thành công" và load lại bảng danh sách với trạng thái loại xe vừa tạo là Hoạt động (Active).

**4\. Luồng ngoại lệ & Luồng thay thế (Alternative / Exception Flows)**

* **4.1. Trùng lặp Mã loại xe (Duplicate Code):**  
  * *Tại Bước 5:* Nếu Manager nhập một mã code đã tồn tại trong hệ thống (kể cả với loại xe đang bị khóa).  
  * *Xử lý:* Hệ thống chặn hành động lưu, bôi đỏ trường nhập liệu và hiển thị cảnh báo: *"Mã loại xe này đã tồn tại, vui lòng nhập mã định danh khác."*  
* **4.2. Khóa/Vô hiệu hóa Loại xe (Deactivate):**  
  * *Tại Bước 2:* Manager chọn một loại xe đang hoạt động và bấm "Khóa (Deactivate)".  
  * *Xử lý:* Hệ thống hiển thị Popup xác nhận. Nếu Manager bấm Đồng ý, trạng thái của bản ghi chuyển sang Ngừng hoạt động (Inactive).

**5\. Quy tắc nghiệp vụ (Business Rules / Constraints)**

* **BR-01 (Tham chiếu Ma Trận \- Matrix Binding):** Kích thước Width và Height (tính bằng số ô lưới) khai báo tại Use Case này là hằng số gốc. Khi Manager thực hiện kéo thả tạo Slot đỗ xe ở các chức năng bản đồ sau này, Front-end Canvas sẽ tự động bắt dính (Snap) và vẽ ra một khối hình chữ nhật chiếm diện tích chính xác đúng bằng số lượng phần tử ô lưới đã thiết lập ở đây.  
* **BR-02 (Toàn vẹn Dữ liệu Lịch sử \- Soft Delete):** Hệ thống không có chức năng "Xóa vĩnh viễn" (Hard Delete) để bảo vệ dữ liệu kế toán. Loại xe bị chuyển sang Inactive sẽ bị ẩn khỏi màn hình Đặt chỗ (Booking) của khách hàng và màn hình Cấu hình Bảng giá, nhưng vẫn xuất hiện bình thường trong các báo cáo doanh thu của những tháng trước đó.  
* **BR-03 (Ràng buộc Khóa ngoại \- Foreign Key Constraint):** Hệ thống chặn thao tác "Khóa" một loại phương tiện nếu đang có xe thuộc loại đó đang đỗ trong bãi (Active Session \> 0).

**6\. Hậu điều kiện (Postconditions)**

* Danh mục phương tiện được hệ thống cập nhật thành công.  
* Các loại phương tiện có trạng thái Active lập tức khả dụng tại các dropdown menu ở phân hệ Quản lý Phân tầng, Quản lý Bảng giá và App/Web Đặt chỗ của Khách hàng.

## QUẢN LÝ PHÂN TẦNG, KHU VỰC VÀ TỰ ĐỘNG SINH SLOT

**1\. Thông tin chung (General Information)**

* **Mã Use Case:** UC-MNG03  
* **Tên Use Case:** Quản lý Phân tầng, Thiết lập Khu vực (Zone) và Tự động sinh Slot  
* **Tác nhân (Actor):** Quản lý Bãi xe (Manager)  
* **Mô tả ngắn gọn:** Cho phép Manager khởi tạo mặt bằng các Tầng dựa trên ma trận lưới 2D kèm theo đặc tính chuyên dụng (Tầng Ô tô hoặc Tầng Xe nhỏ). Sau đó, quy hoạch không gian bằng cách tạo các Khu vực (Zone) với các thuộc tính nghiệp vụ (Vãng lai, Vi phạm). Hệ thống áp dụng quy tắc 1 Zone \- 1 Loại xe, tự động sinh Khối bóng ma (Ghost Zone) để Manager kéo thả, xoay chiều và co giãn số lượng Slot linh hoạt trên bản đồ.

**2\. Tiền điều kiện (Preconditions)**

* Manager đã đăng nhập hệ thống với phân quyền MANAGER.  
* Danh mục Loại phương tiện (UC-MNG02) đã được thiết lập (Ví dụ: Các loại xe được gán nhãn nhóm CAR hoặc SMALL\_VEHICLE).

**3\. Luồng sự kiện chính (Khởi tạo Tầng & Thêm Zone mới)**

* **Bước 1 (Khởi tạo Tầng):** Manager truy cập "Quản lý Mặt bằng", bấm "Thêm Tầng Mới". Hệ thống yêu cầu nhập:  
  * Tên tầng: VD: Hầm B1.  
  * Kích thước lưới: VD: 100 x 100 ô.  
  * **Đặc tính Tầng (Floor Category):** Chọn 1 trong 2 tùy chọn: Dành riêng Ô tô (CAR\_ONLY) hoặc Hỗn hợp Xe nhỏ (MIXED\_SMALL).  
* **Bước 2 (Khai báo Zone):** Tại Tầng vừa tạo, Manager bấm "Thêm Khu vực (Zone)". Hệ thống hiển thị Form cấu hình:  
  * Tên Khu vực: VD: Khu A \- Ô tô Vãng lai.  
  * Loại hình nghiệp vụ (Zone Type): Chọn WALK\_IN (Vãng lai) hoặc IMPOUNDED (Xe vi phạm).  
  * **Loại phương tiện:** Chọn một loại xe cụ thể (VD: CAR-4S). Hệ thống tự động lọc Dropdown này dựa trên Đặc tính Tầng (VD: Tầng CAR\_ONLY sẽ không hiện các loại xe máy để chọn).  
  * Số lượng Slot ban đầu: VD: 10\.  
* **Bước 3 (Tự động tính toán & Ghost Zone):** Hệ thống lập tức nhân bản kích thước chuẩn của loại xe vừa chọn, tạo ra một **Khối bóng ma (Ghost Zone)** chứa sẵn 10 ô đỗ.  
* **Bước 4 (Kéo thả & Xoay):** Khối bóng ma xuất hiện và bám theo tọa độ con trỏ chuột. Manager bấm phím tắt R (Rotate) để đảo chiều xếp của Zone (Ngang/Dọc).  
* **Bước 5 (Hạ cánh):** Manager click chuột trái (Drop) vào vùng không gian trống trên lưới. Ghost Zone chuyển thành **Khối vật lý cố định (Solid Zone)**.  
* **Bước 6 (Lưu Bản Vẽ):** Manager bấm "Lưu Thiết Kế".  
* **Bước 7 (Cập nhật DB):** Hệ thống đóng gói tọa độ, sinh tự động danh sách các Slot đỗ xe chi tiết (VD: B1-ZA-01) lưu vào Database.

**4\. Luồng sự kiện Cập nhật (Co giãn số lượng Slot cho Zone có sẵn)**

* **Bước 1:** Trên bản đồ, Manager click vào một Zone đã tồn tại.  
* **Bước 2:** Chỉnh sửa thông số tại trường Số lượng Slot.  
* **Bước 3 (Thêm Slot):** Nếu tăng số lượng $\\rightarrow$ Hệ thống tự động mọc thêm Slot mới ở phần "Đuôi" của Zone (Cạnh Phải nếu Zone xếp ngang, Cạnh Dưới nếu Zone xếp dọc).  
* **Bước 4 (Bớt Slot):** Nếu giảm số lượng $\\rightarrow$ Hệ thống tự động cắt bỏ Slot ở phần "Đuôi".  
* **Bước 5:** Bấm "Lưu Thiết Kế" để cập nhật Database.

**5\. Luồng ngoại lệ (Exception Flows)**

* **5.1. Vị trí hạ cánh chồng chéo:**  
  * *Xử lý:* Nếu Manager thả Ghost Zone đè lên vật cản hoặc Zone khác, hệ thống nháy viền đỏ Khối bóng ma,  chặn thao tác thả.  
* **5.2. Vi phạm Đặc tính Tầng (Bắt lỗi Backend):**  
  * *Xử lý:* Nếu có hành vi can thiệp API cố tình đẩy một Zone chứa Xe máy vào Tầng CAR\_ONLY, Backend lập tức từ chối request, trả mã HTTP 400 Bad Request và thông báo lỗi cấu trúc.  
* **5.3. Xóa/Thu hẹp Slot đang có xe:**  
  * *Xử lý:* Khi giảm số lượng Slot, nếu ô đỗ bị cắt bỏ đang ở trạng thái OCCUPIED (Có xe) hoặc BOOKED (Đã đặt trước), Backend sẽ chặn thao tác Lưu và cảnh báo: *"Không thể cắt giảm không gian do Slot cuối đang có xe đỗ. Vui lòng giải phóng ô đỗ trước."*

**6\. Quy tắc nghiệp vụ & Ràng buộc Kỹ thuật (Business Rules / Constraints)**

* **BR-01 (Quy tắc Tách biệt Tầng \- Floor Separation Rule):**  
  * Tầng được gắn nhãn CAR\_ONLY chỉ được phép chứa các loại xe thuộc nhóm Ô tô.  
  * Tầng gắn nhãn MIXED\_SMALL được phép chứa nhiều loại xe nhỏ khác nhau (Xe số, Xe tay ga, Xe đạp điện) cùng lúc, nhưng không được chứa Ô tô.  
* **BR-02 (Quy tắc Đơn phương tiện \- Single Vehicle Type per Zone):** Mỗi một Zone được vẽ ra chỉ được phép chứa **duy nhất 01** Loại phương tiện (Khai báo ở Bước 2). Mọi Slot sinh ra trong Zone đó bắt buộc đồng nhất về kích thước và đặc tính. Nếu muốn tạo bãi xe hỗn hợp, Manager phải tạo nhiều Zone riêng biệt đặt cạnh nhau.  
* **BR-03 (Quy định Loại hình Nghiệp vụ Zone):**  
  * WALK\_IN: Nhận xe vãng lai (Auto-routing) và cho phép Đặt chỗ trực tuyến (Booking).  
  * IMPOUNDED: Khu biệt lập lưu giữ xe vi phạm (Blacklist). Không tự động điều xe vào, chỉ nhận xe qua thao tác "Điều xe thủ công" của nhân viên.  
* **BR-04 (Cơ chế Co giãn LIFO \- Tail Truncation):** Việc cộng/trừ Slot của Zone phải tuân thủ tuần tự LIFO (Vào sau ra trước) từ điểm cuối (Phần Đuôi) của trục nhằm bảo toàn hình khối chữ nhật của Zone, tuyệt đối không dùng thao tác xóa ngẫu nhiên giữa mảng.  
* **BR-05 (Định danh Slot Tự động):** ID Slot sinh tự động theo quy tắc \[Mã Tầng\]-\[Mã Zone\]-\[Số thứ tự\]. Trạng thái mặc định luôn là AVAILABLE.  
* **BR-06 (Quy tắc Lưu Trữ Gộp \- Single Commit):** Mọi thao tác kéo, thả, xoay, thêm, bớt trên bản đồ chỉ xử lý logic trên Frontend. Hành động gọi API Database chỉ xảy ra duy nhất khi Manager nhấn "Lưu Thiết Kế".

**7\. Hậu điều kiện (Postconditions)**

* Cơ sở dữ liệu ghi nhận cấu trúc Tầng (Floor) và các Khu vực (Zone) hoàn toàn tuân thủ chặt chẽ quy định phân luồng xe tĩnh.  
* Các Slot đỗ xe được khởi tạo thành công, sẵn sàng liên kết với các luồng Thuật toán Auto-routing và Đặt chỗ trực tuyến.

### 

## GIÁM SÁT VÀ QUẢN LÝ TRẠNG THÁI SLOT ĐỖ XE

**1\. Thông tin chung (General Information)**

* **Mã Use Case:** UC-MNG04  
* **Tên Use Case:** Giám sát Thời gian thực và Quản lý Trạng thái Slot (Real-time Slot Status Management)  
* **Tác nhân (Actor):** Quản lý Bãi xe (Manager), Nhân viên Bảo vệ (Staff)  
* **Mô tả ngắn gọn:** Cung cấp cho người dùng một bản đồ trực quan thời gian thực để theo dõi tình trạng của từng ô đỗ xe thông qua mã màu. Đồng thời, Use Case này cho phép can thiệp thủ công để chuyển trạng thái Slot sang bảo trì/tạm khóa, hoặc thực hiện nghiệp vụ "Điều phối thủ công" để dịch chuyển trạng thái vị trí xe trên hệ thống khi có sự cố khách hàng đỗ sai ô thực tế.

**2\. Tiền điều kiện (Preconditions)**

* Người dùng (Manager/Staff) đã đăng nhập thành công vào hệ thống với tài khoản hợp lệ.  
* Sơ đồ mặt bằng lưới và danh sách các ô đỗ xe (Slots) đã được khởi tạo thành công từ phân hệ thiết kế mặt bằng (UC-MNG03).

**3\. Luồng sự kiện chính (Main Success Scenario / Happy Path)**

* **Bối cảnh 1: Giám sát và Cấu hình Bảo trì**  
  * **Bước 1:** Người dùng truy cập vào màn hình "Giám sát Bản đồ" (Live Map Dashboard).  
  * **Bước 2:** Chọn Tầng muốn giám sát (Ví dụ: Hầm B1).  
  * **Bước 3:** Hệ thống truy xuất cơ sở dữ liệu và hiển thị sơ đồ 2D của tầng đó dưới dạng ma trận. Các Slot đỗ xe tự động hiển thị mã màu tương ứng với trạng thái thời gian thực.  
  * **Bước 4:** Người dùng click vào một Slot trống bất kỳ, chọn hành động "Đưa vào Bảo trì" (Set to Maintenance).  
  * **Bước 5:** Hệ thống cập nhật trạng thái Slot thành MAINTENANCE trong Database và đổi màu hiển thị trên bản đồ sang màu Xám. Hệ thống lập tức loại bỏ Slot này khỏi danh sách phân bổ xe trống.  
* **Bối cảnh 2: Điều phối xe thủ công khi đỗ sai vị trí (Manual Relocation)**  
  * **Bước 6:** Khi phát hiện một chiếc xe đỗ sai thực tế (Hệ thống ghi nhận xe đang ở Slot A màu Đỏ, nhưng thực tế xe đang đỗ tại Slot B màu Xanh), người dùng click chuột vào Slot A.  
  * **Bước 7:** Trong bảng thông tin chi tiết của Slot A, người dùng bấm nút **"Điều xe / Chuyển Slot" (Relocate)**.  
  * **Bước 8 (Trạng thái Pending UI):** Hệ thống lập tức chuyển giao diện sang chế độ chờ gán vị trí (Pending Mode):  
    * Slot A bắt đầu nhấp nháy hiệu ứng (Blinking animation).  
    * Con trỏ chuột đổi hình dạng thành icon mục tiêu.  
    * Xuất hiện thanh thông báo nổi (Banner) ở phía trên màn hình: *"Đang điều phối vị trí mới cho xe \[Biển số\]. Vui lòng chọn một Slot trống trên bản đồ hoặc bấm ESC để hủy."*  
  * **Bước 9:** Người dùng di chuyển chuột và click vào Slot B (Đang có màu Xanh \- Trống).  
  * **Bước 10:** Hệ thống hiển thị một Popup xác nhận: *"Xác nhận dịch chuyển xe từ \[Slot A\] sang \[Slot B\]?"* kèm nút "Xác nhận".  
  * **Bước 11:** Người dùng bấm "Xác nhận". Hệ thống đóng gói dữ liệu và kích hoạt một Transaction xử lý xuống cơ sở dữ liệu.  
  * **Bước 12:** Cập nhật thành công. Giao diện bản đồ lập tức đồng bộ: Slot A chuyển về màu Xanh (Trống) và Slot B chuyển sang màu Đỏ (Đang sử dụng). Thanh Banner biến mất, hệ thống thoát khỏi chế độ Pending.

**4\. Luồng ngoại lệ & Luồng thay thế (Alternative / Exception Flows)**

* **4.1. Thao tác bảo trì không hợp lệ:**  
  * *Tại Bước 4:* Người dùng chọn hành động "Đưa vào Bảo trì" đối với một Slot đang có trạng thái OCCUPIED (Có xe) hoặc BOOKED (Đã đặt trước).  
  * *Xử lý:* Hệ thống chặn thao tác và hiển thị thông báo lỗi: *"Không thể bảo trì Slot này do đang có xe đỗ hoặc đã được đặt trước. Vui lòng giải phóng ô đỗ trước khi khóa."*  
* **4.2. Chọn điểm đến điều phối không hợp lệ:**  
  * *Tại Bước 9:* Trong chế độ Pending, người dùng click vào một Slot mục tiêu đang có trạng thái OCCUPIED hoặc MAINTENANCE.  
  * *Xử lý:* Hệ thống áp dụng hiệu ứng rung lắc (Shake) tại Slot mục tiêu đó để báo lỗi, hiển thị thông báo nhỏ *"Vị trí không khả dụng, vui lòng chọn ô trống khác"* và tiếp tục giữ hệ thống ở chế độ Pending.  
* **4.3. Hủy luồng điều phối xe:**  
  * *Tại Bước 8 hoặc Bước 9:* Người dùng bấm phím ESC trên bàn phím hoặc bấm nút "Hủy thao tác" trên thanh Banner nổi.  
  * *Xử lý:* Hệ thống lập tức thoát chế độ Pending, Slot A ngừng nhấp nháy, con trỏ chuột trở lại bình thường và giữ nguyên mọi dữ liệu cũ.

**5\. Quy tắc nghiệp vụ (Business Rules / Constraints)**

* **BR-01 (Mã màu trạng thái tiêu chuẩn):** Giao diện quản lý bắt buộc phải thể hiện chính xác 4 mã màu đồng nhất:  
  * **Xanh lá (AVAILABLE):** Ô trống, sẵn sàng đón xe.  
  * **Đỏ (OCCUPIED):** Đang có xe đỗ (Nhận tín hiệu tự động từ cảm biến hoặc quét thẻ tại cổng).  
  * **Vàng (BOOKED):** Đã có khách đặt trước qua hệ thống trực tuyến, đang chờ xe đến check-in.  
  * **Xám / Gạch chéo (MAINTENANCE):** Slot bị tạm khóa do sự cố hạ tầng (hỏng cảm biến, rò rỉ nước, bảo trì kỹ thuật).  
* **BR-02 (Cơ chế đồng bộ thời gian thực):** Màn hình Live Map không sử dụng cơ chế tải lại trang (F5). Hệ thống phải sử dụng kết nối liên tục (như WebSockets hoặc Server-Sent Events) để lắng nghe tín hiệu từ cổng và cảm biến. Bất kỳ sự thay đổi trạng thái nào của ô đỗ dưới tầng hầm phải được cập nhật lên màn hình của Manager/Staff trong vòng dưới 1 giây.  
* **BR-03 (Tính toàn nguyên của Giao dịch \- Database Transaction Atomicity):** Đối với nghiệp vụ Điều phối xe thủ công (Bước 11), tầng Backend bắt buộc phải xử lý hai lệnh cập nhật trạng thái trong cùng một Database Transaction:  
  * Giải phóng Slot A: Chuyển trạng thái về AVAILABLE và gỡ bỏ liên kết Session\_ID.  
  * Chiếm dụng Slot B: Chuyển trạng thái thành OCCUPIED và gắn Session\_ID của phiên xe đó vào.  
    Nếu một trong hai lệnh thất bại, toàn bộ tiến trình phải được Rollback lập tức để tránh rủi ro mất dấu xe của khách hoặc gây lỗi sai lệch dữ liệu hệ thống.  
* **BR-04 (Ghi vết lịch sử):** Mọi hành động can thiệp thủ công (Khóa bảo trì, Mở khóa, Điều phối chuyển ô đỗ) đều phải được hệ thống tự động ghi nhật ký vào bảng Audit\_Log để phục vụ công tác đối soát, phòng chống trường hợp nhân viên gian lận hoặc thao tác sai quy trình.

**6\. Hậu điều kiện (Postconditions)**

* Trạng thái và vị trí phân bổ của các ô đỗ xe được cập nhật chính xác tuyệt đối so với thực tế dưới hầm.  
* Cơ chế tự động điều phối xe (Auto Re-routing) ở các Use Case vận hành cổng sẽ dựa trên dữ liệu cập nhật mới này để không điều xe vào các ô vừa bị khóa bảo trì.

## **QUẢN LÝ BẢNG GIÁ VÀ CHÍNH SÁCH TÍNH PHÍ**

**(MÃ PHÂN HỆ: UC-MNG05 \- VISUAL TIMELINE & SLIDING BLOCKS ENGINE)**

### **1\. TỔNG QUAN PHÂN HỆ (MODULE OVERVIEW)**

* **Mã Use Case:** UC-MNG05  
* **Tên Use Case:** Quản lý Bảng giá & Thuật toán Tính phí Đa phân mảnh.  
* **Tác nhân (Actor):** Quản trị viên (Admin/Manager).  
* **Mục tiêu:** Cung cấp giao diện trực quan cho phép Manager định nghĩa các Ca (Shift) trong ngày. Bên trong mỗi Ca, hệ thống tự động sinh ra một thanh thời gian (Timeline) và cho phép Manager "chặt" thanh này thành nhiều Block nối tiếp nhau. Thuật toán tính phí sẽ loại bỏ công thức lũy tiến toán học, thay vào đó là cơ chế **"Trượt" (Slide)**: Xe đỗ chạm vào Block nào sẽ cộng tiền của Block đó. Hệ thống vẫn giữ nguyên Lớp chốt chặn Cơ bản Toàn cảnh ở vòng ngoài cùng.

### **2\. GIAO DIỆN CẤU HÌNH TRỰC QUAN (VISUAL CONFIGURATION UI)**

Giao diện được thiết kế theo dạng Master-Detail kết hợp thanh trượt động (Dynamic Slider).

* **2.1. Lớp cấu hình Toàn cục (Global Level)**  
  * **Bậc Cơ Bản Toàn Cảnh (Global Base):** Cấu hình Số phút (Ví dụ: 120 phút) và Số tiền (Ví dụ: 20.000 VNĐ). Mọi xe đỗ $\\le 120$ phút đều chỉ thu mức giá này, không kích hoạt thuật toán bên dưới.  
  * **Giá Trần Lưu Bãi (Max Parking Cap):** Cấu hình mức cước phí tối đa thu của một xe (Ví dụ: 3.000.000 VNĐ). Mức trần này áp dụng chặn đứng số tiền đối với những xe vãng lai bị bỏ quên hoặc lưu bãi quá lâu.

#### **2.2. Lớp cấu hình Ca và Block (Shift & Block Splitter)**

1. **Thêm Ca (Add Shift):** Manager tạo các ca để lấp đầy 24h. Ví dụ: Tạo Ca Ngày từ 06:00 đến 18:00. Hệ thống tự động nhận diện tổng thời lượng ca này là **12 tiếng (720 phút)**.  
2. **Khởi tạo Block mặc định:** Ngay khi tạo Ca Ngày, hệ thống tự động sinh ra một Block duy nhất kéo dài trọn vẹn 12 tiếng.  
3. **Thao tác "Chặt Block" (Split Block):**  
   * Manager bấm "Thêm phân mảnh" và nhập 120 phút.  
   * Hệ thống tự động chặt thanh 12 tiếng thành 2 khúc nối tiếp nhau:  
     * **Block 1:** Độ dài 120 phút (Manager nhập giá: 20.000 VNĐ).  
     * **Block 2:** Độ dài 600 phút tức 10 tiếng (Manager nhập giá: 50.000 VNĐ).  
   * *Nếu Manager tiếp tục thêm một phân mảnh 60 phút:* Hệ thống tiếp tục chặt Block cuối cùng, kết quả ra 3 khối: Block 1 (120p), Block 2 (60p), Block 3 (540p).  
   * Tổng thời lượng các Block bên trong **luôn luôn bằng tổng độ dài của Ca đó**.

### **3\. KIẾN TRÚC THUẬT TOÁN TÍNH PHÍ CỐT LÕI (THE CORE ENGINE)**

Đường ống (Pipeline) tính toán chạy qua 3 chốt chặn:

#### **LỚP TIỀN XỬ LÝ: BỘ LỌC CƠ BẢN TOÀN CẢNH (GLOBAL BASE INTERCEPTOR)**

Hệ thống tính tổng thời gian đỗ thực tế: \\Delta t \= \\text{check\\\_out\\\_time} \- \\text{check\\\_in\\\_time}.

* **Nếu \\Delta t \\le \\text{Số phút Global Base}:** Ngắt thuật toán. Trả về đúng số tiền của Global Base.  
* **Nếu \\Delta t \> \\text{Số phút Global Base}:** Bỏ qua lớp này. Ném toàn bộ dòng thời gian vào Bước 1\.

#### **BƯỚC 1: MÁY CẮT THEO CA (Helper\_SliceByShift)**

* Hệ thống duyệt dòng thời gian đỗ xe và đối chiếu với các ranh giới Ca (Ví dụ: 06:00 và 18:00).  
* Cứ chạm ranh giới, dòng thời gian bị chặt thành một **Lát cắt Ca (Shift Slice)**.  
* Mỗi Lát cắt lúc này mang 2 thông tin: Thuộc Ca nào và Độ dài bao nhiêu phút. *(Ví dụ: Lát cắt thuộc Ca Ngày, độ dài 200 phút).*

#### **BƯỚC 2: CỖ MÁY TRƯỢT BLOCK (Helper\_SlideBlocks)**

Thuật toán loại bỏ hoàn toàn việc nhân chia làm tròn trần (Progressive Math). Nó lấy Lát cắt Ca (từ Bước 1\) và cho "trượt" qua danh sách các Block đã được cấu hình bên trong Ca đó theo nguyên tắc **Tiêu hao (Consumption)**:  
Cho một vòng lặp chạy qua các Block (đã được sắp xếp theo thứ tự 1, 2, 3...):

1. Nếu \\text{Thời gian Lát cắt còn lại} \> 0:  
   * Cộng tiền của Block hiện tại vào Tổng tiền nháp.  
   * Lấy \\text{Thời gian Lát cắt còn lại} trừ đi \\text{Độ dài của Block hiện tại}.  
   * Chuyển sang Block tiếp theo.  
2. Nếu \\text{Thời gian Lát cắt còn lại} \\le 0: Lát cắt đã được tính xong, thoát vòng lặp.

**BƯỚC 3: TỔNG HỢP VÀ ÁP TRẦN (Main\_CalculateTotalFee)**

* Gom tổng tiền của tất cả các Lát cắt.  
  * Nếu Tổng tiền $\\ge \\text{Giá Trần Lưu Bãi} \\rightarrow$ Xuất hóa đơn bằng Giá Trần Lưu Bãi. Ngược lại xuất đúng số thực tế.

### **4\. KỊCH BẢN KIỂM THỬ ĐIỂN HÌNH (TEST SCENARIOS)**

**Cấu hình giả định:**

* Global Base: 120 phút \= 20.000đ.  
* Ca Ngày (06:00 \- 18:00): Block 1 (120p \= 20.000đ), Block 2 (60p \= 10.000đ), Block 3 (540p \= 30.000đ).  
* Ca Đêm (18:00 \- 06:00): Block 1 (720p \= 50.000đ).

**Kịch bản 1: Đỗ ngắn, bị Lớp Tiền Xử Lý bắt lại**

* *Dữ liệu:* Vào 09:00, Ra 10:30 (Đỗ 90 phút).  
* *Luồng chạy:* 90\\text{p} \\le 120\\text{p} Global Base. Thuật toán kết thúc ngay.  
* *Kết quả:* **20.000 VNĐ**.

**Kịch bản 2: Vượt Global Base, "Trượt" qua các Block trong cùng 1 Ca**

* *Dữ liệu:* Vào 08:00, Ra 12:00 (Đỗ 4 tiếng \= 240 phút).  
* *Luồng chạy:*  
  * Vượt 120p Global Base \\rightarrow Chuyển xuống Máy cắt.  
  * Máy cắt tạo ra 1 Lát cắt thuộc Ca Ngày dài 240 phút.  
  * Helper\_SlideBlocks bắt đầu trượt:  
    * Chạm **Block 1**: Còn 240p \> 0 \\rightarrow Tính **20.000đ**. Tiêu hao 120p. (Còn lại 120p).  
    * Chạm **Block 2**: Còn 120p \> 0 \\rightarrow Tính **10.000đ**. Tiêu hao 60p. (Còn lại 60p).  
    * Chạm **Block 3**: Còn 60p \> 0 \\rightarrow Tính **30.000đ**. Tiêu hao 540p. (Còn lại \< 0, ngưng trượt).  
* *Kết quả:* 20.000 \+ 10.000 \+ 30.000 \= **60.000 VNĐ**.

**Kịch bản 3: Vắt ngang ranh giới Ca**

* *Dữ liệu:* Vào 16:30, Ra 20:30 (Đỗ 4 tiếng \= 240 phút).  
* *Luồng chạy:* Vượt Global Base. Máy cắt tại ranh giới 18:00 tạo ra 2 Lát cắt:  
  * **Lát 1 (Ca Ngày, độ dài 90p từ 16:30-18:00):**  
    * Trượt vào Block 1 của Ca Ngày: Còn 90p \> 0 \\rightarrow Tính **20.000đ**. Tiêu hao 120p (Còn lại \<0, ngưng trượt). Tiền Lát 1 \= 20.000đ.  
  * **Lát 2 (Ca Đêm, độ dài 150p từ 18:00-20:30):**  
    * Trượt vào Block 1 của Ca Đêm: Còn 150p \> 0 \\rightarrow Tính **50.000đ**. Tiêu hao 720p (Ngưng trượt). Tiền Lát 2 \= 50.000đ.  
* *Kết quả:* 20.000 \+ 50.000 \= **70.000 VNĐ**.

### **5\. CẤU TRÚC LƯU TRỮ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)**

Để hỗ trợ giao diện "Chặt Block" và thuật toán "Trượt", Database được thiết kế theo cấu trúc phân cấp 3 tầng (3-Tier Hierarchical Schema).  
**Bảng 1: pricing\_policies (Cấu hình Toàn cục)**

* id (INT, Primary Key)  
* policy\_name (VARCHAR)  
* vehicle\_type (VARCHAR \- CAR, MOTORBIKE)  
* global\_base\_mins (INT \- Số phút Cơ bản toàn cảnh. VD: 120\)  
* global\_base\_fee (DECIMAL \- Mức phí Cơ bản toàn cảnh. VD: 20000\)  
* max\_*parking*\_cap (DECIMAL)  
* status (VARCHAR \- ACTIVE, ARCHIVED)

**Bảng 2: pricing\_shifts (Cấu hình Ca 24h)**

* id (INT, Primary Key)  
* policy\_id (INT, Foreign Key)  
* shift\_name (VARCHAR \- VD: "Ca Ngày", "Ca Đêm")  
* start\_time (TIME \- Điểm bắt đầu ca)  
* end\_time (TIME \- Điểm kết thúc ca)  
* total\_duration\_mins (INT \- Tổng thời lượng của ca, sinh tự động từ start và end)

**Bảng 3: pricing\_blocks (Cấu hình Phân mảnh trượt \- Các Block trong Ca)**

* id (INT, Primary Key)  
* shift\_id (INT, Foreign Key references pricing\_shifts.id)  
* block\_order (INT \- Thứ tự của block để cho vào vòng lặp trượt. VD: 1, 2, 3\)  
* duration\_mins (INT \- Độ dài của khúc Block này do hệ thống UI tự "chặt". VD: 120, 60, 540\)  
* fee (DECIMAL \- Số tiền thu nếu xe trượt trúng Block này. VD: 20000\)

*(**Quy tắc toàn vẹn:** Ở cấp độ Database, Trigger sẽ kiểm tra: SUM(duration\_mins) của tất cả các blocks thuộc về một shift\_id phải LUÔN LUÔN bằng đúng total\_duration\_mins của ca đó).*

## MÀN HÌNH BÁO CÁO DOANH THU (REVENUE DASHBOARD)

Dưới đây là tài liệu thiết kế giao diện (UI/UX) và luồng xử lý dữ liệu hoàn chỉnh cho Tab "Báo cáo Doanh thu". Màn hình được thiết kế theo nguyên tắc "Từ tổng quan đến chi tiết", sử dụng duy nhất một bộ dữ liệu mẹ (Master Dataset) từ Spring Boot để tối ưu hóa hiệu năng render của React.

### **KHU VỰC 1: BỘ ĐIỀU KHIỂN TRUNG TÂM (GLOBAL CONTROL PANEL)**

* **Vị trí:** Cố định (Sticky) ở thanh trên cùng của màn hình.  
* **Thành phần UI:**  
  * Component DateRangePicker (Chọn khoảng thời gian: Từ ngày A đến ngày B).  
  * Nút "Áp dụng" (Apply).  
* **Luồng xử lý (Logic):**  
  * Đây là **bộ lọc duy nhất** chi phối toàn bộ luồng gọi API của Khu vực 2, 3, 4 và 6\.  
  * Khi nhấn "Áp dụng", React gửi Request chứa startDate và endDate xuống Spring Boot. Database chạy một câu lệnh Master Query duy nhất (gom nhóm theo Ngày, Loại xe, Nguồn thu, Phương thức thanh toán) và trả về một mảng JSON phẳng.

### **KHU VỰC 2: THẺ CHỈ SỐ TỔNG QUAN (KPI CARDS)**

* **Vị trí:** Nằm ngay dưới bộ lọc, dàn hàng ngang.  
* **Thành phần UI:** Gồm 3 thẻ (Card) làm nổi bật các con số tài chính cốt lõi:  
  1. **Tổng Doanh Thu (Total Revenue):** Con số lớn nhất, định dạng tiền tệ (Ví dụ: 150.000.000 VNĐ).  
  2. **Tổng Lượt Giao Dịch (Total Transactions):** Phản ánh công suất (Ví dụ: 5.000 lượt).  
  3. **ARPU (Doanh thu trung bình/Lượt):** Tính bằng công thức $ARPU \= \\frac{\\text{Tổng Doanh Thu}}{\\text{Tổng Lượt Giao Dịch}}$.  
* **Luồng xử lý:** React dùng hàm .reduce() chạy qua toàn bộ mảng Master JSON để cộng dồn cột totalRevenue và totalTransactions hiển thị lên thẻ.

### **KHU VỰC 3: PHÂN TÍCH CẤU TRÚC & XU HƯỚNG (BỐ CỤC HERO & SIDEBAR 70/30)**

* **Vị trí:** Chiếm không gian lớn nhất ở phần giữa trên của màn hình.  
* **Thành phần UI:**  
  * **Khối Bên Trái (70% \- Hero Chart): Biểu đồ Cột (Bar Chart)**  
    * *Trục Hoành (X):* Các ngày trong khoảng thời gian đã chọn.  
    * *Trục Tung (Y):* Tổng tiền.  
    * *Hiển thị:* Các cột đứng thể hiện tổng doanh thu của từng ngày. Giúp định vị nhanh ngày cao điểm/thấp điểm.  
  * **Khối Bên Phải (30% \- Sidebar): Bộ 3 Biểu đồ Tròn (Pie/Donut Charts) xếp dọc**  
    * *Biểu đồ 1:* Tỷ trọng Phương thức thanh toán (% PAYOS vs % CASH).  
    * *Biểu đồ 2:* Tỷ trọng Nguồn doanh thu (% Vãng lai, % Đặt chỗ, % Phạt).  
    * *Biểu đồ 3:* Tỷ trọng Loại phương tiện (% CAR-4S, % CAR-7S, % MOTORBIKE).  
* **Luồng xử lý:** React tự động bóc tách dữ liệu. Khối bên trái gộp tiền theo ngày; khối bên phải lần lượt gộp tiền theo từng tiêu chí tương ứng tính ra % để vẽ biểu đồ.

### **KHU VỰC 4: PHÂN TÍCH BIẾN ĐỘNG CHI TIẾT (TOGGLE COMPARISON CHART)**

* **Vị trí:** Dưới Khu vực 3\.  
* **Thành phần UI:**  
  * Một khối biểu đồ lớn dạng Đường nhiều màu (Multi-line Chart) hoặc Cột chồng (Stacked Bar Chart). Trục hoành là các Ngày.  
  * Có một nhóm nút chuyển đổi (Toggle/Tabs) ở góc trên bên phải khối:  
    * \[So sánh Loại Xe\]  
    * \[So sánh Nguồn Thu\]  
    * \[So sánh Phương Thức\]  
* **Luồng xử lý:** \* Khi bấm chuyển tab, không có API nào được gọi thêm.  
  * React tự động lấy lại tập dữ liệu Master, tái cấu trúc thành dạng ma trận và vẽ chồng các đường dữ liệu lên nhau. Ví dụ: Khi chọn \[So sánh Loại Xe\], đường màu xanh dương (Ô tô) và đường màu đỏ (Xe máy) sẽ chạy song song hoặc cắt nhau dọc theo trục thời gian để Manager so sánh biến động.

### **KHU VỰC 6: BẢNG DỮ LIỆU THÔ VÀ TRÍCH XUẤT (DATA TABLE & EXPORT)**

* **Vị trí:** Dưới cùng màn hình.  
* **Thành phần UI:**  
  * Component DataTable có phân trang (Pagination), hiển thị chi tiết từng dòng dữ liệu tổng hợp: Ngày | Loại Xe | Nguồn Thu | Phương Thức | Tổng Tiền | Số Lượt.  
  * Nút bấm hành động nổi bật: **"Xuất Báo Cáo (Excel/CSV)"**.  
* **Luồng xử lý Export:** \* Khi Kế toán click vào nút Export, React sẽ đóng gói mảng dữ liệu đang hiển thị trên Table thành file .csv.  
  * Thay vì sử dụng dấu phẩy (,) làm ký tự phân cách cột (Separator) theo chuẩn quốc tế, thuật toán Export bắt buộc phải sử dụng **dấu chấm phẩy (;)**.  
  * Việc này đảm bảo tương thích tuyệt đối khi mở file trên phần mềm Microsoft Excel của các máy tính được thiết lập hệ thống Region (Khu vực) là tiếng Việt, giúp dữ liệu tự động tràn vào đúng các cột một cách vuông vắn, không bị vỡ hoặc dính chùm chuỗi.

## **BÁO CÁO LƯU LƯỢNG, TỶ LỆ LẤP ĐẦY VÀ GIỜ CAO ĐIỂM**

**(MÃ PHÂN HỆ: UC-MNG06 \- TAB 2: OPERATIONAL DASHBOARD)**  
Phân hệ này đóng vai trò là Trung tâm Kiểm soát Điều phái Vật lý của toàn bộ hệ thống quản lý bãi xe thông minh. Mục tiêu cốt lõi là số hóa toàn bộ luồng phương tiện di chuyển qua các cổng kiểm soát (Barrier) và trạng thái chiếm dụng không gian thực tế dưới các hầm đỗ xe, giúp người quản lý (Operation Manager) tối ưu hóa mật độ phân bổ mặt bằng, bắt bài khung giờ cao điểm và điều phối luồng xe tự động.

### **1\. KIẾN TRÚC DỮ LIỆU VÀ THUẬT TOÁN TỐI ƯU HIỆU NĂNG**

Để đảm bảo hệ thống có khả năng chịu tải cao trong các khung giờ cao điểm (tần suất xe ra vào liên tục), phân hệ này áp dụng kiến trúc **Event-Driven Pre-calculation (Tính toán sẵn hướng sự kiện)** kết hợp **Pivoted Backend Matrix**, loại bỏ hoàn toàn các tác vụ quét toàn bảng (Full Table Scan) đếm dữ liệu lịch sử thô khi người dùng mở giao diện báo cáo.

#### **1.1. Cơ chế đồng bộ Lưới thẻ thời gian thực (Live KPI Grid)**

* Hệ thống không sử dụng các câu lệnh SELECT COUNT(\*) xuống cơ sở dữ liệu để cập nhật số lượng xe hiện tại.  
* Khi hệ thống khởi chạy, tổng số xe đang có trạng thái INSIDE sẽ được đếm một lần duy nhất và nạp vào bộ nhớ RAM (In-Memory Cache như Redis hoặc biến tĩnh của Spring Boot).  
* Mỗi khi có sự kiện xe qua cổng thành công (Event Check-in/Check-out), Backend chỉ thực hiện phép toán tăng/giảm giá trị trên RAM (currentCount++ hoặc currentCount--), sau đó đẩy ngay payload dữ liệu mới qua giao thức **WebSockets** lên giao diện người dùng dưới 100ms. Dữ liệu ghi xuống SQL Server chỉ mang tính chất lưu vết lịch sử (Log).

#### **1.2. Cơ chế "Nhảy giờ tự động" (Time-based Upsert) cho dữ liệu xu hướng**

* Để vẽ được biểu đồ đường 24 giờ mà không dùng tiến trình chạy ngầm quét dữ liệu định kỳ (Cron Job gây nghẽn ổ cứng), hệ thống sử dụng chính mốc thời gian thực của sự kiện xe qua cổng (Event Timestamp) để kiểm soát dữ liệu.  
* Khi xe qua cổng lúc 08:15:20, Backend thực hiện làm tròn thời gian về đầu giờ (08:00:00) và thực hiện một lệnh **UPSERT (MERGE trong SQL Server)** xuống bảng nén dữ liệu xu hướng giờ (zone\_hourly\_trends):  
  * **Nếu chưa có dòng của giờ 08:00:00 (Nhảy sang giờ mới):** Thực hiện lệnh **INSERT** một bản ghi mới với giá trị phần trăm lấp đầy khởi tạo.  
  * **Nếu đã có dòng của giờ 08:00:00 (Trong cùng một khung giờ):** Thực hiện lệnh **UPDATE** ghi đè tỷ lệ % lấp đầy mới nếu giá trị này cao hơn giá trị cũ trong giờ đó (peak\_rate).

### **2\. ĐẶC TẢ CHI TIẾT CÁC KHU VỰC GIAO DIỆN (UI/UX REGIONAL SPECIFICATIONS)**

Màn hình báo cáo vận hành được quy hoạch thành 6 khu vực chức năng rành mạch theo luồng tư duy từ Tổng quan (Vĩ mô) đến Chi tiết (Vi mô).

#### **KHU VỰC 1: BỘ ĐIỀU KHIỂN TRUNG TÂM (GLOBAL FILTER)**

* **Thành phần UI:** Component DateRangePicker (Bộ chọn khoảng ngày lịch sử: Từ ngày \- Đến ngày).  
* **Vị trí:** Cố định ở thanh trên cùng của giao diện Tab 2\.  
* **Logic xử lý:** Đóng vai trò cung cấp tham số đầu vào gốc (startDate, endDate) cho các API trích xuất dữ liệu của Khu vực 3, Khối xu hướng ngày của Khu vực 5, và Bảng dữ liệu Khu vực 6\. Khi thay đổi khoảng ngày, toàn bộ các cấu phần này đồng loạt tải lại dữ liệu mà không làm ảnh hưởng đến các thẻ thời gian thực ở Khu vực 2\.

#### **KHU VỰC 2: LƯỚI THẺ CHỈ SỐ THỜI GIAN THỰC (LIVE KPI GRID)**

* **Hình thức:** Grid Layout chia làm 3 khối thông tin biệt lập (Grouped Containers). Nhận dữ liệu liên tục từ luồng WebSockets.  
* **Khối 1: Trạng thái Ô tô (CAR KINETICS)**  
  * *Thẻ Tỷ lệ lấp đầy Ô tô (%):* Hiển thị số phần trăm chiếm dụng của phân khu ô tô. Đi kèm một đồ thị vòng tròn (Donut Gauge) tự động đổi màu sắc cảnh báo theo ngưỡng cấu hình: Xanh lá ($\\le 75\\%$) $\\rightarrow$ Vàng cam ($76\\% \- 90\\%$) $\\rightarrow$ Đỏ rực cảnh báo nguy cơ quá tải ($\> 90\\%$).  
  * *Thẻ Số Ô tô hiện tại (Units):* Tổng số xe hơi thực tế đang nằm dưới hầm.  
  * *Thẻ Số chỗ Ô tô khả dụng (Slots):* Số lượng ô đỗ xe hơi còn trống thực tế tại giây phút hiện tại.  
* **Khối 2: Trạng thái Xe máy (MOTORBIKE KINETICS)**  
  * *Thẻ Tỷ lệ lấp đầy Xe máy (%):* Hiển thị số phần trăm chiếm dụng kèm vòng tròn đổi màu tương tự khối ô tô.  
  * *Thẻ Số Xe máy hiện tại (Units):* Tổng số xe máy thực tế đang nằm dưới hầm.  
  * *Thẻ Số chỗ Xe máy khả dụng (Slots):* Số lượng vị trí đỗ xe máy còn trống thực tế.  
* **Khối 3: Tổng Lưu lượng Ngày (DAILY TRAFFIC VOLUMETRICS)**  
  * *Thẻ Tổng lượt vào (Check-in Today):* Tổng số lượt xe đã quét thẻ vào bãi tính từ 00:00 cùng ngày.  
  * *Thẻ Tổng lượt ra (Check-out Today):* Tổng số lượt xe đã quét thẻ/thanh toán ra khỏi bãi tính từ 00:00 cùng ngày.

#### **KHU VỰC 3: BIỂU ĐỒ XU HƯỚNG TỶ LỆ LẤP ĐẦY THEO ZONE (ZONE OCCUPANCY TREND)**

* **Hình thức trực quan:** Biểu đồ đa đường liên tục (Multi-line Chart).  
* **Cấu trúc trục:** \* Trục hoành ($X$): 24 khung giờ trong ngày (từ 00:00 đến 23:00).  
  * Trục tung ($Y$): Thang đo tỷ lệ phần trăm từ $0\\%$ đến $100\\%$.  
* **Đường chỉ số đặc biệt:** Tích hợp một đường nét đứt màu đỏ cố định nằm ngang chạy suốt đồ thị tại mốc định vị $90\\%$ (Ngưỡng cảnh báo tới hạn).  
* **Hiển thị dòng dữ liệu:** Mỗi đường uốn lượn mang một màu sắc độc lập đại diện cho một Zone vật lý (Ví dụ: Đường màu Xanh dương \- Zone Vãng lai hầm B1; Đường màu Tím \- Zone Khách đặt chỗ trước).  
* **Giá trị tối ưu:** Giúp phát hiện gia tốc đầy chỗ của từng khu vực. Thuật toán điều hướng hệ thống sẽ đọc dữ liệu từ bảng này: khi một phân khu tiệm cận đường nét đứt 90%, hệ thống tự động đẩy lệnh ra bảng LED ngoài cổng để hướng dẫn dòng xe di chuyển sang phân khu khác còn thấp hơn.

#### **KHU VỰC 4: LƯU LƯỢNG VÀO/RA VÀ KHUNG GIỜ CAO ĐIỂM (HOURLY TRAFFIC FLOW)**

* **Hình thức trực quan:** Biểu đồ đa đường chồng chéo đan xen (Multi-line Chart).  
* **Cấu trúc trục:** Trục hoành ($X$) là 24 khung giờ. Trục tung ($Y$) là Số lượt xe di chuyển qua các cổng Barrier (Lượt).  
* **Quy chuẩn phân tách màu sắc hệ thống:** Biểu đồ hiển thị chính xác 4 đường độc lập:  
  * *Đường nét liền màu Xanh Dương:* Lượt Ô tô tiến VÀO hầm.  
  * *Đường nét đứt màu Xanh Dương:* Lượt Ô tô di chuyển RA khỏi hầm.  
  * *Đường nét liền màu Đỏ:* Lượt Xe máy tiến VÀO bãi.  
  * *Đường nét đứt màu Đỏ:* Lượt Xe máy di chuyển RA khỏi bãi.  
* **Giá trị tối ưu:** Các đỉnh cao nhất của các đường uốn lượn chỉ ra chính xác khung giờ cao điểm cục bộ của từng loại xe. Dựa vào đây, Đội trưởng an ninh có cơ sở số liệu để phân bổ ca trực cho bảo vệ tại các barrier vào đúng các khung giờ nóng, giải tỏa ùn tắc kịp thời.

#### **KHU VỰC 5: TỔ HỢP PHÂN TÍCH VĨ MÔ THEO GIAI ĐOẠN (MACRO TREND & RATIOS)**

Đây là một cụm cấu phần liên kết (Dashboard Layout Compound) gồm 3 biểu đồ hiển thị song song giúp bóc tách cơ cấu của cả giai đoạn được chọn trong bộ lọc Khu vực 1\.

* **Cấu phần 5.1 \- Biểu đồ Xu hướng Ngày (Daily Net Flow \- Chiếm 50% diện tích khối):** Biểu đồ đường chạy theo các ngày của chuỗi thời gian được lọc. Gồm 2 đường: Đường màu Xanh (Tổng lượt Vào) và Đường màu Đỏ (Tổng lượt Ra). Nếu đường Vào liên tục nằm cao hơn đường Ra qua nhiều ngày, hệ thống sẽ đưa ra cảnh báo bãi xe đang tích lũy một lượng lớn xe tồn qua đêm để quản lý chủ động rà soát không gian.  
* **Cấu phần 5.2 \- Biểu đồ tròn Cơ cấu Phương tiện (Vehicle Type Ratio \- Chiếm 25% diện tích khối):** Biểu đồ tròn/donut bóc tách tổng lượng xe trong cả giai đoạn thành tỷ lệ % giữa: Ô tô (CAR) và Xe máy (MOTORBIKE).  
* **Cấu phần 5.3 \- Biểu đồ tròn Cơ cấu Tệp khách hàng (Customer Segment Ratio \- Chiếm 25% diện tích khối):** Biểu đồ tròn bóc tách tổng lượng xe thành tỷ lệ % giữa các loại hình dịch vụ: Khách vãng lai (WALK\_IN) và Khách đặt chỗ trước (BOOKING). Giúp nhận diện hành vi thay đổi theo mùa vụ (Ví dụ: Ngày cuối tuần tỷ lệ khách vãng lai tăng vọt, ngày trong tuần tỷ lệ khách đặt trước chiếm ưu thế).

#### **KHU VỰC 6: BẢNG LƯỚI DỮ LIỆU & TRÍCH XUẤT CHỨNG TỪ (DATA TABLE & EXPORT)**

* **Thành phần UI:** Bảng lưới dữ liệu phẳng (DataTable) hỗ trợ phân trang Client/Server, sắp xếp cột (Sorting) và tìm kiếm nhanh.  
* **Cấu trúc các cột thuộc tính:** Ngày | Khung giờ | Tên Phân Khu (Zone) | Tổng Lượt Vào | Tổng Lượt Ra | Tỷ Lệ Lấp Đầy Đỉnh (%).  
* **Hành động hệ thống:** Nút chức năng **"Xuất báo cáo vận hành (Excel)"**.  
* **Đặc tả kỹ thuật Export:** File xuất ra định dạng văn bản phẳng (CSV hoặc Excel tương thích). Hệ thống bắt buộc phải được cấu hình mã nguồn sử dụng **ký tự dấu chấm phẩy (;) làm dải phân cách giữa các cột** thay vì dấu phẩy (,) mặc định quốc tế.  
  * *Mục tiêu kỹ thuật:* Đảm bảo tính tương thích tuyệt đối khi các nhà quản lý mở file trực tiếp bằng phần mềm Microsoft Excel trên hệ điều hành máy tính văn phòng cài đặt vùng phân vùng hệ thống (Region) là Tiếng Việt. Dữ liệu sẽ tự động dàn vào các ô lưới vuông vắn, loại bỏ hoàn toàn hiện tượng văn bản bị dính liền thành một chuỗi văn bản dài lỗi định dạng.

### **3\. ĐẶC TẢ KỸ THUẬT DATABASE (SQL SERVER TỐI ƯU CÂU LỆNH)**

Để tối ưu hóa, toàn bộ các tác vụ xử lý tính toán gộp nhóm phức tạp được đẩy xuống tầng SQL Server để tận dụng sức mạnh xử lý tập hợp và cây chỉ mục (Index Seek), trả về mảng dữ liệu đã tinh chế lên Backend.

#### **3.1. Câu lệnh trích xuất dữ liệu cho Khu vực 3 (Tỷ lệ lấp đầy theo Zone \- Ma trận hóa từ DB)**

Bảng xu hướng giờ zone\_hourly\_trends chứa dữ liệu phẳng. Ta viết câu lệnh SQL áp dụng kỹ thuật Conditional Aggregation để ép cấu phần trả ra kết quả dạng ma trận, giúp React không phải chạy vòng lặp xử lý dữ liệu nặng:

SQL  
SELECT   
    hour\_time,  
    MAX(CASE WHEN zone\_name \= 'Zone Vang Lai A' THEN peak\_rate ELSE 0 END) AS \[Zone\_Vang\_Lai\_A\],  
    MAX(CASE WHEN zone\_name \= 'Zone Vang Lai B' THEN peak\_rate ELSE 0 END) AS \[Zone\_Vang\_Lai\_B\],  
    MAX(CASE WHEN zone\_name \= 'Zone Booking' THEN peak\_rate ELSE 0 END) AS \[Zone\_Booking\]  
FROM zone\_hourly\_trends  
WHERE report\_date BETWEEN :startDate AND :endDate  
GROUP BY hour\_time  
ORDER BY hour\_time ASC;

#### **3.2. Câu lệnh trích xuất dữ liệu cho Khu vực 4 (Lưu lượng giờ cao điểm)**

Quét qua bảng ghi nhận nhật ký cổng barrier (barrier\_logs), sử dụng hàm DATEPART kết hợp để bóc tách 4 làn dữ liệu:

SQL  
SELECT   
    DATEPART(HOUR, log\_time) AS peak\_hour,  
    SUM(CASE WHEN vehicle\_type \= 'CAR' AND direction \= 'IN' THEN 1 ELSE 0 END) AS car\_in,  
    SUM(CASE WHEN vehicle\_type \= 'CAR' AND direction \= 'OUT' THEN 1 ELSE 0 END) AS car\_out,  
    SUM(CASE WHEN vehicle\_type \= 'MOTORBIKE' AND direction \= 'IN' THEN 1 ELSE 0 END) AS bike\_in,  
    SUM(CASE WHEN vehicle\_type \= 'MOTORBIKE' AND direction \= 'OUT' THEN 1 ELSE 0 END) AS bike\_out  
FROM barrier\_logs  
WHERE log\_time BETWEEN :startDate AND :endDate  
GROUP BY DATEPART(HOUR, log\_time)  
ORDER BY peak\_hour ASC;

#### **3.3. Câu lệnh trích xuất dữ liệu cho Khu vực 5 (Cơ cấu Loại xe & Tệp khách)**

Để tránh gọi nhiều kết nối lên Database, một câu lệnh SQL duy nhất sẽ quét qua khoảng thời gian được lọc để trả ra bảng cơ cấu tổng hợp cho 2 biểu đồ tròn:

SQL  
SELECT   
    vehicle\_type,  
    customer\_type,  
    COUNT(id) AS total\_count  
FROM parking\_sessions  
WHERE checkin\_time BETWEEN :startDate AND :endDate  
GROUP BY vehicle\_type, customer\_type;

*Xử lý tại Backend (Spring Boot):* Nhận kết quả từ câu lệnh này, thực hiện cộng dồn theo nhóm vehicle\_type để trả về danh sách cho Biểu đồ tròn 1, và cộng dồn theo customer\_type để trả về danh sách cho Biểu đồ tròn 2\.

### **4\. ĐẶC TẢ ĐẦU RA API (SAMPLE JSON PAYLOADS)**

Tất cả các API báo cáo đều trả về cấu trúc mảng JSON phẳng, tinh gọn, sẵn sàng nạp trực tiếp vào các thư viện giao diện đồ họa (như Recharts) ở tầng Frontend.

#### **4.1. API Xu hướng lấp đầy Zone (GET /api/v1/reports/zone-occupancy)**

JSON  
\[  
  { "time": "08:00", "Zone\_Vang\_Lai\_A": 85.5, "Zone\_Vang\_Lai\_B": 42.0, "Zone\_Ve\_Thang\_B2": 90.0, "Zone\_Booking": 15.0 },  
  { "time": "09:00", "Zone\_Vang\_Lai\_A": 92.3, "Zone\_Vang\_Lai\_B": 55.1, "Zone\_Ve\_Thang\_B2": 91.5, "Zone\_Booking": 20.0 }  
\]

#### **4.2. API Lưu lượng giờ cao điểm (GET /api/v1/reports/hourly-traffic)**

JSON  
\[  
  { "hour": 7, "car\_in": 45, "car\_out": 12, "bike\_in": 320, "bike\_out": 50 },  
  { "hour": 8, "car\_in": 120, "car\_out": 30, "bike\_in": 580, "bike\_out": 95 }  
\]

#### **4.3. API Cơ cấu phân loại vĩ mô (GET /api/v1/reports/macro-ratios)**

JSON  
{  
  "vehicleMetrics": \[  
    { "name": "Ô tô", "value": 1450 },  
    { "name": "Xe máy", "value": 4820 }  
  \],  
  "customerMetrics": \[  
    { "name": "Vãng lai", "value": 3100 },  
    { "name": "Đặt trước", "value": 370 }  
  \]  
}

Bản đặc tả chi tiết này đảm bảo tính toàn vẹn từ trải nghiệm người dùng tối giản ở lớp Front-end đến các giải pháp tối ưu hóa tài nguyên phần cứng, lập chỉ mục ở lớp Cơ sở dữ liệu phía sau, sẵn sàng phục vụ cho công tác thi công mã nguồn dự án.

## **QUẢN LÝ NGOẠI LỆ & XỬ LÝ SỰ CỐ (EXCEPTION MANAGEMENT)**

### **1\. TỔNG QUAN PHÂN HỆ**

* **Mã Use Case:** UC-MNG08  
* **Tên Use Case:** Quản lý Ngoại lệ & Xử lý Sự cố (Exception Management).  
* **Tác nhân (Actor):** Quản lý bãi xe (Manager), Nhân viên an ninh/Trực trạm (Security/Staff).  
* **Mục tiêu:** Số hóa toàn bộ quy trình giải quyết các tình huống nằm ngoài luồng chuẩn (Happy Path). Module này kết hợp giữa sự can thiệp có kiểm soát của con người và các bộ kích hoạt (Trigger) ngầm của hệ thống Backend nhằm ghi vết mọi thao tác, bịt kín lỗ hổng thất thoát doanh thu và chuẩn hóa quy trình xử lý sự cố.

### **2\. SUB-CASE 1: QUY TRÌNH XỬ LÝ MẤT VÉ / MẤT THẺ (LOST TICKET RESOLUTION)**

Giải quyết tình huống khách hàng làm rơi thẻ từ, không có thẻ vật lý để quẹt Check-out tại cổng ra.

* **Bước 1 \- Tìm kiếm truy vết:** Khách hàng báo mất thẻ tại trạm ra. Nhân viên trực trạm nhập biển số xe thực tế của khách vào thanh tìm kiếm. Hệ thống truy vấn các phiên đang đỗ (status \= 'INSIDE') và trả về kết quả khớp.  
* **Bước 2 \- Xác thực định danh (Visual Verification):** Giao diện hiển thị trực quan 2 ảnh chụp tại thời điểm Check-in (Ảnh biển số và Ảnh toàn cảnh người lái). Nhân viên yêu cầu khách xuất trình Giấy tờ xe (Cà vẹt/CCCD) để đối chiếu trực tiếp với người đang đứng tại quầy và ảnh chụp hệ thống.  
* **Bước 3 \- Xử lý tính phí & Phạt:** Sau khi xác minh chính chủ, nhân viên bấm nút **"Xử lý mất vé"**. Hệ thống tự động tính toán tổng hóa đơn bao gồm 2 khoản:  
  * Tiền cước đỗ xe (Tính từ check\_in\_time trong Database đến thời điểm xử lý hiện tại).  
  * Phụ phí phạt mất thẻ vật lý (Mức phí lấy từ cấu hình hệ thống, VD: 50.000 VNĐ) để bồi thường phôi thẻ.  
* **Bước 4 \- Đóng phiên & Khóa thẻ:** Khách thanh toán thành công (Tiền mặt/Chuyển khoản), nhân viên xác nhận trên phần mềm \\rightarrow Barrier mở. Đồng thời, Backend lập tức chuyển trạng thái mã UID của chiếc thẻ bị mất thành INACTIVE (Khóa thẻ). Nếu thẻ này được nhặt lại và quẹt tại cổng IN, hệ thống sẽ từ chối truy cập.

### **3\. SUB-CASE 2: CHỈNH SỬA SAI BIỂN SỐ TẠI CỔNG VÀO (LPR CORRECTION)**

Hệ thống không tự động mở cổng để phòng ngừa rủi ro AI đọc sai (do bụi bẩn, lóa sáng), yêu cầu nhân viên trạm xác nhận để đảm bảo tính toàn vẹn dữ liệu.

* **Luồng vận hành thực tế:**  
  * Xe tiến vào cổng IN, Camera chụp ảnh và AI (LPR) bóc tách chuỗi biển số. **Barrier mặc định KHÔNG mở tự động**.  
  * Màn hình tại trạm hiển thị: Ảnh xe thực tế và Chuỗi ký tự biển số do AI đọc.  
  * **Trường hợp 1 (Dữ liệu khớp):** Nhân viên đối chiếu thấy AI đọc đúng \\rightarrow Bấm nút "Xác nhận" \\rightarrow Barrier mở, phiên đỗ xe được tạo bình thường.  
  * **Trường hợp 2 (Dữ liệu lệch):** Nhân viên phát hiện AI đọc sai (VD: 8 thành B). Nhân viên nhấp chuột vào ô text, **gõ sửa lại chuỗi ký tự cho đúng thực tế**, sau đó bấm "Xác nhận" \\rightarrow Barrier mở.  
* **Luồng xử lý hệ thống (Backend Trigger):**  
  * Khi nhận được lệnh "Xác nhận" có sự thay đổi chuỗi text từ phía nhân viên, Backend lưu phiên đỗ xe này kèm một cờ is\_plate\_corrected \= TRUE.  
  * Hệ thống tự động đẩy các bản ghi này lên **Báo cáo Chỉnh sửa Biển số**. Báo cáo này giúp Manager thống kê tỷ lệ đọc lỗi của từng camera để có kế hoạch vệ sinh thấu kính hoặc căn chỉnh góc quay.

### **4\. SUB-CASE 3: KIỂM SOÁT XE TỒN ĐỌNG QUÁ GIỜ (NIGHTLY OVERSTAY BATCH)**

Sử dụng cơ chế quét tập trung vào ban đêm để giảm tải cho máy chủ trong giờ hành chính, cảnh báo an ninh đối với các xe nằm lỳ trong bãi vượt mức quy định (72 giờ).

* **Cơ chế quét tối ưu (Nightly Batch Job):**  
  * Hệ thống Backend Spring Boot chạy một tiến trình ngầm tự động (Cron Job) vào lúc **02:00 sáng mỗi đêm** (thời điểm bãi xe ít giao dịch nhất).  
  * Tiến trình này chạy một câu lệnh Update theo lô (Batch Update) xuống cơ sở dữ liệu: Tìm toàn bộ các xe có status \= 'INSIDE', chưa được gắn cờ, và có check\_in\_time vượt quá 72 giờ tính đến thời điểm quét.  
  * Các xe thỏa mãn điều kiện lập tức được gắn cờ is\_overstay \= TRUE.  
* **Luồng vận hành vào sáng hôm sau:**  
  * Đầu ca sáng (VD: 06:00), Đội trưởng bảo vệ mở giao diện **Báo cáo Xe Quá Giờ**. Danh sách đã được hệ thống "nấu chín" từ đêm qua và hiển thị tức thì.  
  * Đội trưởng bấm **"In danh sách tuần tra"**. Nhân viên an ninh cầm danh sách xuống hầm, đối chiếu thực tế từng ô đỗ để kiểm tra tình trạng vật lý của xe (rò rỉ nhiên liệu, xịt lốp, xe vô chủ) và tiến hành điều phối dời xe sang khu vực đỗ dài hạn để giải phóng mặt bằng luân chuyển.

### **5\. SUB-CASE 4: XỬ LÝ XE ĐỖ SAI VỊ TRÍ / SAI ZONE (MANUAL ZONE VIOLATION)**

Giao phó quyền phát hiện vi phạm không gian đỗ cho nhân viên đi tuần, kết hợp hệ thống Backend tự động đối soát logic khu vực để ra quyết định ghi nhận vi phạm.

* **Phát hiện & Thao tác trên giao diện:**  
  * Nhân viên tuần tra phát hiện một xe có biển số Vãng lai nhưng đang đỗ ngang nhiên tại ô A12 đặt trước.  
  * Quản lý (Manager) mở Sơ đồ bãi xe (Grid Layout) trên phần mềm, tìm chiếc xe đó ở vị trí Slot ảo ban đầu.  
  * Quản lý thực hiện thao tác **nhấp chuột chọn chiếc xe đó và gán (Assign) sang đúng Slot A12 thực tế** trên bản đồ hệ thống.  
* **Luồng xử lý đối soát (Logic Matching):**  
  * Ngay khi nhận được lệnh cập nhật Slot, Backend truy xuất thông tin zone\_id của Slot cũ và Slot mới (A12).  
  * Nếu phát hiện old\_zone\_id \!= new\_zone\_id (Đỗ xuyên khu vực sai quy định), hệ thống tự động kích hoạt cờ zone\_violation \= TRUE.  
  * Dữ liệu xe này lập tức được kết xuất sang **Báo cáo Đỗ Sai Zone**, làm cơ sở vững chắc để thu phụ phí sai quy định khi xe Check-out hoặc làm bằng chứng nhắc nhở khách hàng.

### **6\. SUB-CASE 5: XỬ LÝ XE CHƯA THANH TOÁN & BLACKLIST (DEBT & EVASION RECOVERY)**

Giải quyết triệt để tình trạng khách bám đuôi xe trước vượt trạm (Tailgating), tông gãy Barrier trốn vé, đảm bảo hệ thống "nhớ mặt" để truy thu nợ vào lần gửi tiếp theo.

* **Luồng phát hiện sự cố (2 Kịch bản):**  
  * **Kịch bản 1 (Kiểm kê vật lý):** Nhân viên tuần tra thấy một Slot ngoài đời thực trống rỗng, nhưng phần mềm vẫn báo xe đó đang đỗ (Trạng thái INSIDE). Báo cáo lên Manager.  
  * **Kịch bản 2 (Xung đột Check-in):** Chiếc xe trốn vé quay lại bãi gửi. Khi tiến vào cổng, hệ thống báo lỗi xung đột đỏ chót: *"Từ chối tạo phiên: Xe này vẫn đang được ghi nhận ở trong bãi"*.  
* **Hành động can thiệp của Quản lý:**  
  * Manager tra cứu biển số/Slot ảo của chiếc xe đó trên hệ thống.  
  * Click chọn chức năng **"Đánh dấu Chưa thanh toán / Đưa vào Blacklist"**.  
* **Luồng xử lý tự động (Debt Enforcement):**  
  * Backend ép đóng phiên đỗ xe ảo đó lại, cập nhật trạng thái thành EVADED (Trốn vé) và chốt cứng số tiền cước đang nợ tính đến thời điểm trốn thoát (hoặc thời điểm đóng phiên).  
  * Hệ thống đưa biển số này vào **Báo cáo Xe Chưa Thanh Toán** đồng thời kích hoạt cờ Blacklist.  
  * **Cơ chế thu hồi nợ tự động:** Lần tiếp theo chiếc xe này tiến vào cổng IN, Camera LPR nhận diện biển số khớp với Blacklist \\rightarrow **Barrier IN khóa cứng**. Màn hình trạm hiển thị cảnh báo yêu cầu khách thanh toán dứt điểm khoản nợ cũ trước khi hệ thống gỡ Blacklist và cho phép tạo phiên đỗ xe mới.

# Parking Staff

## **HỖ TRỢ XỬ LÝ XE VÀO BÃI (VEHICLE CHECK-IN ASSISTANCE)**

### **1\. THÔNG TIN CHUNG (GENERAL INFORMATION)**

* **Mã Use Case:** UC-STF01  
* **Tên Use Case:** Hỗ trợ xử lý xe vào bãi (Vehicle Check-in Support).  
* **Tác nhân (Actor):** Nhân viên trực trạm vào (Staff / Gate Operator).  
* **Mô tả ngắn gọn:** Quy trình kiểm soát phương tiện tại cổng vào hầm. Nhân viên thực hiện kiểm tra ngoại quan điều kiện xe, đối chiếu và chỉnh sửa biển số do hệ thống Web giả lập bóc tách, xác nhận tạo phiên đỗ xe và thông báo vị trí ô đỗ (Slot) chính xác được chỉ định bởi thuật toán để hướng dẫn tài xế di chuyển.

### **2\. TIỀN ĐIỀU KIỆN (PRECONDITIONS)**

* Nhân viên trực trạm đã đăng nhập vào hệ thống Web Client quầy vào với quyền STAFF.  
* Kho thẻ (UC-MNG10) có sẵn các thẻ ở trạng thái AVAILABLE.  
* Cấu hình điều hướng luồng xe (UC-MNG09) đã được Manager thiết lập và kích hoạt sẵn ở Backend.

### **3\. LUỒNG SỰ KIỆN CHÍNH (MAIN SUCCESS SCENARIO / HAPPY PATH)**

* **Bước 1 (Kiểm tra ngoại quan):** Xe tiến vào làn Check-in. Nhân viên trực trạm kiểm tra bằng mắt thường các điều kiện an toàn cơ bản (xe không rò rỉ xăng dầu, không chở chất cấm, biển số không bị che khuất vĩnh viễn).  
* **Bước 2 (Giả lập quét biển số):** Hệ thống Web (mô phỏng Camera LPR) kích hoạt khi xe đè qua vòng từ giả lập. Trên màn hình của Staff lập tức hiển thị: Ảnh chụp xe đầu vào và một ô dữ liệu Text chứa biển số do AI tự động bóc tách.  
* **Bước 3 (Đối chiếu biển số):** Staff đối chiếu chuỗi ký tự trên màn hình với biển số thực tế trên xe. Nhận thấy AI đọc chính xác 100%, Staff bấm nút **"Xác nhận xe vào"** (hoặc nhấn phím tắt Spacebar).  
* **Bước 4 (Kích hoạt Bộ định tuyến):** Hệ thống Backend nhận lệnh, lập tức chạy *Thuật toán Điều hướng trượt (UC-MNG09)*:  
  * Kiểm tra Tầng hầm và Loại phương tiện của xe hiện tại.  
  * Quét các Zone theo thứ tự ưu tiên Alphabet/Cấu hình và kiểm tra ngưỡng lấp đầy để chọn ra Zone mục tiêu.  
  * Dò tìm và giữ chỗ một ô trống duy nhất theo thứ tự Alphabet tăng dần (Ví dụ: Chốt chọn được ô A05 thuộc Zone A \- Tầng B1).  
* **Bước 5 (Đóng gói phiên & Gán thẻ):** Backend tự động bốc một mã thẻ có trạng thái AVAILABLE đầu tiên trong kho thẻ để khởi tạo phiên đỗ xe mới (parking\_sessions):  
  * Đổi trạng thái thẻ từ AVAILABLE sang IN\_USE.  
  * Gắn cờ is\_inside \= TRUE.  
  * Gán biển số xe vừa xác nhận vào thuộc tính assigned\_plate.  
  * Trả về mã trạng thái thành công kèm thông tin điều hướng cho Staff.  
* **Bước 6 (Hướng dẫn phân làn & Mở cổng):** Màn hình Web Client của Staff hiển thị thông báo chỉ dẫn lớn (Mô phỏng màn hình LED cổng vào): **"MỜI VÀO: TẦNG B1 \- ZONE A \- Ô ĐỖ A05"**. Staff lấy một thẻ nhựa vật lý trao cho tài xế, đồng thời verbally (nói trực tiếp) hướng dẫn khách di chuyển đúng lộ trình. Cổng Barrier mở ra (Hệ thống giả lập hiệu ứng mở cổng trên Web).

### **4\. LUỒNG THAY THẾ & NGOẠI LỆ (ALTERNATIVE / EXCEPTION FLOWS)**

* **4.1. Xe vi phạm điều kiện vào bãi hoặc Bãi đầy 100%:**  
  * *Sự kiện:* Tại Bước 1, nhân viên phát hiện xe không có biển số, xe chở hàng quá tải nguy hiểm, hoặc màn hình hiển thị thông báo hệ thống *"BÃI ĐẦY 100% \- KHÔNG CÒN SLOT KHẢ DỤNG"*.  
  * *Xử lý:* Staff bấm nút **"Từ chối vào bãi"** trên giao diện, chọn lý do từ Dropdown (Bãi đầy / Xe vi phạm quy định / Biển số mờ). Hệ thống không tạo phiên, không xuất thẻ. Staff ra hiệu cho xe quay đầu xả trạm.  
* **4.2. Hệ thống AI bóc tách sai biển số (Luồng Chỉnh Sửa \- LPR Correction):**  
  * *Sự kiện:* Tại Bước 3, Staff đối chiếu ảnh chụp thấy biển số là 51G-128.45 nhưng ô Text AI trả về do lỗi lóa sáng là 51G-12B.45.  
  * *Xử lý:* Staff nhấp chuột vào ô nhập liệu Text, **gõ sửa tay lại ký tự chữ "B" thành số "8"** cho đúng thực tế, sau đó mới bấm nút "Xác nhận xe vào".  
  * *Backend Trigger:* Hệ thống Backend lưu phiên đỗ xe này bình thường nhưng tự động đánh dấu cờ is\_plate\_corrected \= TRUE để đẩy dữ liệu này vào báo cáo hiệu suất thiết bị của Manager.  
* **4.3. Phát hiện xe thuộc danh sách đen (Blacklist Conflict):**  
  * *Sự kiện:* Tại Bước 3, khi Staff bấm xác nhận, Backend kiểm tra bảng blacklist\_plates thấy biển số này trùng với một xe có cờ EVADED \= TRUE (Xe từng bám đuôi trốn vé nợ cước trước đây \- UC-MNG08 Sub-case 5).  
  * *Xử lý:* Giao diện Web khóa chết nút mở cổng, nhấp nháy cảnh báo đỏ: *"CẢNH BÁO: PHƯƠNG TIỆN NỢ CƯỚC CHƯA THANH TOÁN"*. Staff yêu cầu tài xế tấp xe vào lề, gọi Đội trưởng bảo vệ ra giải quyết thu hồi nợ cũ trước khi làm thủ tục cho xe vào bãi lượt mới.  
* **4.4. Xe trùng biển số đang ghi nhận nằm dưới hầm (Double Check-in Error):**  
  * *Sự kiện:* Tại Bước 3, hệ thống check thấy biển số này đã có một phiên khác đang ở trạng thái INSIDE \= TRUE dưới hầm (do lỗi tráo biển số giả hoặc phiên trước trốn vé chưa đóng).  
  * *Xử lý:* Hệ thống chặn tạo phiên, báo lỗi *"Trùng phiên hoạt động"*. Staff lập tức giữ xe lại để lực lượng an ninh xuống hầm kiểm tra thực tế xem có chiếc xe thứ 2 mang biển số y hệt đang đỗ hay không để xử lý gian lận.  
*  **4.5. Luồng xử lý đối với đơn Đặt chỗ (Booking Check-in):**  
* *Sự kiện:* Khi xe tiến vào, AI đọc biển số. Hệ thống tự động đối soát biển số với danh sách các đơn BOOKING hợp lệ của ngày hôm đó. Nếu tìm thấy đơn, giao diện Web của Staff hiển thị luồng ưu tiên.  
* *Xử lý bắt buộc:* Dù đã đặt chỗ trước, khách hàng **vẫn bắt buộc phải nhận một thẻ cứng RFID** để làm chứng từ định danh vật lý dưới hầm. Staff thực hiện thao tác quẹt thẻ trống để gán vào phiên Booking.  
* *Logic Chốt Chặn Quá Giờ:* Nếu thời gian xe vào trễ hơn so với giờ kết thúc ghi trên đơn Booking, hệ thống kích hoạt Quy tắc ràng buộc: Tự động hủy quyền ưu tiên đơn đặt chỗ (No Show), chuyển cấu hình phiên đỗ này sang dạng **Khách Vãng Lai** ngay từ phút đầu tiên và bắt đầu tính cước từ 0đ.  
* 

### **5\. QUY TẮC NGHIỆP VỤ ĐẶC THÙ (BUSINESS RULES)**

* **BR-01 (Xác thực bắt buộc từ con người):** Barrier tại cổng vào tuyệt đối không tự động mở. Mọi phiên đỗ xe chỉ được thiết lập và mở cổng khi có hành động Click chuột hoặc nhấn phím tắt xác nhận của nhân viên Staff tại quầy, đảm bảo xe được kiểm soát ngoại quan 100%.  
* **BR-02 (Cơ chế cô lập tài nguyên thẻ):** Khi một mã thẻ được Backend bốc và chuyển trạng thái sang IN\_USE, mã thẻ này lập tức bị khóa chặt vào phiên đỗ xe và biển số đó. Hệ thống Client của Staff ở các làn khác không thể bốc lại mã thẻ này cho đến khi xe ra khỏi bãi (Thẻ về trạng thái AVAILABLE).  
* **BR-03 (Chỉ dẫn vị trí cưỡng bách):** Vị trí Slot đỗ hiển thị trên màn hình hướng dẫn của Staff là duy nhất và bắt buộc (được tính bằng thuật toán Alphabet tối ưu không gian ở UC-MNG09). Staff không có quyền tự ý thay đổi số Slot trên giao diện quầy vào để tránh làm hỏng thuật toán phân bổ dòng xe của toàn hệ thống hầm. Trường hợp khách đỗ sai vị trí thực tế sẽ do bảo vệ đi tuần phát hiện và xử lý sau ở quầy quản lý (UC-MNG08 Sub-case 4).

## **TẠO LƯỢT GỬI XE (PARKING SESSION INITIALIZATION)**

### **1\. THÔNG TIN CHUNG (GENERAL INFORMATION)**

* **Mã Use Case:** UC-STF02  
* **Tên Use Case:** Tạo lượt gửi xe theo lượt / Vãng lai (Create Parking Session).  
* **Tác nhân (Actor):** Nhân viên trực trạm vào (Staff / Gate Operator).  
* **Mô tả ngắn gọn:** Ghi nhận và thiết lập một phiên đỗ xe mới (Parking Session) vào cơ sở dữ liệu đối với xe gửi theo lượt (Walk-in/Vãng lai). Hệ thống tự động đóng gói các tham số về thời gian vào, loại xe, mã cổng vào, mã thẻ hệ thống cấp phát và lưu trữ trạng thái hoạt động dưới hầm đỗ xe.

### **2\. TIỀN ĐIỀU KIỆN (PRECONDITIONS)**

* Nhân viên trực trạm đã đăng nhập thành công và hệ thống đang mở giao diện quầy vào (Gate\_In\_Screen).  
* Máy tính của nhân viên đã được cấu hình định danh gắn liền với một **Mã Cổng Vào** cụ thể (Ví dụ: GATE\_IN\_01).  
* Biển số xe đã được xác nhận chính xác (Từ luồng chuẩn hoặc sau khi sửa tay từ UC-STF01).  
* Hệ thống đã tìm được thẻ ở trạng thái AVAILABLE (Từ kho thẻ sinh chuỗi tự động UC-MNG10).

### **3\. LUỒNG SỰ KIỆN CHÍNH (MAIN SUCCESS SCENARIO / HAPPY PATH)**

* **Bước 1 (Nhận diện sự kiện tạo lượt):** Sau khi Staff bấm nút "Xác nhận xe vào" (từ Bước 3 của UC-STF01), hệ thống Web Client lập tức kích hoạt luồng đóng gói dữ liệu tạo lượt gửi xe.  
* **Bước 2 (Đóng gói Payload dữ liệu):** Hệ thống Frontend (React) tự động thu thập và đóng gói các thông tin thành một JSON Payload để gửi lên Backend thông qua phương thức POST /api/v1/parking-sessions:  
  * card\_code: Mã số chuỗi thẻ hệ thống tự bốc trong kho (Ví dụ: "10025").  
  * plate\_number: Biển số xe đã được xác nhận (Ví dụ: "51G-123.45").  
  * vehicle\_type: Loại xe được chọn (Ví dụ: "CAR" hoặc "MOTORBIKE").  
  * gate\_in\_id: Mã cổng vào hiện tại của máy Staff (Ví dụ: "GATE\_IN\_01").  
* **Bước 3 (Ghi nhận mốc thời gian thực):** Tầng Service của Spring Boot tiếp nhận Request. Hệ thống **KHÔNG** lấy thời gian do Frontend gửi lên (để chống gian lận chỉnh giờ trên máy Client), mà tự động gọi hàm LocalDateTime.now() tại server để đóng dấu mốc thời gian vào (check\_in\_time) chính xác đến từng giây.  
* **Bước 4 (Xử lý giao dịch Database):** Toàn bộ tiến trình này được bọc trong Annotation @Transactional. Hệ thống thực hiện song song 2 tác vụ dưới Database:  
  * **Tác vụ 1:** Tạo một bản ghi mới trong bảng parking\_sessions với trạng thái status \= 'INSIDE'.  
  * **Tác vụ 2:** Truy cập bảng parking\_cards, tìm thẻ "10025", cập nhật cờ is\_inside \= TRUE, gán thuộc tính assigned\_plate \= "51G-123.45", và đổi trạng thái thẻ sang IN\_USE.  
* **Bước 5 (Đồng bộ bộ nhớ đệm và hiển thị):** Backend cập nhật số lượng xe hiện tại vào RAM (In-Memory Cache) để phục vụ cho Live KPI Grid (UC-MNG06), gửi tín hiệu WebSocket thành công về màn hình Staff. Màn hình Web chuyển sang trạng thái "Sẵn sàng đón xe tiếp theo".

### **4\. LUỒNG THAY THẾ & NGOẠI LỆ (ALTERNATIVE / EXCEPTION FLOWS)**

* **4.1. Lỗi hết tài nguyên thẻ khả dụng (Card Pool Exhausted):**  
  * *Sự kiện:* Tại Bước 2, Backend kiểm tra kho thẻ parking\_cards nhưng không còn bất kỳ chiếc thẻ nào ở trạng thái AVAILABLE.  
  * *Xử lý:* Hệ thống chặn tạo phiên, trả về mã lỗi HTTP 409 Conflict. Giao diện Web của Staff hiển thị thông báo khẩn cấp: *"LỖI: Kho thẻ hệ thống đã hết thẻ khả dụng. Vui lòng liên hệ Manager để khởi tạo thêm thẻ (UC-MNG10) trước khi tiếp tục."*  
* **4.2. Thẻ ảo bị chiếm dụng đột ngột (Race Condition / Concurrency Error):**  
  * *Sự kiện:* Do bãi xe có nhiều làn vào chạy song song. Tại cùng một mili-giây, Làn 1 và Làn 2 cùng bốc trúng thẻ mã "10025" đang ở trạng thái AVAILABLE. Làn 1 bấm xác nhận trước và lưu thành công. Làn 2 bấm sau 1 phần triệu giây.  
  * *Xử lý:* Cơ chế Khóa lạc quan (Optimistic Locking) hoặc Ràng buộc Unique Index của Database đối với thẻ IN\_USE sẽ chặn đứng giao dịch của Làn 2\. Spring Boot tự động thực hiện **Rollback** toàn bộ phiên của Làn 2, trả về lỗi. Hệ thống tại Làn 2 tự động chạy lại thuật toán, bốc một mã thẻ trống khác (Ví dụ: "10026") và thực hiện lại luồng mà không làm treo màn hình của Staff.  
* **4.3. Mất kết nối Database khi đang tạo lượt (Database Connection Timeout):**  
  * *Sự kiện:* Tại Bước 4, lệnh Insert xuống DB bị nghẽn mạng hoặc sập nguồn điện đột ngột.  
  * *Xử lý:* Nhờ tính toàn vẹn của @Transactional, phiên đỗ xe sẽ không được tạo nửa vời, trạng thái thẻ "10025" vẫn được giữ nguyên là AVAILABLE (Không bị lỗi loạn dữ liệu). Màn hình Staff báo lỗi "Hệ thống bận, vui lòng thử lại".

### **5\. QUY TẮC NGHIỆP VỤ ĐẶC THÙ (BUSINESS RULES)**

* **BR-01 (Tính duy nhất của Phiên Hoạt động):** Tại một thời điểm, một mã thẻ (card\_code) hoặc một biển số xe (plate\_number) chỉ được phép sở hữu duy nhất **MỘT** phiên đỗ xe có trạng thái status \= 'INSIDE'. Hệ thống sẽ chặn đứng mọi nỗ lực tạo phiên mới nếu dữ liệu cũ chưa được đóng (Check-out hoặc khóa Blacklist).  
* **BR-02 (Quy định đóng dấu thời gian máy chủ):** Mọi dữ liệu liên quan đến tài chính và thời gian (check\_in\_time) bắt buộc phải do hệ thống Backend (Server-side) tự sinh tại thời điểm ghi nhận giao dịch thành công. Tuyệt đối không chấp nhận tham số thời gian truyền từ thiết bị Client lên nhằm triệt tiêu hoàn toàn rủi ro nhân viên chỉnh lùi giờ trên máy tính để gian lận tiền bạc với khách.  
* **BR-03 (Bắt buộc định danh Cổng vào):** Không có phiên đỗ xe nào được tạo ra mà trường gate\_in\_id bị bỏ trống (NULL). Mã cổng này là cơ sở dữ liệu sinh tử để hệ thống phân tích "Khung giờ cao điểm theo làn" ở Báo cáo vận hành của Manager (UC-MNG06 Khu vực 4).

### **6\. ĐẶC TẢ CẤU TRÚC JSON PAYLOAD ĐẦU RA (REST API CONTRACT)**

Để đội Dev Backend (Spring Boot) và Frontend (React) bắt tay vào code, cấu trúc API của Use Case này được quy định cứng như sau:  
**Request Payload:**

* POST /api/v1/parking-sessions

`{`  
  `"cardCode": "10025",`  
  `"plateNumber": "51G-123.45",`  
  `"vehicleType": "CAR",`  
  `"gateInId": "GATE_IN_01",`  
  `"allocatedSlot": "A05"`  
`}`

**Response Payload (Thành công \- HTTP 201 Created):**  
`{`  
  `"sessionId": "SESSION_20260614_0001",`  
  `"cardCode": "10025",`  
  `"plateNumber": "51G-123.45",`  
  `"vehicleType": "CAR",`  
  `"gateInId": "GATE_IN_01",`  
  `"allocatedSlot": "A05",`  
  `"checkInTime": "2026-06-14T11:40:22",`  
  `"sessionStatus": "INSIDE",`  
  `"message": "Tạo lượt gửi xe thành công. Mời xe di chuyển vào ô A05."`  
`}`

## **HỖ TRỢ XỬ LÝ XE RA BÃI (VEHICLE CHECK-OUT & PAYMENT)**

### **1\. THÔNG TIN CHUNG (GENERAL INFORMATION)**

* **Mã Use Case:** UC-STF03  
* **Tên Use Case:** Hỗ trợ xử lý xe ra bãi và Thu phí (Vehicle Check-out & Payment Processing).  
* **Tác nhân (Actor):** Nhân viên trực trạm ra (Staff / Gate Operator).  
* **Mục tiêu:** Tra cứu phiên đỗ xe hiện tại dựa vào mã thẻ hoặc biển số, đối chiếu an ninh lúc ra so với lúc vào. Hệ thống tự động chốt thời gian, gọi Bộ máy tính phí (Pricing Engine) để xuất hóa đơn, ghi nhận thanh toán và giải phóng tài nguyên (trả thẻ về kho, trống ô đỗ) để mở cổng cho xe rời bãi.

### **2\. TIỀN ĐIỀU KIỆN (PRECONDITIONS)**

* Nhân viên đã đăng nhập và đang mở giao diện quầy ra (Gate\_Out\_Screen), máy tính được gắn với mã cổng ra (Ví dụ: GATE\_OUT\_01).  
* Phương tiện đang có một phiên đỗ xe hợp lệ dưới hầm (status \= 'INSIDE').  
* Bảng giá và chính sách tính phí (UC-MNG05) đang ở trạng thái ACTIVE trên hệ thống.

### **3\. LUỒNG SỰ KIỆN CHÍNH (MAIN SUCCESS SCENARIO / HAPPY PATH)**

* **Bước 1 (Nhận diện & Tìm kiếm phiên đỗ):**  
  * Xe tiến vào làn Check-out. Khách hàng trả lại thẻ nhựa cho nhân viên.  
  * Nhân viên nhập mã thẻ (Card Code) vào ô tìm kiếm trên Web (Giả lập thao tác quẹt thẻ). Hệ thống truy vấn Database và lôi ra Phiên đỗ xe (parking\_sessions) đang gắn với thẻ này.  
* **Bước 2 (Đối chiếu An ninh & Nhận diện):**  
  * Màn hình Web Client của Staff hiển thị song song 2 cặp hình ảnh: **Ảnh lúc VÀO** (Lấy từ Database) và **Ảnh lúc RA** (Mô phỏng camera LPR chụp ngay tại thời điểm hiện tại).  
  * Chuỗi biển số xe lúc IN và OUT được hiển thị to, rõ. Staff đối chiếu bằng mắt thường, xác nhận đúng là cùng một chiếc xe và cùng một tài xế.  
* **Bước 3 (Chốt thời gian & Tính phí):**  
  * Staff bấm nút **"Chốt xe ra"**. Backend lập tức đóng dấu thời gian hiện tại của Server làm check\_out\_time.  
  * Backend truyền khoảng thời gian (Từ check\_in\_time đến check\_out\_time), Loại phương tiện (vehicle\_type), và Loại khách (customer\_type) vào **Thuật toán tính phí 3 lớp (UC-MNG05)**.  
  * Thuật toán chạy trong vài mili-giây và trả về Tổng tiền cước (Ví dụ: 30.000 VNĐ).  
* **Bước 4 (Hiển thị Hóa đơn & Thu tiền):**  
  * Màn hình Staff hiển thị Hóa đơn tóm tắt (Tổng thời gian đỗ, Thành tiền). Bảng LED ngoài cổng (Giả lập) cũng hiện số tiền để khách hàng nhìn thấy.  
  * Khách hàng thanh toán (Tiền mặt hoặc chuyển khoản QR Code). Staff nhận đủ tiền và bấm nút **"Xác nhận Thanh toán & Mở cổng"**.  
* **Bước 5 (Đóng gói giao dịch & Giải phóng tài nguyên):** Backend bọc tiến trình trong @Transactional để chạy các tác vụ:  
  * Cập nhật parking\_sessions: Đổi status thành COMPLETED, lưu total\_fee \= 30.000, payment\_status \= PAID.  
  * Cập nhật parking\_cards: Đổi thẻ từ IN\_USE quay về AVAILABLE, gỡ bỏ assigned\_plate, đổi is\_inside \= FALSE. (Thẻ lúc này đã sạch sẽ để nạp lại vào máy phát cổng IN).  
  * Cập nhật slots: Đổi ô đỗ xe (Ví dụ A05) từ BOOKED về lại EMPTY.  
* **Bước 6 (Hoàn tất):** Barrier mở. Màn hình Web Client chuyển về trạng thái sẵn sàng đón xe tiếp theo.

### **4\. LUỒNG THAY THẾ & NGOẠI LỆ (ALTERNATIVE / EXCEPTION FLOWS)**

* **4.1. Khách làm mất thẻ (Lost Card Exception):**  
  * *Sự kiện:* Tại Bước 1, khách báo mất thẻ, không có mã thẻ để nhập.  
  * *Xử lý:* Staff chuyển sang tab "Tìm kiếm theo Biển số". Luồng hệ thống sẽ rẽ nhánh sang **UC-MNG08 (Sub-case 1: Xử lý mất vé)** để thu thêm phụ phí phạt mất thẻ và khóa vĩnh viễn UID thẻ cũ.  
* **4.2. Lệch biển số VÀO/RA (Mismatched License Plate):**  
  * *Sự kiện:* Tại Bước 2, thẻ hợp lệ nhưng biển số lúc IN là 51G-123.45, biển số do camera đọc lúc OUT lại là 51H-999.99 (Nghi ngờ trộm xe hoặc lấy lộn thẻ).  
  * *Xử lý:* Hệ thống cảnh báo đỏ, khóa nút "Chốt xe ra". Staff kiểm tra, nếu do camera đọc sai, Staff có thể tự sửa lại biển số OUT cho khớp (gửi báo cáo về việc sửa biển số kèm ảnh lên phần báo cáo của manager về sửa biển số như ở phần check in). Nếu thực sự khác xe, Staff ấn hủy bỏ và yêu cầu khách tấp vào lề và chuyển ca xử lý cho Đội trưởng bảo vệ điều tra.

**4.3. Đối với khách Đặt chỗ trước (Booking Check-out):**

* *Sự kiện:* Khách hàng Đặt chỗ trước tiến ra cổng và trả lại thẻ cho Staff. Staff quẹt thẻ.  
* *Xử lý:* Hệ thống nhận diện đây là phiên đặt chỗ trước.  
* Nếu thời gian quẹt thẻ ra nằm trước hoặc vừa đúng bằng thời gian kết thúc đặt chỗ: total\_fee \= 0\. Màn hình Staff sáng nút "Mở cổng", không cần thu tiền.  
* Nếu đỗ lố giờ: Hệ thống tự động bóc tách phần thời gian lố giờ và áp dụng biểu giá Vãng lai. Bảng LED hiển thị số tiền lố giờ cần thanh toán. Staff bắt buộc thu đủ khoản tiền phát sinh này (Tiền mặt hoặc PayOS) trước khi bấm nút xác nhận mở cổng để thu hồi thẻ và kết thúc phiên.

### **5\. QUY TẮC NGHIỆP VỤ ĐẶC THÙ (BUSINESS RULES)**

* **BR-01 (Nguồn thời gian tuyệt đối):** Giống như lúc Check-in, mốc thời gian check\_out\_time bắt buộc phải được sinh ra từ máy chủ Backend (Server Time) ngay khoảnh khắc Staff bấm nút. Mọi dữ liệu thời gian truyền từ thiết bị Client sẽ bị từ chối để chống gian lận.  
* **BR-02 (Cấm mở cổng nếu chưa chốt công nợ):** Đối với các xe có phát sinh phí (\> 0 VNĐ), nút kích hoạt mở Barrier ảo chỉ được Enable (Sáng lên) khi và chỉ khi hệ thống đã ghi nhận thuộc tính payment\_status \= 'PAID'.  
* **BR-03 (Bảo toàn số lượng chỗ đỗ):** Phải đảm bảo quy tắc "1 xe ra, 1 chỗ trống". Ngay khi phiên Check-out hoàn tất, tổng số xe hiện tại trên bảng LED ngoài cổng lớn phải giảm đi 1, và slot đỗ tương ứng dưới hầm lập tức hiển thị màu xanh (Trống) trên màn hình Dashboard của Manager.

### **6\. ĐẶC TẢ CẤU TRÚC JSON PAYLOAD ĐẦU RA (REST API CONTRACT)**

**Request Payload (Staff gửi yêu cầu thanh toán & Mở cổng):**

* PUT /api/v1/parking-sessions/{sessionId}/checkout

{  
  "gateOutId": "GATE\_OUT\_01",  
  "paymentMethod": "CASH",   
  "isPlateCorrected": false,  
  "plateOut": "51G-123.45"  
}

**Response Payload (Hệ thống trả về sau khi tính phí và chốt DB):**  
{  
  "sessionId": "SESSION\_20260614\_0001",  
  "plateNumber": "51G-123.45",  
  "checkInTime": "2026-06-14T09:00:00",  
  "checkOutTime": "2026-06-14T11:44:00",  
  "totalDurationMinutes": 164,  
  "baseFee": 20000,  
  "incrementalFee": 10000,  
  "totalFee": 30000,  
  "paymentStatus": "PAID",  
  "message": "Thanh toán thành công. Barrier đã mở."  
}

## **HỖ TRỢ XỬ LÝ CÁC TRƯỜNG HỢP NGOẠI LỆ VÀ SỰ CỐ TẠI QUẦY**

**(MÃ PHÂN HỆ: UC-STF04 \- STAFF EXCEPTION HANDLING INTERFACE)**

### **1\. THÔNG TIN CHUNG (GENERAL INFORMATION)**

* **Mã Use Case:** UC-STF04  
* **Tên Use Case:** Hỗ trợ xử lý các trường hợp ngoại lệ trực tiếp tại quầy (Staff Exception Handling Interface).  
* **Tác nhân (Actor):** Nhân viên trực trạm quầy ra/vào (Staff), Nhân viên an ninh tuần tra (Security).  
* **Mô tả ngắn gọn:** Phân hệ cung cấp bộ công cụ giao diện trên Web Client và logic xử lý Backend phục vụ việc can thiệp, chuẩn hóa dữ liệu khi xảy ra 6 kịch bản sự cố vận hành thực tế. Module kiểm soát chặt chẽ luồng tài chính ngoại lệ, bắt buộc số hóa bằng chứng kiểm toán (ảnh chụp giấy tờ), phân tích hiệu năng camera nhận diện (LPR) và điều quản tài nguyên ô đỗ (Slot) trực quan trên sơ đồ lưới.

### **2\. TIỀN ĐIỀU KIỆN (PRECONDITIONS)**

* Nhân viên đã đăng nhập hệ thống bằng tài khoản được phân quyền STAFF hoặc SECURITY.  
* Hệ thống Web Client đang mở bảng điều khiển trung tâm xử lý sự cố (Exception\_Console\_Dashboard).  
* Biểu phí, cấu hình kho thẻ (UC-MNG10) và quy luật định tuyến trượt (UC-MNG09) đang hoạt động ổn định trên tầng server.

### **3\. LUỒNG XỬ LÝ CHI TIẾT TỪNG KỊCH BẢN NGOẠI LỆ (SUB-CASES)**

#### **3.1. Sub-case 1: XỬ LÝ MẤT THẺ XE CÓ SỐ HÓA MINH CHỨNG (LOST CARD RESOLUTION WITH DIGITAL PROOF)**

Áp dụng khi khách hàng làm rơi mất thẻ nhựa vật lý, không thể quẹt thẻ thực hiện luồng Check-out tiêu chuẩn.

* **Bước 1 (Truy vết phiên):** Khách hàng báo mất thẻ tại quầy ra. Staff truy cập Tab "Giải quyết mất vé", nhập Biển số xe thực tế của khách vào thanh tìm kiếm. Hệ thống truy vấn Database lọc ra phiên đỗ xe tương ứng có trạng thái status \= 'INSIDE'.  
* **Bước 2 (Xác thực 4 chiều):** Màn hình hiển thị ảnh chụp xe và ảnh toàn cảnh mặt tài xế lúc Check-in. Staff yêu cầu khách xuất trình Giấy tờ xe (Cà vẹt) và Giấy tờ tùy thân (CCCD) để đối chiếu ngoại quan.  
* **Bước 3 (Bắt buộc số hóa bằng chứng):** Staff sử dụng camera/webcam kết nối tại quầy chụp lại rõ nét Cà vẹt và CCCD của khách. Hệ thống tải ảnh lên máy chủ lưu trữ Cloud, sinh ra đường dẫn mã hóa proof\_document\_url.  
  * *Ràng buộc UI:* Nút "Lập hóa đơn phạt" mặc định bị ẩn/vô hiệu hóa, chỉ sáng lên khi thuộc tính proof\_document\_url nhận dữ liệu thành công (NOT NULL).  
* **Bước 4 (Tính cước & Áp phụ phí):** Staff bấm nút "Lập hóa đơn phạt mất thẻ". Backend tự động tính toán tổng hóa đơn theo công thức: \\text{Tổng tiền thu} \= \\text{Cước đỗ tích lũy (tính từ check\\\_in\\\_time đến hiện tại)} \+ \\text{Phí phạt phôi thẻ vật lý (50.000 VNĐ)}  
* **Bước 5 (Giải phóng phiên xe):** Sau khi khách thanh toán đủ tiền, Staff bấm "Xác nhận cho xe ra". Hệ thống bọc tiến trình trong một @Transactional duy nhất:  
  * Chuyển trạng thái phiên đỗ xe thành COMPLETED.  
  * Cập nhật mã chuỗi thẻ cũ thành trạng thái LOST (Khóa UID thẻ, nếu sau này khách có đến trả thẻ lại hoặc nhân viên tìm được thẻ bị mất thì manager sẽ vào tìm kiếm id thẻ đó trong phần quản lý và ấn active lại thẻ).  
  * Giải phóng ô đỗ gắn với xe về trạng thái EMPTY.  
  * Lưu hồ sơ xử lý sự cố kèm ảnh chụp minh chứng để Manager hậu kiểm đối soát.

#### **3.2. Sub-case 2: XỬ LÝ THẺ HƯ HỎNG VÀ CHẾ TÀI ĐỊNH DANH (DAMAGED CARD HANDLING & PENALTY CATEGORIZATION)**

Áp dụng khi khách trả lại thẻ lúc Check-out nhưng đầu đọc thẻ không thể nhận diện (thẻ chết chip, cong vênh, gãy vỡ).

* **Bước 1 (Truy vết phiên thủ công):** Staff nhập trực tiếp Biển số xe bằng tay để lôi phiên đỗ xe tương ứng của khách lên màn hình.  
* **Bước 2 (Phân loại nguyên nhân hỏng):** Giao diện Web hiển thị một trường Dropdown bắt buộc Staff chọn nguyên nhân tổn hại vật lý của thẻ:  
  * *Lựa chọn A \- Do hao mòn tự nhiên (Natural Wear & Tear):* Thẻ quá cũ, xước sát tự nhiên làm hỏng chip nội bộ. Hệ thống gán mức penalty\_fee \= 0 VNĐ.  
  * *Lựa chọn B \- Do lỗi người dùng (User Fault):* Thẻ bị bẻ cong, nứt gãy, biến dạng do khách hàng bảo quản sai quy định. Hệ thống tự động áp mức penalty\_fee \= 50.000 VNĐ.  
* **Bước 3 (Tải lên bằng chứng kép):**  
  * Staff bắt buộc phải chụp ảnh Giấy tờ xe/CCCD của khách để lưu vào trường proof\_document\_url.  
  * *Đặc biệt với Lựa chọn B (Lỗi người dùng):* Hệ thống bắt buộc Staff phải chụp thêm một ảnh cận cảnh vết gãy/hỏng vật lý của chiếc thẻ để lưu vào trường proof\_card\_damage\_url làm minh chứng đối thoại khi khách khiếu nại.  
* **Bước 4 (Thu tiền & Đóng thẻ):** Khách thanh toán tổng tiền (Cước tích lũy \+ Phí phạt nếu có). Staff bấm "Xác nhận cho xe ra" \\rightarrow Cổng mở. Thẻ cũ được hệ thống ngắt liên kết và đổi trạng thái thành DAMAGED (Đưa vào danh sách chờ tiêu hủy vật tư).

#### **3.3. Sub-case 3: ĐỐI SOÁT VÀ CHỈNH SỬA SAI LỆCH BIỂN SỐ TẠI CỔNG VÀO VÀ CỔNG RA (IN/OUT LPR CORRECTION PIPELINE)**

Khắc phục triệt để các sai số nhận diện ký tự của AI (LPR) do bụi bẩn hoặc lóa sáng ngay tại hai đầu chốt chặn, không rà soát thủ công dưới hầm.

* **Phân đoạn Cổng Vào (Check-in):**  
  * Xe tiến vào cổng IN. Camera chụp ảnh, AI bóc tách chuỗi biển số hiển thị lên màn hình Staff. Barrier mặc định KHÔNG mở.  
  * Staff đối chiếu chuỗi text với ảnh thực tế. Nếu thấy lệch ký tự (Ví dụ: Thực tế chữ B nhưng AI đọc thành số 8), Staff click vào ô text, sửa tay lại cho đúng thực tế rồi bấm "Xác nhận xe vào".  
  * Backend lưu phiên xe với biển số chuẩn, đồng thời đánh cờ is\_in\_plate\_corrected \= TRUE để đưa vào báo cáo hiệu suất Camera IN.  
* **Phân đoạn Cổng Ra (Check-out):**  
  * Khách quẹt thẻ tại cổng OUT. Camera OUT chụp ảnh và AI sinh ra chuỗi biển số lúc ra.  
  * Màn hình Staff lập tức hiển thị **Cơ chế đối soát chéo 4 chiều**:  
    1. Ảnh xe lúc VÀO.  
    2. Chuỗi biển số chuẩn lúc VÀO.  
    3. Ảnh xe lúc RA (Thực tế hiện tại).  
    4. Chuỗi biển số do AI đọc lúc RA.  
  * *Logic chốt chặn:* Nếu chuỗi biển số RA do AI đọc lệch so với chuỗi biển số VÀO, hệ thống lập tức nhấp nháy cảnh báo đỏ và **khóa mờ nút "Chốt xe ra"**.  
  * *Xử lý sai lệch:* Staff nhìn 2 bức ảnh, xác nhận đúng là một xe duy nhất (Không có hiện tượng tráo xe trộm cắp). Lỗi do camera OUT đọc sai ký tự. Staff nhấp chuột vào ô biển số ra, **gõ sửa lại chuỗi text RA cho khớp hoàn toàn với chuỗi biển số VÀO**.  
  * *Mở khóa tính cước:* Ngay khi chuỗi sửa đổi khớp 100% với dữ liệu lúc vào, nút "Chốt xe ra" tự động sáng lên. Staff tiến hành thu tiền cước đỗ xe bình thường. Backend lưu lịch sử giao dịch và đánh cờ is\_out\_plate\_corrected \= TRUE để đẩy vào báo cáo sai lệch Camera OUT của Manager.

#### **3.4. Sub-case 4: KIỂM SOÁT XE TỒN ĐỌNG QUÁ HẠN GỬI \> 72 GIỜ (NIGHTLY BATCH OVERSTAY INTERVENTION)**

* **Luồng xử lý ngầm (Nightly Batch Job):** Đúng **02:00 sáng mỗi đêm**, một tiến trình tự động (Cron Job) ở Backend Spring Boot kích hoạt. Hệ thống quét qua bảng dữ liệu, tìm tất cả các xe có trạng thái status \= 'INSIDE' đỗ liên tục quá 72 giờ và tự động cập nhật cờ is\_overstay \= TRUE.  
* **Luồng xử lý của Staff vào ban ngày:** Tiền cước của các xe quá hạn vẫn tiếp tục tích lũy bình thường theo thời gian, chạy thẳng xuyên ngày qua ngày khác cho đến khi chạm mức **Giá trần lưu bãi (Max Parking Cap \= 3.000.000 VNĐ)** thì hệ thống tự động đóng băng số tiền, không tăng thêm cước phạt.

#### **3.5. Sub-case 5: ĐIỀU CHỈNH XE GỬI SAI KHU VỰC TRÊN SƠ ĐỒ LƯỚI (GRID-BASED ZONE VIOLATION ADJUSTMENT)**

* **Bước 1:** Nhân viên an ninh đi tuần dưới hầm phát hiện một xe mang thẻ Vãng lai nhưng đang chiếm dụng vị trí đỗ tại khu vực dành riêng cho xe đặt trước. Bảo vệ báo số hiệu ô đỗ (Ví dụ: Ô B2-045) về cho quầy trực thông qua bộ đàm.  
* **Bước 2 (Thao tác trên Web):** Staff mở Sơ đồ lưới trực quan (Grid Map Layout) bãi xe trên trình duyệt, tìm biển số xe vi phạm đó. Staff thực hiện thao tác **nhấp chọn xe và gán (Assign) chuyển sang đúng vị trí ô đỗ thực tế B2-045**.  
* **Bước 3 (Hệ thống tự động đối soát logic vùng):** Ngay khi dữ liệu vị trí mới được ghi nhận, Backend tự động chạy hàm kiểm tra ID phân khu: \\text{Nếu } \\text{old\\\_zone\\\_id} \\neq \\text{new\\\_zone\\\_id}  
* Hệ thống ngầm kích hoạt cờ vi phạm zone\_violation \= TRUE đính kèm vào phiên đỗ xe này. Thông tin phương tiện tự động được trích xuất thẳng vào **Báo cáo Đỗ Sai Khu Vực** để phục vụ công tác nhắc nhở hoặc áp phụ phí vi phạm quy định khi xe Check-out.

#### **3.6. Sub-case 6: CẬP NHẬT TRẠNG THÁI Ô ĐỖ THỦ CÔNG (MANUAL SLOT STATUS LIFECYCLE)**

* **Bước 1:** Nhân viên an ninh báo cáo có một ô đỗ bị sự cố vật lý không thể sử dụng (Mặt sàn loang dầu, sụt lún, thiết bị chiếu sáng hỏng).  
* **Bước 2:** Staff mở Sơ đồ lưới (Grid Map), di chuột tìm đến đúng vị trí ô đỗ bị hỏng đó.  
* **Bước 3:** Staff nhấp chuột phải vào ô đỗ, hệ thống hiển thị bảng Dropdown trạng thái. Staff chọn lý do chuyển sang trạng thái MAINTENANCE (Bảo trì) và nhập văn bản giải trình ngắn.  
* **Bước 4 (Đóng băng tài nguyên):** Sau khi bấm "Xác nhận", Backend cập nhật bản ghi trong bảng slots. Thuật toán điều hướng thông minh (UC-MNG09) lập tức loại bỏ mã Slot này ra khỏi bộ lọc tìm kiếm chỗ trống theo thứ tự Alphabet, ngăn không cho xếp xe mới vào ô lỗi này.

### **4\. QUY TẮC NGHIỆP VỤ ĐẶC THÙ (BUSINESS RULES)**

* **BR-01 (Thu cước từ phút đầu tiên \- No Grace Period):** Bãi xe vận hành trên nguyên tắc tính phí tuyệt đối. Một phiên đỗ xe vãng lai ngay khi khởi tạo thành công tại cổng IN, nếu thực hiện Check-out tại cổng OUT có tổng thời gian lưu trú \\ge 1 phút, hệ thống bắt buộc tính cước trọn vẹn bằng mức Giá cơ sở (Base Fee) của Bậc 1, không có thời gian châm chước miễn phí.  
* **BR-02 (Quy tắc cô lập dữ liệu khi bấm Hủy bỏ):** Tại màn hình Check-out của Staff, nếu phát hiện thông tin xe không khớp, Staff bấm nút "Hủy bỏ" để bàn giao xe cho bảo vệ giải quyết riêng. Hành động này chỉ đóng giao diện hiển thị tại quầy ra, tuyệt đối không được sửa đổi hay xóa bất kỳ trường dữ liệu nào dưới DB. Phiên xe vẫn giữ nguyên trạng thái INSIDE và thẻ là IN\_USE nhằm bảo lưu lịch sử phục vụ công tác điều tra gian lận.  
* **BR-03 (Ràng buộc di dời ô bảo trì):** Hệ thống tuyệt đối cấm Staff chuyển một ô đỗ sang trạng thái MAINTENANCE nếu trên sơ đồ lưới ô đó vẫn đang có xe đỗ ảo (status \= 'OCCUPIED'). Quy trình bắt buộc Staff phải thực hiện luồng điều chỉnh vị trí xe sang ô đỗ trống khác trước (Áp dụng Sub-case 5), giải phóng ô cũ về trạng thái EMPTY rồi mới được kích hoạt lệnh đóng băng bảo trì.

### **5\. ĐẶC TẢ CẤU TRÚC JSON PAYLOAD ĐẦU RA (REST API CONTRACT)**

#### **5.1. API Xử lý sự cố Thẻ hỏng/Mất (POST /api/v1/parking-sessions/{sessionId}/resolve-card-issue)**

`{`  
  `"issueType": "DAMAGED",`  
  `"damageReason": "USER_FAULT",`  
  `"proofDocumentUrl": "https://storage.parking.com/proofs/doc_session_992.jpg",`  
  `"damagedCardPhotoUrl": "https://storage.parking.com/proofs/card_session_992.jpg",`  
  `"penaltyFeeApplied": 50000,`  
  `"staffId": "STF_2026_08"`  
`}`

#### **5.2. API Chỉnh sửa biển số lúc Check-out (PUT /api/v1/parking-sessions/{sessionId}/checkout)**

`{`  
  `"gateOutId": "GATE_OUT_02",`  
  `"paymentMethod": "CASH",`  
  `"plateOutReadByAI": "51G-128.45",`  
  `"plateOutCorrectedByStaff": "51G-12B.45",`  
  `"isOutPlateCorrected": true,`  
  `"staffId": "STF_2026_08"`  
`}`

#### **5.3. API Điều chỉnh xe đỗ sai vị trí vật lý (POST /api/v1/parking-sessions/{sessionId}/relocate-slot)**

`{`  
  `"currentSlotId": "SLOT_A_01",`  
  `"newActualSlotId": "SLOT_B_45",`  
  `"reportedByStaffId": "STF_2026_08"`  
`}`

*(Backend Xử lý API 5.3: Tự động so sánh vùng của SLOT\_A\_01 và SLOT\_B\_45. Nếu khác Zone, câu lệnh SQL ngầm định sẽ kích hoạt lệnh gán SET zone\_violation \= 1 xuống Database).*

## 

# Parking User / Driver

## **XEM THÔNG TIN BÃI XE VÀ TRẠNG THÁI Ô ĐỖ**

**(MÃ PHÂN HỆ: UC-USR01 \- PUBLIC PARKING LOT INFORMATION INTERFACE)**

### **1\. THÔNG TIN CHUNG (GENERAL INFORMATION)**

* **Mã Use Case:** UC-USR01  
* **Tên Use Case:** Xem thông tin bãi xe và Trạng thái ô đỗ.  
* **Tác nhân (Actor):** Khách hàng / Người gửi xe (User / Customer).  
* **Mục tiêu:** Cung cấp giao diện công khai (Public Interface) để người dùng tra cứu thông tin hành chính, nội quy biểu phí, và quan trọng nhất là số lượng chỗ đỗ còn trống theo từng loại phương tiện để quyết định có đánh xe vào bãi hay không.

### **2\. TIỀN ĐIỀU KIỆN (PRECONDITIONS)**

* Hệ thống Web công khai đang hoạt động trực tuyến, không yêu cầu đăng nhập (Public Access).  
* Dữ liệu cấu hình giá (UC-MNG05) đang được kích hoạt trên hệ thống.

### **3\. LUỒNG SỰ KIỆN CHÍNH (MAIN SUCCESS SCENARIO / HAPPY PATH)**

* **Bước 1 (Kích hoạt):** Khách hàng quét mã QR ngoài cổng hoặc truy cập URL trang chủ bãi xe.  
* **Bước 2 (Gửi yêu cầu):** Frontend (React) tự động gọi API GET /api/v1/public/parking-lot/summary.  
* **Bước 3 (Backend tổng hợp dữ liệu):** Tầng Service thực hiện:  
  * Truy xuất bảng pricing\_policies lấy biểu phí Ca Ngày/Ca Đêm hiện hành.  
  * Quét bảng slots, thực hiện đếm gộp nhóm (GROUP BY vehicle\_type) đối với các ô đỗ đang có status \= 'EMPTY'.  
* **Bước 4 (Kết xuất):** Backend trả dữ liệu JSON. Frontend render thành các khối thông tin trực quan cho khách hàng xem.

### **4\. CHI TIẾT NỘI DUNG HIỂN THỊ TRÊN GIAO DIỆN KHÁCH HÀNG**

Giao diện được thiết kế thân thiện với thiết bị di động, chia làm 3 phân khối:

#### **4.1. Khối 1: Thông tin Hành chính & Nội quy**

* **Thời gian hoạt động:** Hiển thị giờ mở cửa (Ví dụ: 24/7).  
* **Loại xe phục vụ:** Liệt kê các xe được phép (Ví dụ: Ô tô \\le 7 chỗ, Xe máy).  
* **Quy định chung:** Cảnh báo xe tồn bãi \> 72 giờ, nhắc nhở không để tài sản giá trị trên xe.

#### **4.2. Khối 2: Minh bạch hóa Biểu phí**

* **Ca Ngày (06:00 \- 22:00):** Bậc 1: "120 phút đầu tiên \= 20.000 VNĐ". Bậc 2: "Mỗi 60 phút tiếp theo \= 10.000 VNĐ".  
* **Ca Đêm (22:00 \- 06:00):** "Đồng giá ca đêm \= 50.000 VNĐ/lượt".  
* **Giá Trần:** "Tối đa 3.000.000 VNĐ / đợt lưu bãi".

#### **4.3. Khối 3: Thống kê Chỗ đỗ khả dụng theo Phương tiện (Vehicle-Based Availability)**

Đây là khối thông tin to và rõ ràng nhất trên màn hình, giúp tài xế lướt qua 1 giây là nắm được tình hình. Bỏ qua hoàn toàn khái niệm Tầng/Zone phức tạp.

* 🚗 **Ô TÔ (CAR):** Trống **45** chỗ. *(Nếu số chỗ \\le 5, đổi màu thẻ sang Đỏ/Cam nhấp nháy chữ "SẮP ĐẦY" để cảnh báo).*  
* 🛵 **XE MÁY (MOTORBIKE):** Trống **210** chỗ.  
* 🚲 **XE ĐẠP ĐIỆN (E-BIKE):** Trống **15** chỗ.

### **5\. QUY TẮC NGHIỆP VỤ ĐẶC THÙ (BUSINESS RULES)**

* **BR-01 (Cập nhật Real-time):** Số lượng ô trống phải được đồng bộ liên tục (WebSockets hoặc Polling). Khi có xe vào/ra thành công tại cổng, con số trên điện thoại của khách hàng đang đứng ngoài cổng phải tự động nhảy/giảm tương ứng.  
* **BR-02 (Loại trừ tài nguyên đóng băng):** Thuật toán đếm số chỗ trống trả về cho khách bắt buộc chỉ đếm các ô đỗ thực sự có thể phục vụ: \\text{Số chỗ hiển thị} \= \\text{Tổng Slot (Theo loại xe)} \- \\text{Slot đã có xe} \- \\text{Slot đang Bảo trì (MAINTENANCE)}  
* **BR-03 (Bảo mật cấu trúc bãi):** Hệ thống API Public tuyệt đối **KHÔNG** trả về dữ liệu cấu trúc hầm (Có bao nhiêu tầng, bao nhiêu Zone, mã Slot là gì) để phòng ngừa kẻ xấu phân tích hạ tầng vật lý của bãi xe. Chỉ trả về 1 con số tổng hợp duy nhất cho từng loại xe.

### **6\. ĐẶC TẢ CẤU TRÚC JSON RESPONSE PAYLOAD (PUBLIC REST API CONTRACT)**

API được làm phẳng (Flattened) và giấu hoàn toàn mảng floors/zones phức tạp.  
**Request:** GET /api/v1/public/parking-lot/summary  
**Response Payload (Thành công \- HTTP 200 OK):**  
`{`  
  `"parkingLotName": "Hệ thống Bãi xe Thông minh Trung tâm",`  
  `"operatingHours": "24/7",`  
  `"pricingSummary": {`  
    `"dayShift": {`  
      `"startTime": "06:00",`  
      `"endTime": "22:00",`  
      `"baseRate": "20000 VNĐ cho 120 phút đầu",`  
      `"incrementalRate": "10000 VNĐ cho mỗi 60 phút tiếp theo"`  
    `},`  
    `"nightShift": {`  
      `"startTime": "22:00",`  
      `"endTime": "06:00",`  
      `"flatRate": "50000 VNĐ trọn gói ca đêm"`  
    `},`  
    `"maxParkingCap": "3000000 VNĐ / tháng"`  
  `},`  
  `"availability": [`  
    `{`  
      `"vehicleType": "CAR",`  
      `"vehicleName": "Ô tô",`  
      `"availableSlots": 45,`  
      `"statusIndicator": "GREEN"`  
    `},`  
    `{`  
      `"vehicleType": "MOTORBIKE",`  
      `"vehicleName": "Xe máy",`  
      `"availableSlots": 210,`  
      `"statusIndicator": "GREEN"`  
    `},`  
    `{`  
      `"vehicleType": "E_BIKE",`  
      `"vehicleName": "Xe đạp/Xe máy điện",`  
      `"availableSlots": 3,`  
      `"statusIndicator": "RED"`  
    `}`  
  `]`  
`}`

## **GỬI XE THEO LƯỢT VÀ THANH TOÁN**

**(MÃ PHÂN HỆ: UC-USR02 \- WALK-IN PARKING JOURNEY)**

### **1\. THÔNG TIN CHUNG (GENERAL INFORMATION)**

* **Mã Use Case:** UC-USR02  
* **Tên Use Case:** Gửi xe theo lượt (Walk-in Parking Journey).  
* **Tác nhân (Actor):** Khách hàng vãng lai (Walk-in Customer).  
* **Mục tiêu:** Mô tả hành trình xuyên suốt của một khách hàng từ lúc lái xe tiến vào cổng (nhận thẻ/mã định danh, nhận điều hướng), đỗ xe, cho đến lúc tiến ra cổng (trả thẻ, xem cước phí, thanh toán và rời bãi).

### **2\. TIỀN ĐIỀU KIỆN (PRECONDITIONS)**

* Khách hàng điều khiển phương tiện hợp lệ theo quy định của bãi xe (UC-USR01).  
* Bãi xe đang ở trạng thái còn ô đỗ khả dụng đối với loại phương tiện của khách.  
* Khách hàng không nằm trong danh sách đen (Blacklist \- Nợ cước/Trốn vé).

### **3\. LUỒNG SỰ KIỆN CHÍNH (MAIN SUCCESS SCENARIO / HAPPY PATH)**

Hành trình của khách hàng được chia làm 2 giai đoạn tách biệt:

#### **Phân đoạn 1: Tiến vào bãi (Check-in & Routing)**

* **Bước 1 (Dừng chờ):** Khách hàng lái xe đến dốc hầm, dừng đúng vạch tại cổng Check-in.  
* **Bước 2 (Ghi nhận):** Hệ thống Camera tự động chụp ảnh và đọc biển số. Khách hàng chờ nhân viên tại quầy đối chiếu (khoảng 2-3 giây).  
* **Bước 3 (Nhận định danh):** Khách hàng nhận một **Thẻ nhựa RFID** (Thẻ vãng lai) từ tay nhân viên trực trạm (hoặc rút từ máy phát thẻ tự động).  
* **Bước 4 (Nhận điều hướng):** Khách hàng quan sát Bảng LED điện tử lớn đặt ngay trước Barrier. Bảng hiển thị thông điệp chỉ dẫn vị trí đỗ cụ thể (Ví dụ: BKS: 51G-123.45 | MỜI VÀO TẦNG B1 \- Ô ĐỖ A05).  
* **Bước 5 (Đỗ xe):** Barrier tự động mở. Khách hàng lái xe qua cổng, di chuyển theo các biển báo dưới hầm để tìm đến đúng ô đỗ A05 đã được chỉ định và để xe tại đó.

#### **Phân đoạn 2: Rời khỏi bãi (Check-out & Payment)**

* **Bước 1 (Trình diện):** Khách hàng lấy xe, lái đến cổng Check-out và dừng tại vạch.  
* **Bước 2 (Trả định danh):** Khách hàng giao lại Thẻ nhựa RFID cho nhân viên trực trạm. Camera hệ thống tiến hành chụp ảnh và nhận diện biển số lúc ra.  
* **Bước 3 (Nhận thông báo cước):** Sau khi nhân viên chốt phiên, Bảng LED điện tử trước mặt khách hàng lập tức hiển thị thông tin hóa đơn minh bạch:  
  * Biển số xe: 51G-123.45  
  * Thời gian đỗ: 2 giờ 15 phút  
  * Tổng tiền: 30.000 VNĐ  
* **Bước 4 (Thanh toán):** Khách hàng thực hiện thanh toán. Có 2 phương thức:  
  * *Tiền mặt:* Đưa tiền trực tiếp cho nhân viên.  
  * *Chuyển khoản QR:* Khách hàng mở App ngân hàng quét **Mã QR Động (Dynamic QR)** hiển thị trên màn hình LCD xoay về phía khách (Mã QR này đã nhúng sẵn số tiền 30.000 VNĐ và nội dung chuyển khoản).  
* **Bước 5 (Hoàn tất):** Nhân viên xác nhận đã nhận tiền \\rightarrow Barrier mở \\rightarrow Khách hàng lái xe rời khỏi bãi.

### **4\. LUỒNG THAY THẾ & NGOẠI LỆ (ALTERNATIVE / EXCEPTION FLOWS)**

* **4.1. Bãi xe hết chỗ (Lot Full):**  
  * Khi khách hàng tiến đến cổng, Bảng LED hiển thị chữ Đỏ: BÃI ĐẦY \- XIN LỖI QUÝ KHÁCH.  
  * Nhân viên ra hiệu từ chối tiếp nhận. Khách hàng bắt buộc phải quay đầu xe rời đi, không được cấp thẻ.  
* **4.2. Khách hàng làm mất thẻ hoặc hỏng thẻ (Lost/Damaged Card):**  
  * Tại cổng ra, khách hàng không có thẻ để trả. Khách hàng phải báo cáo sự cố cho nhân viên.  
  * Khách hàng có **nghĩa vụ xuất trình Giấy đăng ký xe (Cà vẹt) và CCCD chính chủ** để nhân viên chụp ảnh lưu hồ sơ.  
  * Khách hàng phải thanh toán Tổng tiền bao gồm: Cước đỗ xe \+ Phí bồi thường mất/hỏng thẻ (Ví dụ: 50.000 VNĐ).  
* **4.3. Khách hàng đỗ sai vị trí được chỉ định (Zone Violation):**  
  * Khi vào bãi, khách được chỉ định ô A05 (Khu Vãng lai) nhưng lại tự ý đỗ vào ô C12 được đặt trước.  
  * Tại cổng ra, trên Bảng LED hiển thị thêm một khoản **Phụ phí đỗ sai quy định**. Khách hàng bắt buộc phải thanh toán khoản phạt này cùng với cước phí thông thường mới được mở cổng.  
* **4.4. Khách hàng thuộc danh sách nợ cước (Blacklisted Vehicle):**  
  * Khách hàng từng có hành vi bám đuôi xe trước vượt trạm trốn vé ở lượt gửi trong quá khứ.  
  * Ở lượt gửi này, khi vừa dừng tại cổng IN, Barrier khóa cứng. Bảng LED hiển thị: XE NỢ CƯỚC \- VUI LÒNG THANH TOÁN.  
  * Khách hàng bắt buộc phải thanh toán khoản nợ của phiên trước đó cho nhân viên thì mới được hệ thống gỡ khóa, cấp thẻ mới và cho phép vào bãi.

### **5\. QUY TẮC VÀ NGHĨA VỤ CỦA KHÁCH HÀNG (CUSTOMER OBLIGATIONS)**

* **BR-01 (Nghĩa vụ bảo quản định danh):** Thẻ RFID là tài sản của bãi xe và là chứng từ duy nhất để xác định quyền lấy xe. Khách hàng chịu hoàn toàn trách nhiệm bảo quản thẻ nguyên vẹn (không bẻ cong, không để gần nguồn nhiệt). Nếu mất hoặc hỏng, khách hàng phải chịu chế tài phạt theo quy định.  
* **BR-02 (Không có thời gian miễn phí \- No Grace Period):** Khách hàng đồng ý với chính sách thu phí tuyệt đối. Ngay sau khi nhận thẻ và qua cổng IN, nếu khách hàng quay đầu ra ngay (thời gian đỗ \\ge 1 phút), khách hàng vẫn phải thanh toán cước phí bằng mức Giá cơ sở Bậc 1\.  
* **BR-03 (Quyền từ chối phục vụ):** Bãi xe (thông qua phần mềm và nhân viên) có quyền từ chối phục vụ và không mở Barrier cho khách hàng tiến vào hầm nếu phương tiện vi phạm danh sách đen, hệ thống báo lỗi quá tải, hoặc xe có dấu hiệu không an toàn (rò rỉ xăng dầu).

### **6\. CÁC ĐIỂM CHẠM GIAO DIỆN VẬT LÝ / SỐ HÓA (CUSTOMER TOUCHPOINTS)**

Để phục vụ tốt Use Case này, hệ thống giả lập Web Client sẽ cần thiết kế thêm một "Màn hình hiển thị phụ" (Customer Facing Display) đóng vai trò như các thiết bị IoT tại trạm:

1. **Bảng LED Chỉ dẫn Cổng Vào (In-Gate LED Mockup):**  
   * Dòng 1: Biển số xe AI vừa nhận diện (Màu Xanh lá).  
   * Dòng 2: Vị trí Slot chỉ định (Màu Vàng).  
2. **Màn hình LCD Hiển thị cước Cổng Ra (Out-Gate LCD Mockup):**  
   * Chia làm 2 nửa màn hình.  
   * Nửa trái: Hiển thị chi tiết Bill (Thời gian vào, Thời gian ra, Cước phí cơ sở, Phí lũy tiến, Phụ phí phạt nếu có, Tổng tiền).  
   * Nửa phải: Hiển thị Mã QR Code thanh toán chuyển khoản chuẩn VietQR (được API sinh ra tự động khớp với số tiền của Bill).

## ĐẶT CHỖ TRƯỚC (PRE-BOOKING)

## **1\. TỔNG QUAN PHÂN HỆ (MODULE OVERVIEW)**

* **Mục tiêu:** Cho phép khách hàng tìm kiếm, đặt chỗ và thanh toán trực tuyến trước 100% để giữ đích danh một ô đỗ trên sơ đồ lưới (Grid Map). Hệ thống tự động quản lý vòng đời đỗ xe theo cơ chế hướng sự kiện thời gian (Event-Driven), tối ưu hóa hiệu năng máy chủ, tự động điều phối nhân sự khi có xung đột vị trí vật lý, và quản lý doanh thu bằng mô hình sổ cái kép (Double-Entry Ledger).  
* **Tác nhân (Actors):** \* Khách hàng (Sử dụng Web/Mobile App xây dựng bằng React).  
  * Nhân viên điều phối / Bảo vệ (Sử dụng React Dashboard).  
  * Quản lý / Kế toán (Sử dụng Admin Dashboard).  
  * Hệ thống nhận diện AI Camera.  
* **Nền tảng công nghệ:** Spring Boot (Backend API & Logic), React (Frontend UI & State Management), WebSockets (Real-time Notification).

## **2\. CẤU HÌNH THÔNG SỐ ĐỘNG (DYNAMIC CONFIGURATION)**

Mọi ranh giới thời gian kiểm tra tính hợp lệ (Validation) tuyệt đối không được gắn chết (hardcode) trong mã nguồn. Toàn bộ thông số được lưu dưới dạng Key-Value trong bảng system\_configs, nạp lên RAM (Bộ nhớ đệm Cache) của Spring Boot và cho phép Manager thay đổi trực tiếp trên giao diện React Admin.

| Key (Mã cấu hình) | Ý nghĩa (Hiển thị trên UI) | Định dạng | Giá trị minh họa |
| :---- | :---- | :---- | :---- |
| BOOKING\_PREP\_TIME\_MINS | Thời gian hệ thống tự động khóa ô đỗ / Cảnh báo nhân viên chuẩn bị dọn bãi (Đồng thời là thời gian tối thiểu khách phải đặt trước giờ vào). | INT | 30 (Phút) |
| BOOKING\_MAX\_ADVANCE\_HOURS | Khung thời gian tương lai tối đa cho phép đặt trước. | INT | 24 (Giờ) |
| BOOKING\_MAX\_DURATION\_HOURS | Thời lượng đỗ tối đa cho phép trong 1 phiên đặt chỗ. | INT | 12 (Giờ) |

## **3\. KIẾN TRÚC DỮ LIỆU & TOÀN VẸN TÀI CHÍNH (DOUBLE-ENTRY LEDGER)**

Để phục vụ việc kiểm toán tài chính, đối soát dòng tiền chính xác tuyệt đối và loại bỏ hoàn toàn các hàm tính toán phức tạp khi xuất báo cáo, kiến trúc dữ liệu được chia làm 2 bảng rạch ròi:

### **3.1. Bảng Nghiệp vụ (reservations)**

Lưu trữ trạng thái logic và nghiệp vụ của phiên đặt chỗ.

* id (Primary Key)  
* license\_plate (VARCHAR): Biển số xe đăng ký.  
* slot\_id (Foreign Key $\\rightarrow$ slots): Ô đỗ đích danh được giữ.  
* start\_time & end\_time (DATETIME): Khung giờ đặt chỗ.  
* gross\_amount (DECIMAL): Số tiền thanh toán 100% lúc đầu (Ví dụ: 50.000).  
* refund\_amount (DECIMAL): Số tiền thực tế hoàn trả lại cho khách khi hủy lịch (Mặc định \= 0).  
* penalty\_amount (DECIMAL): Số tiền bãi xe tịch thu làm phí phạt vi phạm chính sách hủy (Mặc định \= 0).  
* refund\_bank\_account & refund\_bank\_name (VARCHAR): Thông tin tài khoản ngân hàng do khách nhập lúc hủy để Kế toán thao tác chuyển tiền.  
* status (ENUM): PAID (Đã thanh toán), PENDING\_FULL\_REFUND (Chờ hoàn 100%), PENDING\_HALF\_REFUND (Chờ hoàn 50%), REFUNDED (Đã hoàn tiền xong), CANCELLED\_NO\_REFUND (Hủy mất cọc), IN\_PARKING (Đang đỗ trong bãi), COMPLETED (Đã hoàn tất và ra bãi), COMPLETED\_UNUSED (Hết giờ nhưng khách không đến).  
* is\_overstaying (BOOLEAN): Cờ đánh dấu khách đỗ lố giờ (Mặc định \= FALSE).
* canceled\_reason (NVARCHAR): Lý do hủy: COMPLETED\_UNUSED, USER\_CANCELLED, PAYMENT\_FAILED.

### **3.2. Bảng Sổ cái Dòng tiền (transactions)**

Tuân thủ nguyên tắc kế toán bất biến: **Tuyệt đối không dùng lệnh UPDATE số tiền tại bảng này, chỉ dùng lệnh INSERT.**

* id (Primary Key)  
* reservation\_id (Foreign Key)  
* type (ENUM): PAYMENT (Thu tiền đặt chỗ), REFUND (Hoàn tiền cho khách), OVERSTAY\_FEE (Thu thêm phí vãng lai do ra trễ).  
* amount (DECIMAL): Giá trị dòng tiền (**Thu vào ghi số Dương \+, Hoàn trả ra ghi số Âm \-**).

## **4\. LUỒNG NGHIỆP VỤ THEO TRỤC THỜI GIAN (TIMELINE-DRIVEN WORKFLOWS)**

Toàn bộ vòng đời của một phiên Booking được điều khiển bằng TaskScheduler của Spring Boot nhằm tự động kích hoạt mã nguồn chính xác theo các mốc thời gian, loại bỏ hoàn toàn việc dùng vòng lặp quét Database (Zero Polling).

### **Luồng 4.1: Đặt chỗ thành công (Thời điểm T \- 24 giờ đến T \- 30 phút)**

1. Khách chọn ô đỗ (VD: P-12), chọn khung giờ (VD: 14:00 \- 16:00), thực hiện thanh toán trực tuyến thành công 50.000 VNĐ.  
2. Spring Boot thực thi giao dịch (@Transactional):  
   * Lưu reservations với trạng thái PAID.  
   * Ghi nhận dòng tiền vào transactions: type \= 'PAYMENT', amount \= \+50000.  
3. Spring Boot gọi TaskScheduler đăng ký một tác vụ hẹn giờ chạy vào đúng **13:30** (Mốc: start\_time \- BOOKING\_PREP\_TIME\_MINS).

### **Luồng 4.2: Tự động hóa chuẩn bị & Điều phối dọn bãi (Thời điểm 13:30)**

Đúng 13:30, tác vụ hẹn giờ kích hoạt, kiểm tra trạng thái vật lý trên phần mềm của ô P-12 và chia làm 2 trường hợp:

* **Trường hợp A (Ô ĐANG TRỐNG \- Xử lý tự động 100%):**  
  * Hệ thống nhận diện ô P-12 không có xe.  
  * Spring Boot tự động chạy lệnh: UPDATE slots SET status \= 'RESERVED' WHERE id \= 'P-12';.  
  * Không bắn bất kỳ thông báo nào. Màn hình Grid Map của bãi xe tự động đổi ô P-12 sang màu báo hiệu Đã đặt.  
* **Trường hợp B (Ô ĐANG VƯỚNG XE \- Điều phối nhân sự):**  
  * Hệ thống phát hiện đang có xe vãng lai tại P-12.  
  * Spring Boot bắn WebSocket Push Notification lên màn hình React của Bảo vệ: *"CẢNH BÁO: Ô P-12 đang vướng xe. Yêu cầu dời xe sang ô khác để chuẩn bị đón khách Booking lúc 14:00\!"*.  
  * Bảo vệ xuống hầm, lái xe vãng lai sang ô trống (VD: P-15). Đặt biển báo "Đã đặt chỗ" tại ô P-12.  
  * Trên phần mềm, Bảo vệ thao tác tính năng **\[Dời xe\]**, chọn dời từ P-12 sang P-15 và bấm **Lưu**.  
  * **Hệ thống tự động xử lý khi bấm Lưu:** Bọc trong 1 Transaction, hệ thống vừa chuyển Session xe vãng lai sang P-15 (chuyển sang trạng thái OCCUPIED), vừa TỰ ĐỘNG lật trạng thái ô cũ P-12 thành RESERVED ngay lập tức.

**Luồng 4.3: Khách Đặt trước đến Check-in (Thời điểm 14:00)**

1. Xe tiến vào làn Check-in. Camera AI quét biển số.  
2. Spring Boot đối chiếu thấy biển số khớp với một đơn Booking đang ở trạng thái PAID và đúng khung giờ hợp lệ.  
3. Màn hình của Nhân viên trực trạm (Staff) lập tức hiển thị thông báo xanh: *"Xe đã Đặt chỗ trước hợp lệ \- Vui lòng cấp thẻ định danh"*.  
4. **Cấp phát thẻ vật lý:** Staff lấy một thẻ RFID trống (trạng thái AVAILABLE) quẹt vào đầu đọc. Hệ thống Backend tự động:  
   * Chuyển trạng thái thẻ sang IN\_USE.  
   * Liên kết mã thẻ này vào đơn Booking của khách.  
   * Lật trạng thái đơn Booking thành IN\_PARKING. Trạng thái ô đỗ (VD: P-12) lật thành OCCUPIED.  
5. Staff đưa thẻ vật lý cho tài xế, Barrier mở cho xe tiến vào đúng ô đã giữ. Hệ thống gọi TaskScheduler đăng ký tác vụ chốt sổ vào thời điểm kết thúc đặt chỗ (16:00).

### **Luồng 4.4: Sự kiện Chốt sổ khi Hết giờ đặt (Thời điểm 16:00)**

Đúng 16:00, TaskScheduler thức dậy và kiểm tra trạng thái đơn đặt chỗ hiện tại để phân xử:

* **Trường hợp 1.1 (Đã Check-out sớm):** \* *Dấu hiệu:* Trạng thái đơn đã là COMPLETED.  
  * *Hành động:* Hệ thống **BỎ QUA (SKIP)** hoàn toàn. Tiến trình tự kết thúc.  
* **Trường hợp 1.2 (Khách không đến \- No Show):**  
  * *Dấu hiệu:* Trạng thái đơn vẫn là PAID. Chú ý: Hệ thống bắt buộc phải **giữ nguyên slot cho khách đến tận phút cuối cùng của endTime (16:00)** vì khách đã thanh toán 100%.  
  * *Hành động phần mềm:* Ngay khi qua phút 16:00, lật trạng thái đơn thành COMPLETED\_UNUSED. Tự động giải phóng ô P-12 về trạng thái AVAILABLE. Áp dụng chính sách No Refund (0%).  
  * *Hành động điều phối:* Bắn thông báo cho Bảo vệ: *"Khách không đến. Vui lòng đến ô P-12 thu hồi biển báo Đặt chỗ mang về kho\!"*. Bảo vệ ra thu biển, trả lại không gian cho xe vãng lai.  
* **Trường hợp 2 (Khách đang đỗ lố giờ):**  
  * *Dấu hiệu:* Trạng thái đơn là IN\_PARKING.  
  * *Hành động phần mềm:* Đánh cờ ngầm `is_overstaying = TRUE` vào Database. Đồng thời, kích hoạt một Event đẩy qua Message Broker (Kafka/RabbitMQ) để bắn Notification cho Khách hàng (Nhắc nhở lố giờ) và hiển thị cảnh báo trên màn hình của Bảo vệ.

**Luồng 4.5: Check-out và Thu phí phát sinh lố giờ (Đối với xe Booking)**

1. Khách lái xe ra cổng chính. Khách hàng **bắt buộc phải trả lại thẻ nhựa RFID** cho nhân viên trực trạm.  
2. Nhân viên quẹt thẻ vào hệ thống. Backend lôi ra phiên đỗ xe Đặt trước tương ứng. Camera AI chụp ảnh đối chiếu an ninh lúc ra.  
3. **Phân xử cước phí:**  
   * **Nếu ra đúng giờ (Current Time \<= end\_time):** Hệ thống báo phí \= 0 VNĐ.  
   * **Nếu đỗ lố giờ (Cờ is\_overstaying \= TRUE):** Thuật toán cắt lấy số phút lố giờ (VD: 90 phút) truyền vào Bộ máy tính cước khách vãng lai. Màn hình React báo thu tiền phát sinh (VD: 20.000 VNĐ). Khách thực hiện thanh toán qua mã QR động (PayOS) hoặc tiền mặt tại cổng.  
4. Nhân viên bấm Xác nhận. Hệ thống lật trạng thái đơn thành COMPLETED. Trạng thái thẻ RFID lập tức trả về AVAILABLE (Để xoay vòng). Barrier mở cho xe ra.

## **5\. LUỒNG HỦY ĐẶT CHỖ & HOÀN TIỀN THỦ CÔNG (3-TIER CANCELLATION)**

Hệ thống sử dụng luồng Manual Refund (Kế toán chuyển khoản thủ công) để đảm bảo dòng tiền được kiểm soát 100%.

| Kịch bản Hủy | Điều kiện | Phí Phạt | Tiền Hoàn | Quy trình Hệ thống & Giao diện Kế toán |
| :---- | :---- | :---- | :---- | :---- |
| **1\. Hủy Sớm** | Bấm Hủy **trước** start\_time $\> 30$ phút | 0% | **100%** | Ô đỗ lập tức trả về AVAILABLE. Đơn vào danh sách PENDING\_FULL\_REFUND. Kế toán chuyển 100% tiền qua App ngân hàng $\\rightarrow$ Bấm "Xác nhận" trên React. DB sinh dòng tiền ÂM 100%. Đơn lật thành REFUNDED. |
| **2\. Hủy Sát Giờ** | Bấm Hủy **trong vòng** 30 phút trước start\_time | 50% | **50%** | Ô đỗ lập tức trả về AVAILABLE. Đơn vào danh sách PENDING\_HALF\_REFUND. Kế toán chuyển khoản 50% tiền $\\rightarrow$ Bấm "Xác nhận". DB sinh dòng tiền ÂM 50%. Bãi xe giữ lại 50% làm doanh thu phạt. |
| **3\. Hủy Sau Giờ / Quá Giờ** | Bấm Hủy sau start\_time, hoặc hệ thống tự đóng (No Show) | 100% | **0%** | Ô đỗ lập tức trả về AVAILABLE. Đơn lật thành CANCELLED\_NO\_REFUND (hoặc COMPLETED\_UNUSED). Kế toán không cần thao tác. DB không sinh thêm dòng tiền hoàn. |

## **6\. XỬ LÝ CÁC NGOẠI LỆ HỆ THỐNG TRIỆT ĐỂ (EXCEPTION HANDLING)**

### **Ngoại lệ 6.1: Tranh chấp đặt chỗ (Race Condition / Concurrency)**

* **Tình huống:** Hai user cùng bấm thanh toán giữ ô P-12 tại cùng một phần triệu giây.  
* **Xử lý (Pessimistic / Optimistic Locking):** Spring Boot sử dụng cơ chế Khóa Database (cột @Version). Giao dịch đến sau dù chỉ 1 mili-giây sẽ đối chiếu thấy Version của ô P-12 đã thay đổi, lập tức bị Spring Boot Rollback toàn bộ dữ liệu. Giao diện React hiển thị: *"Rất tiếc\! Vị trí này vừa có người đặt. Vui lòng chọn vị trí khác."* Tuyệt đối không có hiện tượng lưu đè.

### **Ngoại lệ 6.2: Khử bóng ma tác vụ hẹn giờ (Ghost Task Double-Check)**

* **Tình huống:** Khách đặt lịch ngày mai (đã lên lịch hẹn giờ 13:30 báo dọn bãi), nhưng 11:00 hôm nay khách đã bấm Hủy. Tác vụ hẹn giờ vẫn nằm trong RAM.  
* **Xử lý (Pre-execution Validation):** Khi TaskScheduler thức dậy lúc 13:30, dòng code đầu tiên bắt buộc thực thi là đối chiếu DB: IF (status \== 'PAID'). Do khách đã hủy (status hiện tại là PENDING\_FULL\_REFUND), thuật toán lập tức gọi return, tác vụ tự động kết thúc trong im lặng, không phát sinh bất kỳ cảnh báo rác nào xuống màn hình của Bảo vệ.

### **Ngoại lệ 6.3: AI Camera đọc sai biển số lúc Check-in (OCR Error)**

* **Tình huống:** Biển số 51G-12345 bị dính bùn, AI đọc thành 51G-1234S. Barrier đóng cứng.  
* **Xử lý (Staff Override/Force Match):** 1\. Bảo vệ mở React Dashboard, gõ tay 12345 vào thanh tìm kiếm.  
  2\. Hệ thống tìm thấy lịch Booking hợp lệ. Bảo vệ bấm nút **\[Ép khớp (Force Match)\]**.  
  3\. Spring Boot ghi đè log AI, kết nối phiên đỗ hiện tại với lịch Booking và ra lệnh mở cổng.

### **Ngoại lệ 6.4: Đảm bảo Toàn vẹn (ACID) & Báo cáo Tốc độ cao**

* Mọi hành động thao tác dữ liệu đều bọc trong @Transactional.  
* Manager xem Báo cáo doanh thu trên React Dashboard không sử dụng vòng lặp tính toán. Spring Boot truy vấn $O(1)$ bằng lệnh SQL thuần túy:  
  * Tổng tiền thực tế: SELECT SUM(amount) FROM transactions; (Số dương trừ số âm tự động khớp với số dư tài khoản ngân hàng).  
  * Tổng tiền phạt từ đơn hủy/No show: SELECT SUM(penalty\_amount) FROM reservations;

## **QUẢN LÝ VÉ THÁNG VÀ ĐỊNH TUYẾN KHU VỰC**

**(MÃ PHÂN HỆ: UC-MNG08 \- MONTHLY SUBSCRIPTION & SMART ZONE ROUTING)**

### **2\. TỔNG QUAN PHÂN HỆ (MODULE OVERVIEW)**

* **Mã Use Case:** UC-MNG08  
* **Tên Use Case:** Quản lý Vé tháng, Kiểm soát chống nhân bản và Định tuyến Zone tự động.  
* **Tác nhân:** Quản lý (Manager), Khách hàng (User), Hệ thống tự động (Cron Job).  
* **Mục tiêu:** Xây dựng luồng đăng ký vé tháng định danh độc quyền (1 Vé \- 1 Biển số). Tự động điều hướng xe vé tháng vào khu vực đỗ xe chuyên dụng, hỗ trợ cơ chế tràn bãi (Overflow) sang khu vực vãng lai, và tự động cảnh báo Ban quản lý nới rộng không gian khi tỷ lệ đăng ký vượt ngưỡng an toàn.

### **3\. KIẾN TRÚC VẬN HÀNH CỐT LÕI (CORE MECHANISMS)**

Hệ thống được vận hành dựa trên 4 trụ cột logic nghiệp vụ độc lập:  
**3.1. Cơ chế Định tuyến và Tràn Zone (Smart Routing & Overflow)**

* Khi xe vé tháng quẹt thẻ/nhận diện biển số tại cổng IN, hệ thống ưu tiên chỉ định xe vào ZONE\_MONTHLY (Khu vực dành riêng cho vé tháng). Bảng LED sẽ hiện chữ hướng dẫn: *"Xin mời di chuyển vào Khu vực B1"*.  
* Hệ thống liên tục đếm số lượng xe đang ở trong ZONE\_MONTHLY. Nếu Zone này đạt 100% sức chứa, hệ thống tự động bẻ lái, điều hướng chiếc xe vé tháng đó tràn sang ZONE\_TRANSIENT (Khu vực vãng lai).

**3.2. Cơ chế Chống nhân bản Biển số (Anti-Cloning / Anti-Passback)**

* Mỗi biển số chỉ mang một trạng thái tồn tại duy nhất: INSIDE (Trong bãi) hoặc OUTSIDE (Ngoài bãi).  
* Nếu hệ thống ghi nhận biển số 51G-12345 đang có trạng thái INSIDE, mà tại cổng IN lại có một chiếc xe mang đúng biển số đó đòi vào (Biển số giả, thẻ giả), Barrier sẽ khóa cứng. Còi báo động kêu và màn hình Staff hiện cảnh báo: *"Biển số đang tồn tại trong bãi. Phát hiện nghi vấn nhân bản, yêu cầu an ninh kiểm tra"*.

**3.3. Cơ chế Quản trị Ngưỡng Sức chứa (Threshold Capacity Alert)**

* Để tránh tình trạng bán vé tháng quá tay (Overselling) dẫn đến khách vé tháng lúc nào cũng phải tràn sang bãi vãng lai, Manager cấu hình một tỷ lệ an toàn, ví dụ: Số lượng Slot của ZONE\_MONTHLY phải $\\ge$ 110% Tổng số vé tháng đang Active.  
* Mỗi khi có một khách đăng ký mua mới vé tháng, Backend sẽ tính toán lại tỷ lệ này. Nếu tổng lượng vé bán ra làm sức chứa tụt xuống dưới ngưỡng an toàn, hệ thống lập tức bắn thông báo đỏ lên Dashboard của Manager: *"Cảnh báo: Lượng vé tháng đang tăng cao. Yêu cầu cấu hình nới rộng thêm Slot cho Zone Vé Tháng"*.

**3.4. Cơ chế Dọn dẹp Tự động (Nightly Cleanup Job)**

* Định kỳ vào **02:00 AM** mỗi đêm, một tiến trình ngầm (Cron Job) sẽ khởi chạy.  
* Tiến trình quét toàn bộ bảng vé tháng. Bất kỳ vé nào có valid\_to \< Thời gian hiện tại, hệ thống lập tức cập nhật trạng thái status \= 'INACTIVE'. Xe mang biển số này sáng hôm sau đi làm sẽ bị tính phí vãng lai hoàn toàn tự động.

### **4\. LUỒNG SỰ KIỆN CHÍNH (MAIN SUCCESS SCENARIOS)**

#### **4.1. Đăng ký và Giám sát sức chứa**

* **Bước 1:** Khách hàng điền form đăng ký vé tháng, gắn duy nhất 1 biển số xe (VD: 51G-88888) và thanh toán thành công.  
* **Bước 2:** Backend tạo bản ghi monthly\_tickets trạng thái ACTIVE.  
* **Bước 3:** Backend chạy hàm kiểm tra sức chứa: (Số lượng Slot Zone Tháng) / (Tổng số vé ACTIVE).  
* **Bước 4:** Nếu tỷ lệ tính ra là 105% (Nhỏ hơn cấu hình ngưỡng 110% do Manager cài đặt), tạo ngay một Notification gửi đến Web Admin của Manager yêu cầu quy hoạch thêm không gian.

#### **4.2. Khách Vé Tháng Check-in tại cổng**

* **Bước 1:** Camera LPR đọc biển 51G-88888.  
* **Bước 2:** Backend kiểm tra Database: Biển số này có vé tháng ACTIVE và trạng thái đang là OUTSIDE.  
* **Bước 3:** Backend kiểm tra sức chứa ZONE\_MONTHLY.  
  * *Nhánh A (Zone Tháng còn chỗ):* Mở Barrier, chỉ định xe vào Zone Tháng, cập nhật vé tháng thành INSIDE.  
  * *Nhánh B (Zone Tháng đã đầy):* Mở Barrier, chỉ định xe vào Zone Thường, cập nhật vé tháng thành INSIDE. Hóa đơn vẫn được neo ở mức 0 VNĐ.

#### **4.3. Đóng ca quét hết hạn tự động (Nightly Cron Job)**

* **Bước 1:** Đúng 02:00 AM, Spring Batch Job kích hoạt.  
* **Bước 2:** Thực thi câu lệnh SQL: UPDATE monthly\_tickets SET status \= 'INACTIVE' WHERE valid\_to \< GETDATE() AND status \= 'ACTIVE'.  
* **Bước 3:** Ghi log số lượng vé bị khóa vào hệ thống kiểm toán để báo cáo.

### **5\. QUY TẮC NGHIỆP VỤ BẮT BUỘC (BUSINESS RULES)**

* **BR-MTH-01 (Độc quyền định danh):** Một biển số xe tại một thời điểm chỉ được phép tồn tại trong duy nhất 1 gói vé tháng đang ACTIVE. Nếu khách mua nhầm gói thứ 2 cho cùng biển số, hệ thống báo lỗi Conflict.  
* **BR-MTH-02 (Luật ưu tiên định tuyến):** Khách vé tháng luôn được ưu tiên có chỗ đỗ. Việc "Tràn Zone" (Overflow) sang khu vực vãng lai diễn ra hoàn toàn vô hình với khách hàng, không phát sinh bất kỳ khoản phụ thu nào.  
* **BR-MTH-03 (Bảo vệ tính toàn vẹn phiên):** Nếu vé tháng hết hạn ngay trong lúc xe đang nằm ở trạng thái INSIDE, Nightly Job vẫn chuyển vé thành INACTIVE. Tại cổng OUT lúc xe ra bãi, Backend sẽ tự động phát hiện, tính toán đoạn thời gian từ lúc hết hạn đến lúc ra cổng và áp dụng thuật toán Trượt Block vãng lai để thu tiền chênh lệch.

### **6\. CẤU TRÚC LƯU TRỮ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)**

Cấu trúc được tối giản hóa theo tỷ lệ 1-1 giữa vé và biển số, đồng thời bổ sung thông số cấu hình ngưỡng.  
**6.1. Bảng system\_configs (Cấu hình hệ thống chung)**

* config\_key (VARCHAR): Ví dụ MONTHLY\_ZONE\_BUFFER\_PERCENT  
* config\_value (VARCHAR): Ví dụ 110 (Hiểu là 110%)

**6.2. Bảng zones (Khu vực đỗ xe)**

* id (INT, Primary Key)  
* zone\_name (VARCHAR)  
* is\_monthly\_dedicated (BIT) \- Cờ xác định đây có phải Zone Tháng hay không.  
* total\_slots (INT) \- Tổng sức chứa cấu hình vật lý.  
* current\_occupied (INT) \- Số lượng xe đang đỗ thực tế.

**6.3. Bảng monthly\_tickets (Quản lý Vé tháng)**

* id (VARCHAR(20), Primary Key)  
* user\_id (INT, Foreign Key)  
* plate\_number (VARCHAR(20), Unique khi ACTIVE) \- Đảm bảo định danh độc quyền.  
* valid\_from (DATETIME)  
* valid\_to (DATETIME)  
* status (VARCHAR(20)) \- ACTIVE, INACTIVE, CANCELED.

### **7\. ĐẶC TẢ GIAO THỨC API VÀ TIẾN TRÌNH (REST API & BATCH JOB)**

**7.1. API Đăng ký Vé tháng (POST)**

* **Endpoint:** /api/v1/user/monthly-tickets  
* **Xử lý ngầm:** Thêm vé tháng mới vào hệ thống.

**7.2. Job Quét Đêm Tối Ưu Hóa Vé Tháng (Nightly Cron Job)**

* **Schedule:** `0 0 2 * * ?` (Chạy lúc 2:00 sáng mỗi ngày).
* **Nghiệp vụ:** Hệ thống đếm tổng số vé tháng đang ACTIVE so sánh với tổng sức chứa của Zone Vé tháng (`MONTHLY_ZONE`). Nếu `Total_Active_Passes > Total_Monthly_Slots * (1 + MONTHLY_ZONE_BUFFER_PERCENT/100)` (Ví dụ vượt quá 20%), hệ thống sẽ đẩy Push Notification khẩn cấp cho Manager: *"Cảnh báo: Số lượng vé tháng đã vượt ngưỡng an toàn của Zone. Vui lòng nới rộng Zone vé tháng để tránh kẹt bãi!"*

**7.3. Logic Xử lý tại Cổng IN (Check-in Pseudo-code)**

```java
MonthlyTicket ticket = ticketRepo.findByPlateAndStatus(plateNumber, "ACTIVE");

if (ticket != null) {  
    boolean isInside = sessionRepo.existsByPlateAndStatus(plateNumber, "INSIDE");
    if (isInside) {  
        throw new AntiPassbackException("Biển số đang tồn tại trong bãi. Chặn mở cổng.");  
    }  
      
    Zone assignedZone = monthlyZone;
    // Bỏ qua lỗi tràn zone vì khách vé tháng đỗ sai không sao, vẫn đi ra bình thường
      
    createSession(ticket);  
    return openGateAndRouteTo(assignedZone);  
}  
// Nếu không có vé tháng, chạy luồng tính phí vãng lai bình thường...
```

**7.3. Tiến trình dọn dẹp ban đêm (Spring @Scheduled)**

Java  
@Scheduled(cron \= "0 0 2 \* \* ?") // Chạy vào 02:00:00 sáng mỗi ngày  
@Transactional  
public void deactivateExpiredMonthlyTickets() {  
    int updatedCount \= ticketRepo.deactivateExpiredTickets(LocalDateTime.now());  
    auditLogService.logSystemAction("NIGHTLY\_CRON", "Đã khóa " \+ updatedCount \+ " vé tháng hết hạn.");  
}

## **THEO DÕI VÀ TRA CỨU LƯỢT GỬI XE HIỆN TẠI**

**(MÃ PHÂN HỆ: UC-USR05 \- ACTIVE SESSION TRACKING PORTAL)**

### **1\. THÔNG TIN CHUNG (GENERAL INFORMATION)**

* **Mã Use Case:** UC-USR05  
* **Tên Use Case:** Theo dõi và Tra cứu lượt gửi xe hiện tại (Active Session Tracking & Live Billing).  
* **Tác nhân (Actor):** Khách hàng đã đăng nhập (Authenticated User).  
* **Mục tiêu:** Cung cấp cho khách hàng công cụ tự tra cứu trực tuyến trên Web/App để giám sát trạng thái phương tiện đang đỗ dưới hầm theo thời gian thực. Hệ thống tự động tính toán cước động, đồng thời minh bạch hóa tất cả các khoản phụ phí/phí phạt vi phạm (Đỗ sai quy định, quá hạn, sự cố) được cộng dồn vào hóa đơn tạm tính dưới dạng mảng dữ liệu.

### **2\. TIỀN ĐIỀU KIỆN (PRECONDITIONS)**

* Khách hàng đã đăng nhập thành công vào hệ thống.  
* Phương tiện của khách hàng đã Check-in hợp lệ qua cổng và hệ thống đang duy trì phiên đỗ xe với trạng thái status \= 'INSIDE'.  
* Bộ máy tính phí (Pricing Engine) và Module quản lý vi phạm (Violation Rules) đang hoạt động ổn định trên Backend.

### **3\. LUỒNG SỰ KIỆN CHÍNH (MAIN SUCCESS SCENARIO / HAPPY PATH)**

Hệ thống phân tách rõ ràng hai luồng hiển thị dựa trên loại hình gửi xe:

#### **3.1. Phân ngạch 1: Tra cứu Xe Vãng lai (Walk-in Lookup)**

* **Bước 1 (Nhập liệu bảo mật):** Khách hàng truy cập tab "Tra cứu lượt gửi vãng lai". Hệ thống yêu cầu nhập bắt buộc 2 thông tin: Biển số xe và Mã số thẻ vật lý.  
* **Bước 2 (Xử lý truy vấn):** Backend chạy lệnh tìm bản ghi khớp tuyệt đối 3 tham số: Biển số, Mã thẻ, và Trạng thái INSIDE.  
* **Bước 3 (Tính toán cước & Tổng hợp Phạt tích lũy):** Backend tính phí cước đỗ xe theo block thời gian thực tế. Tiếp theo, hệ thống quét bảng session\_penalties để tính tổng các khoản phụ phí. Tổng phí tạm tính bằng Phí cước đỗ xe cộng với tổng các khoản Phí phạt vi phạm.  
* **Bước 4 (Hiển thị kết quả):** Giao diện trả về Thẻ thông tin (Live Card) hiển thị chi tiết vị trí, đồng hồ nhảy phút và bảng phân rã hóa đơn tạm tính đa danh mục.

#### **3.2. Phân ngạch 2: Tự động hiển thị Xe Đặt trước (Auto-fetch Booking Sessions)**

* **Bước 1 (Truy cập Dashboard):** Khách hàng mở trang chủ hoặc tab "Lượt xe đặt trước".  
* **Bước 2 (Nhận diện tự động):** Frontend dùng JWT Token gọi API. Backend tự động quét các phiên đỗ đang hoạt động được sinh ra từ mã Booking của User này.  
* **Bước 3 (Hiển thị ngay lập tức):** Khách hàng không cần nhập dữ liệu. Hệ thống tự động render Thẻ thông tin và trạng thái cước phí (Miễn phí trong khung giờ đã đặt, phí phạt đỗ lố giờ, hoặc các loại phí vi phạm khác).

### **4\. CHI TIẾT NỘI DUNG HIỂN THỊ TRÊN GIAO DIỆN (UI DATA PRESENTATION)**

Cấu trúc Thẻ thông tin (Live Session Card) phân tách rõ ràng khối Định vị và khối Tài chính:

#### **4.1. Khối 1 & 2: Trạng thái, Định danh và Định vị**

* **Trạng thái & Phân loại:** Nhãn màu Xanh lá ĐANG TRONG BÃI (ACTIVE) và nhãn VÃNG LAI hoặc ĐẶT TRƯỚC.  
* **Vị trí ô đỗ chốt cứng:** Tầng hầm (Ví dụ: Tầng B1), Phân khu (Ví dụ: Zone Vãng lai), Ô đỗ chính xác (Ví dụ: **A05**).

#### **4.2. Khối 3: Đồng hồ thời gian (Live Timer)**

* **Giờ Check-in:** Mốc thời gian thực tế xe qua cổng (Ví dụ: 14:30 \- 14/06/2026).  
* **Thời gian đã lưu bãi:** Tổng thời lượng (Ví dụ: 73 giờ 15 phút). Đồng hồ tự động nhảy phút ở phía Frontend.

#### **4.3. Khối 4: Minh bạch hóa hóa đơn tạm tính (Dynamic Billing Widget)**

Bảng bóc tách tài chính hỗ trợ hiển thị linh hoạt nhiều loại phí phạt cùng lúc:

| Danh mục | Số tiền (VNĐ) | Trạng thái ghi chú |
| :---- | :---- | :---- |
| **1\. Phí cước đỗ xe tích lũy** | 120.000 | Tính theo thời gian thực tế lưu bãi |
| **2\. Phí phạt vi phạm** |  | Tự động ẩn nếu không có vi phạm |
| *\-- Đỗ sai khu vực (Zone)* | 50.000 | Phân khu VIP |
| *\-- Lưu bãi quá hạn (\>72h)* | 100.000 | Áp dụng theo quy chế an ninh |
| **TỔNG PHÍ TẠM TÍNH** | **270.000** | **Số tiền dự kiến thanh toán tại cổng ra** |

### **5\. LUỒNG THAY THẾ & NGOẠI LỆ (ALTERNATIVE / EXCEPTION FLOWS)**

* **Phương tiện bị gán nhiều cờ vi phạm cùng lúc (Multi-Violation Scenario):** Hệ thống UI tự động chèn một Banner Cảnh báo Đỏ trên cùng: "Lưu ý: Phương tiện của bạn đang vi phạm nhiều quy định vận hành của bãi xe. Chi tiết các khoản phụ phí phạt đã được cập nhật vào hóa đơn. Vui lòng liên hệ quầy An ninh để được hỗ trợ."  
* **Xe thuộc diện Đặt trước (Booking) vi phạm quy chế:** Khách hàng đỗ lố thời gian hoặc mang sai xe. Bảng cước phí sẽ liệt kê: Phí Booking \= 0 VNĐ (Đã trả trước); Phí phạt lố giờ \= \[Số tiền\]; Phí vi phạm quy chế \= \[Số tiền\]. Tổng phí tạm tính sẽ cộng dồn các khoản này.  
* **Sai lệch thông tin bảo mật (Luồng Vãng lai):** Khách hàng nhập đúng Biển số nhưng sai Mã thẻ (hoặc ngược lại). Giao diện báo lỗi: "Không tìm thấy phiên đỗ hoạt động. Vui lòng kiểm tra lại Biển số và Mã thẻ xe".  
* **Tra cứu phiên đã kết thúc (Session Completed):** Khách hàng nhập thông tin xe vừa Check-out. Hệ thống hiển thị thẻ trạng thái màu Xám ĐÃ KẾT THÚC (COMPLETED) kèm hóa đơn tĩnh làm biên lai điện tử.

### **6\. QUY TẮC NGHIỆP VỤ ĐẶC THÙ (BUSINESS RULES)**

* **Xác thực kép bắt buộc (2FA Lookup):** Tuyệt đối nghiêm cấm việc tra cứu trạng thái xe vãng lai chỉ bằng một trường Biển số. Yêu cầu nhập Mã thẻ là chốt chặn vật lý chứng minh quyền sở hữu phiên đỗ.  
* **Mảng Vi phạm Động (Dynamic Penalty Array):** Backend không fix cứng cột phạt là zone\_penalty. Bảng lưu trữ vi phạm liên kết 1-Nhiều với bảng parking\_sessions để linh hoạt thêm mới bất kỳ loại vi phạm nào (do hệ thống tự quét hoặc do nhân viên gán thủ công).  
* **Cập nhật đồng bộ chu kỳ (Auto-Refresh):** Cứ mỗi chu kỳ 60 giây, hoặc khi người dùng thực hiện thao tác vuốt màn hình để làm mới, Frontend gửi lệnh gọi API để Backend cập nhật tổng thời gian và truy vấn các vi phạm mới phát sinh.

### **7\. ĐẶC TẢ GIAO THỨC API (REST API CONTRACT)**

**API Tra cứu Lượt Vãng Lai:**

* POST /api/v1/user/parking/lookup-walkin  
* **Headers:** Authorization: Bearer \<JWT\_TOKEN\>

**Response Payload (Hệ thống trả về HTTP 200 OK):**  
`{`  
  `"sessionId": "SESSION_20260614_089",`  
  `"status": "INSIDE",`  
  `"sessionType": "WALK_IN",`  
  `"vehicle": {`  
    `"plateNumber": "51G-123.45",`  
    `"type": "CAR"`  
  `},`  
  `"location": {`  
    `"floor": "B1",`  
    `"zoneName": "Zone Vãng lai",`  
    `"allocatedSlot": "A05"`  
  `},`  
  `"tracking": {`  
    `"checkInTime": "2026-06-11T14:30:00",`  
    `"lastCalculatedTime": "2026-06-14T15:45:00",`  
    `"durationMinutes": 4395`  
  `},`  
  `"billingSummary": {`  
    `"accumulatedParkingFee": 120000,`  
    `"totalPenaltyFee": 150000,`  
    `"totalEstimatedFee": 270000,`  
    `"currency": "VNĐ",`  
    `"penaltyDetails": [`  
      `{`  
        `"violationType": "ZONE_VIOLATION",`  
        `"feeAmount": 50000,`  
        `"description": "Đỗ sai khu vực quy định (Zone cư dân)"`  
      `},`  
      `{`  
        `"violationType": "OVERSTAY_72H",`  
        `"feeAmount": 100000,`  
        `"description": "Lưu bãi quá hạn 72 giờ không thông báo"`  
      `}`  
    `]`  
  `}`  
`}`

## **THANH TOÁN PHÍ GỬI XE VÀ DỊCH VỤ BỔ SUNG**

**(MÃ PHÂN HỆ: UC-USR06 \- OMNICHANNEL PAYMENT & BILLING WIZARD)**

### **1\. TỔNG QUAN PHÂN HỆ (MODULE OVERVIEW)**

* **Mã Use Case:** UC-USR06  
* **Tên Use Case:** Thanh toán phí gửi xe và Dịch vụ bổ sung.  
* **Tác nhân (Actor):** Khách hàng (Customer).  
* **Mục tiêu:** Cung cấp trải nghiệm thanh toán đa kênh (Omnichannel) mượt mà và minh bạch. Hệ thống phân tách rõ ràng hai nghĩa vụ tài chính: **Trả trước 100% (Pre-payment)** đối với luồng Khách Đặt chỗ (Booking) và **Thanh toán tại cổng (Pay-at-Gate)** đối với Khách Vãng lai hoặc Khách Đặt chỗ phát sinh lố giờ/phụ phí.

### **2\. TIỀN ĐIỀU KIỆN (PRECONDITIONS)**

* **Luồng Thanh toán Online:** Khách hàng đã chọn xong ô đỗ, khung giờ trên Web/App và đang ở màn hình Checkout.  
* **Luồng Thanh toán tại cổng:** Xe đã tiến vào làn OUT, nhân viên thu ngân đã quẹt thẻ (hoặc Camera đã nhận diện biển số đối với xe Booking). Hệ thống đã kích hoạt thành công chốt chặn Đóng băng thời gian (locked\_at).

### **3\. CẤU TRÚC HÓA ĐƠN TỔNG HỢP (AGGREGATED BILLING STRUCTURE)**

Bộ máy tính cước (Core Billing) sẽ gom các khoản phí phát sinh thành một hóa đơn duy nhất trước khi hiển thị cho khách hàng. Hóa đơn bao gồm 4 thành tố:

1. **Phí lưu bãi gốc (Base Parking Fee):** Tính theo đơn giá trả trước (Booking) hoặc tính theo thuật toán Trượt Block đa phân mảnh (Đối với xe Vãng lai).  
2. **Phụ phí lố giờ (Overstay Surcharge):** Chỉ xuất hiện nếu xe Booking đỗ lố thời gian đã mua. Tính từ phút lố đầu tiên theo biểu giá vãng lai.  
3. **Phí phạt vi phạm (Penalties):** Các khoản phạt (Đỗ sai Zone, Mất thẻ) do Staff thực địa gán vào phiên đỗ.  
4. **Dịch vụ bổ sung (Add-on Services):** Các dịch vụ phát sinh theo yêu cầu (Ví dụ: Sạc pin xe điện EV, Rửa xe tự động).  
5. **Chiết khấu/Miễn giảm (Adjustments):** Khoản tiền được trừ ra nếu có sự can thiệp giảm phí từ Manager (UC-MNG06).

\\text{Tổng tiền cần thanh toán} \= (1) \+ (2) \+ (3) \+ (4) \- (5)

### **4\. LUỒNG SỰ KIỆN CHÍNH (MAIN SUCCESS SCENARIOS)**

Hệ thống cung cấp hai ngạch thanh toán chạy song song, độc lập về mặt quy trình:

#### **4.1. Phân ngạch 1: Thanh toán Đặt chỗ trực tuyến (Booking Pre-payment)**

Áp dụng trên ứng dụng Khách hàng để mua trước ô đỗ.

* **Bước 1 (Xác nhận Đơn hàng):** Khách hàng kiểm tra tóm tắt đơn Booking (Biển số, Thời gian, Vị trí ô đỗ, Số tiền).  
* **Bước 2 (Khởi tạo Giao dịch):** Khách hàng chọn phương thức thanh toán và bấm "Thanh toán". Hệ thống gọi API sang Cổng thanh toán đối tác để lấy Payment\_URL và chuyển hướng (Redirect).  
* **Bước 3 (Xác thực 3D-Secure/OTP):** Khách hàng thực hiện xác thực bảo mật trên App Ngân hàng hoặc Ví điện tử.  
* **Bước 4 (Nhận Webhook & Chốt đơn):** Backend nhận tín hiệu Webhook (Server-to-Server) xác nhận tiền đã vào tài khoản công ty. Hệ thống đổi trạng thái đơn Booking thành PRE\_PAID, sinh mã QR định danh và gửi thông báo thành công cho Khách hàng. Chỗ đỗ vật lý chuyển sang trạng thái RESERVED.

#### **4.2. Phân ngạch 2: Thanh toán tại cổng kiểm soát (Gate Check-out)**

Áp dụng cho mọi xe Vãng lai hoặc xe Booking có phát sinh phụ phí khi rời bãi.

* **Bước 1 (Khóa phiên & Chốt số liệu):** Nhân viên quẹt thẻ tại cổng OUT. Hệ thống kích hoạt mốc thời gian locked\_at, thuật toán trượt Block đóng băng số tiền.  
* **Bước 2 (Hiển thị Hóa đơn):** Bảng LED điện tử phía trước kính xe hiển thị Tổng tiền cần thanh toán. Đồng thời, Màn hình phụ (Customer-facing Screen) kết xuất một **Mã VietQR Động (Dynamic VietQR)**.  
  * *Mã QR đã nhúng sẵn: Số tài khoản đích, Số tiền chính xác lẻ đến từng đồng, và Cú pháp chuyển khoản chứa Mã phiên đỗ.*  
* **Bước 3 (Thanh toán):** Khách hàng chọn thanh toán bằng:  
  * **Tiền mặt:** Đưa cho thu ngân, thu ngân bấm "Đã nhận đủ tiền mặt" trên phần mềm.  
  * **Quét mã QR:** Khách dùng App Ngân hàng quét màn hình phụ. Ngay khi khách chuyển khoản thành công, Server bãi xe nhận biến động số dư và tự động phát âm thanh *"Thanh toán thành công"* tại trạm. Để chống xung đột kép (Double Payment), khi sinh mã QR, nút "Đã thu tiền mặt" của Staff sẽ bị mờ (Disable) trong 5 giây.  
* **Bước 4 (Giải phóng phương tiện):** Thu ngân không cần thao tác thêm nếu khách quét QR (Barrier tự mở). Đối với tiền mặt, thu ngân bấm Mở cổng, hệ thống chốt phiên sang trạng thái COMPLETED. Nếu khách lỡ trả tiền mặt xong, Webhook mới tới, hệ thống đánh cờ `is_overpaid = true` để Manager hoàn tiền.

### **5\. LUỒNG THAY THẾ & NGOẠI LỆ (ALTERNATIVE / EXCEPTION FLOWS)**

* **5.1. Khách hàng khiếu nại cước phí tại cổng (Fee Dispute):**  
  * *Sự kiện:* Khách hàng không đồng ý với số tiền hiển thị trên bảng LED (Do kẹt xe, nhầm lẫn).  
  * *Xử lý:* Thời gian tính tiền đã bị đóng băng (locked\_at). Quản lý (Manager) xử lý giảm phí trên hệ thống (UC-MNG06). Ngay khi Manager bấm "Duyệt", bảng LED và Mã VietQR động lập tức tự động Render lại với số tiền mới đã được giảm (Ví dụ: Từ 50k xuống 30k). Khách hàng quét mã mới để hoàn tất.  
* **5.2. Lỗi giao dịch trực tuyến quá hạn (Booking Payment Timeout):**  
  * *Sự kiện:* Khách hàng tạo đơn Booking, chuyển sang App ngân hàng nhưng thoát ra hoặc quên nhập OTP.  
  * *Xử lý:* Sau 15 phút (Tính từ lúc tạo đơn), nếu Backend không nhận được Webhook thanh toán thành công, hệ thống tự động đánh dấu đơn Booking là PAYMENT\_FAILED hoặc CANCELED. Ô đỗ đang giữ ảo được nhả lại vào quỹ phòng trống (AVAILABLE). Nếu Webhook đến trễ sau khi đã hủy, hệ thống ghi log `REQUIRES_MANUAL_REFUND` và gửi cảnh báo cho Manager.  
* **5.3. Khách hàng Booking về sớm (Early Check-out Refund):**  
  * *Sự kiện:* Khách hàng thanh toán trước cho 5 tiếng lưu bãi, nhưng mới đỗ 2 tiếng đã có việc bận lái xe ra về.  
  * *Xử lý:* Cổng kiểm soát tự động mở Barrier cho xe ra. Tuy nhiên, hệ thống tuân thủ nghiêm ngặt **Chính sách Không hoàn tiền (No Refund Policy)** đối với thời gian không sử dụng. Tiền thừa không được hoàn lại dưới mọi hình thức để tránh các lỗ hổng kế toán.

### **6\. QUY TẮC NGHIỆP VỤ BẮT BUỘC (BUSINESS RULES)**

* **BR-PAY-01 (Kế thừa Logic Lố giờ):** Đối với xe Đặt chỗ trước, ngay khi đồng hồ thời gian thực vượt qua phút cuối cùng của đơn Booking, hệ thống kết thúc phiên đỗ trả trước và tự động kích hoạt phiên đỗ Vãng lai nối tiếp. Phiên vãng lai này bắt đầu tính giờ từ phút số 0 và nạp thẳng vào **Lớp Bộ Lọc Cơ Bản Toàn Cảnh (Global Base)** để tính phí lũy tiến như một khách vãng lai bình thường.  
* **BR-PAY-02 (Tái kích hoạt thời gian \- Grace Period Timeout):** Tại cổng kiểm soát, mã VietQR và số tiền chốt đóng băng chỉ có hiệu lực tối đa 15 phút. Nếu khách hàng quét mã chậm hoặc chần chừ không thanh toán quá 15 phút, mốc locked\_at bị xóa bỏ. Hệ thống tự động tính lại phí theo giờ hiện tại, Render lại mã VietQR mới với số tiền (có thể) đã tăng thêm.  
* **BR-PAY-03 (Ưu tiên thanh toán phạt):** Nếu xe đang bị gán cờ Phạt vi phạm (Penalty), khách hàng bắt buộc phải thanh toán dứt điểm hóa đơn bao gồm cả tiền phạt tại cổng thì hệ thống mới cho phép Barrier mở. Nhân viên thu ngân (ROLE\_STAFF) không có quyền gạch nợ tiền phạt.

### **7\. ĐẶC TẢ GIAO THỨC TÍCH HỢP THANH TOÁN (PAYMENT INTEGRATION CONTRACT)**

#### **7.1. API Khởi tạo mã VietQR động tại trạm (GET)**

Được gọi tự động bởi phần mềm trạm (React POS) khi Staff quẹt thẻ xe ra.

* **Endpoint:** /api/v1/payments/generate-qr/{sessionId}  
* **Response (200 OK):**

`{`  
  `"sessionId": "SES_88291A",`  
  `"totalAmount": 45000,`  
  `"qrData": "00020101021238540010A0000007270124...45000...", // Chuỗi mã hóa chuẩn EMVCo`  
  `"qrImageUrl": "https://api.vietqr.io/image/970415-11336688-w1x2y3z.jpg",`  
  `"expiresAt": "2026-06-15T15:15:00" // Hạn 15 phút của Time Freeze`  
`}`

#### **7.2. Webhook nhận kết quả Biến động số dư (POST Server-to-Server)**

Các đối tác ngân hàng/Cổng thanh toán bắn tín hiệu về Server khi khách chuyển khoản thành công. Để bảo mật và tránh lỗi do người dùng sửa nội dung chuyển khoản, hệ thống KHÔNG parse chuỗi `transferContent`.

* **Endpoint:** /api/v1/webhooks/payment-success  
* **Payload từ Đối tác:**

`{`  
  `"transactionId": "FT26166XXXX",`  
  `"amount": 45000,`  
  `"orderCode": 882910,`  
  `"bankCode": "VCB",`  
  `"timestamp": "2026-06-15T15:02:11"`  
`}`

*Hành động của Backend:* Lấy `orderCode` truy vấn ra Session. Đối soát số tiền (45000). Nếu khớp 100%, đổi trạng thái thanh toán thành PAID và kích hoạt lệnh qua WebSocket mở Barrier ngay lập tức mà không cần Staff thao tác. Nếu Session đã ở trạng thái `COMPLETED` (Staff đã thu tiền mặt), đánh cờ `is_overpaid = true`.

## **BÁO CÁO SỰ CỐ VÀ HỖ TRỢ TRỰC TUYẾN**

**(MÃ PHÂN HỆ: UC-USR07 \- REAL-TIME INCIDENT REPORTING & OPERATIONAL TRIAGE)**

### **1\. TỔNG QUAN PHÂN HỆ (MODULE OVERVIEW)**

* **Mã Use Case:** UC-USR07  
* **Tên Use Case:** Hệ thống tiếp nhận Báo cáo sự cố và Hỗ trợ trực tuyến (User Incident Reporting).  
* **Tác nhân (Actor):** Khách hàng (Customer) trên Web/App, Nhân viên tuần tra/Cổng (Staff), Quản lý (Manager).  
* **Mục tiêu:** Xây dựng kênh giao tiếp thời gian thực kết nối trực tiếp Khách hàng với Bộ phận Vận hành. Hệ thống đóng vai trò như một tổng đài thông minh (Triage System), tự động phân loại sự cố và điều phối tín hiệu đến đúng màn hình của nhân sự phụ trách (Staff thực địa hoặc Manager tài chính) nhằm giải quyết nhanh gọn các điểm nghẽn trong bãi đỗ.

### **2\. TIỀN ĐIỀU KIỆN (PRECONDITIONS)**

* Khách hàng có kết nối mạng và truy cập ứng dụng thông qua tài khoản cá nhân (Booking) hoặc quét mã QR Hỗ trợ dán tại các cột hầm (Vãng lai).  
* Đối với các khiếu nại liên quan đến hóa đơn hoặc mất thẻ, khách hàng phải đang có một phiên đỗ xe mang trạng thái INSIDE.  
* Thiết bị di động của Staff (Tablet) và Web Admin của Manager đang trong trạng thái kết nối WebSocket để nhận Push Notification.

## **3\. MA TRẬN PHÂN QUYỀN VÀ ĐIỀU PHỐI VẬN HÀNH (OPERATIONAL MATRIX)**

Hệ thống tự động rẽ nhánh luồng xử lý dựa trên hạng mục khách hàng gửi lên:

###  **Mất thẻ xe**

* **Mức ưu tiên:** CRITICAL  
* **Tác nhân phụ trách:** Staff cổng ra  
* **Thiết bị nhận lệnh:** Máy tính thu ngân  
* **Phương thức giải quyết:** Kiểm tra giấy tờ, thu phí đền phôi thẻ, khóa phiên thủ công.

###  **Slot bị chiếm**

* **Mức ưu tiên:** HIGH  
* **Tác nhân phụ trách:** Staff tuần tra  
* **Thiết bị nhận lệnh:** Máy tính bảng (Tablet)  
* **Phương thức giải quyết:** Trực tiếp xác minh, chọn ô đỗ thay thế khả thi trên App, phạt xe vi phạm.

###  **Sai phí**

* **Mức ưu tiên:** HIGH  
* **Tác nhân phụ trách:** Manager  
* **Thiết bị nhận lệnh:** Web Admin (Desktop)  
* **Phương thức giải quyết:** Tạm dừng tính phí từ xa, đối soát camera, điều chỉnh hóa đơn cuối.

###  **Khó tìm xe**

* **Mức ưu tiên:** NORMAL  
* **Tác nhân phụ trách:** Staff tuần tra  
* **Thiết bị nhận lệnh:** Bộ đàm / Tablet  
* **Phương thức giải quyết:** Di chuyển đến Zone lịch sử, tìm xe và phản hồi để điều hướng khách.

###  **Góp ý khác**

* **Mức ưu tiên:** LOW  
* **Tác nhân phụ trách:** Manager  
* **Thiết bị nhận lệnh:** Web Admin (Desktop)  
* **Phương thức giải quyết:** Tiếp nhận phản hồi về vệ sinh, thái độ phục vụ và đưa vào hàng đợi xử lý.

### **4\. LUỒNG SỰ KIỆN CHÍNH (MAIN SUCCESS SCENARIO \- CLIENT SIDE)**

* **Bước 1 (Khởi tạo Ticket):** Khách hàng bấm nút "Báo cáo sự cố / Hỗ trợ" trên giao diện màn hình chính của ứng dụng.  
* **Bước 2 (Phân loại vấn đề):** Giao diện hiển thị Dropdown List buộc khách hàng chọn một trong 5 phân loại: Mất thẻ xe, Sai lệch cước phí, Ô đỗ bị chiếm dụng, Khó tìm xe, Góp ý dịch vụ.  
* **Bước 3 (Nhập thông tin động):** Form dữ liệu thay đổi tùy theo phân loại:  
  * Mất thẻ / Sai phí / Khó tìm xe: Hệ thống tự động điền Biển số xe hiện tại.  
  * Slot bị chiếm: Hệ thống kích hoạt module Camera, yêu cầu bắt buộc chụp 1 bức ảnh biển số xe đang vi phạm.  
* **Bước 4 (Mô tả bổ sung):** Khách hàng nhập văn bản mô tả chi tiết vào ô Text Area (Giới hạn tối đa 500 ký tự).  
* **Bước 5 (Gửi Yêu cầu):** Khách hàng bấm "Gửi Báo cáo".  
* **Bước 6 (Phản hồi trạng thái):** Ứng dụng hiển thị màn hình thông báo *"Yêu cầu \[Mã Ticket\] đã được ghi nhận và chuyển đến bộ phận phụ trách"*, đồng thời chuyển sang màn hình theo dõi tiến độ xử lý Ticket (Trạng thái: Đang chờ).

### **5\. KỊCH BẢN ĐIỀU PHỐI CHI TIẾT TẠI BACKEND (BACKEND TRIAGE FLOWS)**

#### **5.1. Kịch bản: Báo mất thẻ xe khẩn cấp**

* Hệ thống ghi nhận Ticket, lập tức gắn cờ is\_emergency\_locked \= 1 cho phiên đỗ của biển số tương ứng.  
* Bắn thông báo chớp đỏ lên toàn bộ màn hình máy tính của Staff trực cổng OUT.  
* Nếu có kẻ gian dùng thẻ bị mất quét tại cổng, Barrier sẽ tự động khóa cứng, còi báo động tại trạm thu phí kêu, màn hình hiển thị: *"THẺ BÁO MẤT \- GIỮ PHƯƠNG TIỆN VÀ GỌI AN NINH"*.

#### **5.2. Kịch bản: Xử lý Slot Đặt trước bị chiếm**

* Hệ thống tiếp nhận ảnh chụp vi phạm từ khách hàng và đẩy Push Notification kèm âm thanh lớn xuống Tablet của Staff phụ trách Zone đó.  
* App khách hàng hiển thị thông báo: *"Nhân viên an ninh đang di chuyển đến vị trí của quý khách, vui lòng đợi tại xe"*.  
* Staff có mặt tại hiện trường, quan sát vật lý và chọn một ô đỗ trống sạch sẽ nhất (Ví dụ: VIP-04).  
* Staff thao tác trên Tablet: Bấm "Cấp đổi Slot thay thế", chọn VIP-04 và bấm xác nhận.  
* Hệ thống đổi dữ liệu Booking và bắn thông báo đẩy về App khách hàng: *"Hệ thống đã cấp đổi ô đỗ VIP-04. Vui lòng di chuyển theo hướng dẫn"*.  
* Staff tiến hành gán mức phạt vi phạm (Penalty) lên phần mềm cho chiếc xe đã chiếm chỗ trái phép.

#### **5.3. Kịch bản: Khiếu nại Sai lệch cước phí**

* Hệ thống chặn không gửi Ticket này cho Staff, đẩy thẳng vào Dashboard "Xử lý Tài chính" của Manager.  
* Kích hoạt luồng quy trình UC-MNG06: Manager có quyền bấm "Tạm dừng tính phí", đối soát nguyên nhân, ấn định lại giá tiền và cấp lệnh mở Exit Window 15 phút cho phương tiện thoát bãi.

#### **5.4. Kịch bản: Hỗ trợ tìm phương tiện**

* Hệ thống trích xuất lịch sử Zone ghi nhận cuối cùng từ Camera AI hoặc dữ liệu Check-in.  
* Đẩy nhiệm vụ tìm xe xuống Tablet của Staff tuần tra khu vực đó.  
* Staff rà soát, khi nhìn thấy xe sẽ bấm nút "Đã tìm thấy" trên Tablet.  
* Hệ thống tự động gửi vị trí chính xác về ứng dụng cho khách hàng.

### **6\. LUỒNG THAY THẾ & NGOẠI LỆ (ALTERNATIVE / EXCEPTION FLOWS)**

* **6.1. Tấn công Spam Ticket (Rate Limiting):**  
  * Sự kiện: Một IP hoặc Session\_ID gửi liên tục các báo cáo ảo gây nghẽn hệ thống phân phối tác vụ.  
  * Xử lý: Lớp bảo mật Spring Security áp dụng cơ chế Rate Limit (Tối đa 3 Ticket / 15 phút). Vượt ngưỡng này, hệ thống trả mã lỗi HTTP 429 và vô hiệu hóa nút Submit trên App khách hàng kèm bộ đếm ngược thời gian khóa.  
* **6.2. Thiếu ảnh chụp minh chứng (Missing Evidence):**  
  * Sự kiện: Khách hàng chọn sự cố "Slot bị chiếm" nhưng bỏ qua bước chụp ảnh và cố tình bấm Gửi.  
  * Xử lý: Frontend chặn Request, bôi đỏ khu vực tải ảnh và hiển thị thông báo: *"Bắt buộc cung cấp hình ảnh biển số xe vi phạm để nhân viên an ninh có cơ sở xử lý"*.  
* **6.3. Khách hàng đóng Ticket sớm:**  
  * Sự kiện: Khách báo khó tìm xe, nhưng 1 phút sau tự nhớ ra vị trí và lên xe.  
  * Xử lý: Khách bấm nút "Hủy yêu cầu" trên App. Hệ thống cập nhật trạng thái Ticket thành CANCELED và xóa Task khỏi màn hình Tablet của Staff tuần tra để tránh lãng phí nhân lực.

### **7\. QUY TẮC NGHIỆP VỤ BẮT BUỘC (BUSINESS RULES)**

* **BR-TKT-01 (Định tuyến thông tin):** Nhân viên thu ngân / bảo vệ (ROLE\_STAFF) tuyệt đối không có quyền xem hoặc can thiệp vào các Ticket thuộc nhóm Sai lệch cước phí để ngăn chặn hành vi cấu kết gian lận.  
* **BR-TKT-02 (Ràng buộc đổi Slot):** Tính năng "Cấp đổi Slot thay thế" trên Tablet của Staff chỉ hiển thị các ô đỗ đang trống (AVAILABLE) thuộc cùng phân hạng Zone hoặc phân hạng cao hơn. Tuyệt đối không hạ cấp (Downgrade) vị trí đỗ của khách hàng đã Booking trả tiền trước.  
* **BR-TKT-03 (Bảo lưu chứng từ gốc):** Mọi Ticket sau khi kết thúc vòng đời (Trạng thái RESOLVED hoặc CLOSED) sẽ được lưu trữ vĩnh viễn trong cơ sở dữ liệu làm bằng chứng giải quyết khiếu nại và đo lường SLA thời gian phản hồi của bộ phận vận hành.

### **8\. CẤU TRÚC LƯU TRỮ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)**

Dữ liệu được tổ chức thành 2 bảng quan hệ để tối ưu tốc độ truy vấn và lưu trữ Media.  
**Bảng incident\_tickets (Lưu thông tin chính)**

* id (VARCHAR, Primary Key) \- Format: TCK\_YYYYMMDD\_XXXX  
* session\_id (VARCHAR, Foreign Key) \- ID phiên đỗ xe hiện hành.  
* plate\_number (VARCHAR) \- Biển số phương tiện.  
* category (VARCHAR) \- Phân loại: LOST\_CARD, SLOT\_OCCUPIED, FEE\_DISPUTE, FIND\_CAR, OTHER.  
* description (NVARCHAR) \- Chi tiết nội dung khách hàng báo cáo.  
* status (VARCHAR) \- Mặc định OPEN. Các trạng thái tiếp theo: IN\_PROGRESS, RESOLVED, CANCELED.  
* handled\_by (INT, Foreign Key) \- Mã ID của Staff hoặc Manager đã tiếp nhận xử lý.  
* created\_at (DATETIME)  
* resolved\_at (DATETIME)

**Bảng ticket\_attachments (Lưu bằng chứng hình ảnh)**

* id (INT, Primary Key)  
* ticket\_id (VARCHAR, Foreign Key)  
* file\_url (VARCHAR) \- Link ảnh được lưu trữ trên Server.  
* uploaded\_at (DATETIME)

### **9\. ĐẶC TẢ GIAO THỨC TÍCH HỢP (REST API CONTRACT)**

**API Khách hàng tạo Báo cáo sự cố mới (POST)**

* **Endpoint:** /api/v1/user/incidents  
* **Request Payload:**

`{`  
  `"sessionId": "SES_001928",`  
  `"plateNumber": "51G-123.45",`  
  `"category": "SLOT_OCCUPIED",`  
  `"description": "Tôi đến ô đỗ đã đặt nhưng có xe khác đang đậu.",`  
  `"attachmentUrl": "https://storage.parking.com/incidents/img_2026.jpg"`  
`}`

* **Response Payload (201 Created):**

`{`  
  `"ticketId": "TCK_20260615_088",`  
  `"status": "OPEN",`  
  `"category": "SLOT_OCCUPIED",`  
  `"message": "Sự cố đã được báo cho bảo vệ khu vực. Vui lòng chờ tại xe, nhân viên sẽ có mặt ngay."`  
`}`

# Parking Admintrator

## Quản lý Tài khoản Nội bộ

**1\. Thông tin chung (General Information)**

* **Mã Use Case:** UC-AD01  
* **Tên Use Case:** Quản lý Tài khoản Nội bộ (User Management)  
* **Tác nhân (Actor):** System Administrator (Admin)  
* **Mô tả ngắn gọn:** Cho phép Admin tạo mới, chỉnh sửa thông tin, vô hiệu hóa (khóa) tài khoản và phân quyền cho đội ngũ nhân sự của bãi xe (Manager, Staff).

**2\. Tiền điều kiện (Preconditions)**

* Admin đã đăng nhập thành công vào hệ thống PBMS bằng tài khoản có quyền cao nhất (Super\_Admin).  
* Đang ở giao diện Màn hình Quản lý Tài khoản (User Dashboard).

**3\. Luồng sự kiện chính (Main Success Scenario / Happy Path)**

* **Bước 1:** Admin bấm chọn chức năng "Thêm tài khoản mới".  
* **Bước 2:** Hệ thống hiển thị Form tạo tài khoản.  
* **Bước 3:** Admin nhập các thông tin bắt buộc: Họ tên, Email (dùng làm Tên đăng nhập), Số điện thoại, và Chức vụ/Vai trò (chọn từ dropdown: Manager hoặc Staff).  
* **Bước 4:** Admin bấm nút "Lưu / Tạo tài khoản".  
* **Bước 5:** Hệ thống kiểm tra dữ liệu hợp lệ (Validation).  
* **Bước 6:** Hệ thống tự động sinh một mật khẩu ngẫu nhiên.  
* **Bước 7:** Hệ thống lưu bản ghi vào Database. Gửi một Email chứa "Tên đăng nhập & Mật khẩu mặc định" đến địa chỉ Email nhân viên vừa được tạo.  
* **Bước 8:** Hệ thống hiển thị thông báo "Tạo tài khoản thành công" và cập nhật danh sách hiển thị trên màn hình.

**4\. Luồng ngoại lệ & Luồng thay thế (Alternative/Exception Flows)**

* **4.1. Email bị trùng lặp (Duplicate Email):**  
  * *Tại Bước 5:* Nếu Email Admin nhập vào đã tồn tại trong hệ thống (kể cả tài khoản đang bị khóa).  
  * *Xử lý:* Hệ thống chặn hành động lưu, hiển thị cảnh báo đỏ *"Email này đã được sử dụng. Vui lòng nhập Email khác."*  
* **4.2. Khóa tài khoản nhân viên nghỉ việc (Deactivate User):**  
  * *Tại Bước 1:* Admin chọn một tài khoản đang hoạt động (Active) trong danh sách và bấm "Khóa (Deactivate)".  
  * *Xử lý:* Hệ thống hiển thị popup xác nhận. Admin bấm "Đồng ý". Hệ thống đổi trạng thái tài khoản thành Inactive. Tài khoản này ngay lập tức bị văng ra (Log out) nếu đang đăng nhập, và không thể đăng nhập lại.  
* **4.3. Đặt lại mật khẩu (Reset Password):**  
  * *Tại Bước 1:* Khi nhân viên quên mật khẩu, Admin chọn tài khoản đó và bấm "Reset Password".  
  * *Xử lý:* Hệ thống sinh mật khẩu ngẫu nhiên mới, lưu đè vào DB và tự động gửi Email báo mật khẩu mới cho nhân viên.

**5\. Quy tắc nghiệp vụ (Business Rules / Constraints)**

* **BR-01 (Xóa Mềm):** Hệ thống KHÔNG CÓ chức năng "Xóa vĩnh viễn" (Hard Delete) tài khoản nhân viên. Để bảo toàn tính toàn vẹn của dữ liệu lịch sử (Ví dụ: Truy vết xem ai đã mở Barie 3 tháng trước), tài khoản chỉ được phép "Khóa (Deactivate)" \- hay còn gọi là Xóa mềm (Soft Delete).  
* **BR-02 (Định dạng Dữ liệu):** Mật khẩu do hệ thống tự sinh phải dài ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số. Số điện thoại phải đúng định dạng số di động Việt Nam (10 số).  
* **BR-03 (Bảo mật Mật khẩu):** Mật khẩu lưu trong Database bắt buộc phải được mã hóa một chiều (Sử dụng BCrypt). Bản thân Admin cũng không thể xem được mật khẩu thật của nhân viên (Chỉ có thể Reset).

**6\. Hậu điều kiện (Postconditions)**

* Tài khoản nhân viên mới được cấp phát đầy đủ quyền hạn (Permissions) tương ứng với Vai trò (Role) đã chọn.  
* Mọi hành động Tạo mới, Cập nhật, Khóa, Reset Mật khẩu đều được lưu lại vào bảng Audit\_Log (Nhật ký hệ thống) đi kèm dấu thời gian (Timestamp) và định danh của người thao tác (Admin\_ID).

## PHÂN QUYỀN HỆ THỐNG PBMS (RBAC)

Hệ thống sử dụng cơ chế kiểm soát truy cập dựa trên vai trò tĩnh (Static Role-Based Access Control). Mỗi tài khoản chỉ được gán duy nhất 01 Vai trò. Dưới đây là mô tả quyền hạn cụ thể của 3 Vai trò cốt lõi trong hệ thống:

### **1\. Phân quyền: SUPER\_ADMIN (Quản trị viên Hệ thống)**

Nắm quyền cao nhất về hạ tầng phần mềm, tập trung vào bảo mật và quản trị nền tảng, tuyệt đối không can thiệp vào nghiệp vụ đỗ xe hàng ngày.  
*Yêu cầu tầng Code: Bảo vệ bằng @PreAuthorize("hasRole('SUPER\_ADMIN')")*

* **Quản lý Tài khoản Nội bộ:** Toàn quyền tạo mới, khóa (deactivate), và đặt lại mật khẩu cho các tài khoản Manager và Staff.  
* **Cấu hình API Ngoại vi:** Toàn quyền thiết lập và thay đổi tham số kết nối của PayOS, VNPay Sandbox và Email SMTP.  
* **Truy vết Nhật ký Hệ thống (Audit Log):** Toàn quyền truy xuất, xem chi tiết (Diff Viewer) và xuất file báo cáo toàn bộ thao tác của nhân viên.  
* **Giới hạn:** Bị chặn hoàn toàn quyền truy cập vào các màn hình tạo bản đồ, cấu hình giá tiền và giám sát cổng barie.

### **2\. Phân quyền: MANAGER (Quản lý Bãi xe)**

Nắm quyền điều hành kinh doanh, thiết lập không gian, định giá và theo dõi dòng tiền.  
*Yêu cầu tầng Code: Bảo vệ bằng @PreAuthorize("hasRole('MANAGER')")*

* **Bản đồ Không gian (Map/Zone):** Toàn quyền thiết lập kích thước lưới, sinh block, kéo thả vị trí Zone và lưu cấu hình không gian bãi xe.  
* **Cấu hình Giá & Quy tắc (Pricing):** Toàn quyền thiết lập bảng giá lượt, thời gian châm chước (Grace Period) và các mốc phạt quá giờ.  
* **Báo cáo & Thống kê:** Toàn quyền xem Dashboard thời gian thực, báo cáo doanh thu và tỷ lệ lấp đầy.  
* **Giới hạn:** Chỉ được quyền **Xem** (Không được thao tác) lịch sử giải quyết xe đỗ sai chỗ. Không có quyền bấm mở Barie cưỡng chế tại cổng.

### **3\. Phân quyền: STAFF (Nhân viên Bảo vệ)**

Nắm quyền vận hành trực tiếp tại trạm kiểm soát, giải quyết sự cố tức thời cho luồng xe ra vào.  
*Yêu cầu tầng Code: Bảo vệ bằng @PreAuthorize("hasRole('STAFF')")*

* **Giám sát Trạm kiểm soát:** Toàn quyền theo dõi luồng Check-in/Check-out thời gian thực từ Camera AI và đầu đọc thẻ.  
* **Can thiệp Thủ công (Override):** Toàn quyền nhập lại biển số bị AI đọc sai, hoặc bấm nút mở Barie khẩn cấp trên phần mềm.  
* **Xử lý Giao dịch:** Toàn quyền xác nhận thanh toán tiền mặt và thu phí phạt đỗ quá giờ tại cổng Check-out.  
* **Xử lý Xung đột:** Toàn quyền thao tác lệnh "Điều xe" (Re-routing) khi có cảnh báo cảm biến xe đỗ sai vị trí.  
* **Giới hạn (Chỉ được Xem):** Được phép xem bản đồ để tra cứu vị trí xe. Bị chặn hoàn toàn quyền sửa bản đồ, sửa giá tiền và xem báo cáo doanh thu.

### **4\. Quy tắc Ràng buộc Kỹ thuật (Security Constraints)**

* **Bảo vệ API tĩnh (Stateless Security):** Toàn bộ API Backend được bảo vệ bằng JWT Token. Token trả về lúc đăng nhập chứa định danh Role. Bất kỳ request nào từ Frontend gửi lên mà gọi sai API quyền hạn sẽ bị hệ thống trả về mã lỗi HTTP 403 (Forbidden).  
* **Xử lý Giao diện (UI Rendering):** Frontend có trách nhiệm đọc biến Role trong mã JWT. Các nút bấm hoặc thanh Menu (Sidebar) không thuộc quyền hạn của người dùng phải được ẩn đi hoàn toàn khỏi giao diện HTML/CSS để đảm bảo trải nghiệm sạch sẽ và chống thao tác nhầm.

## Cấu hình Hệ thống & Kết nối Ngoại vi

**1\. Thông tin chung (General Information)**

* **Mã Use Case:** UC-AD02  
* **Tên Use Case:** Cấu hình Hệ thống (System Configuration)  
* **Tác nhân (Actor):** System Administrator (Admin)  
* **Mô tả ngắn gọn:** Cho phép Admin thiết lập và cập nhật các thông số bảo mật để PBMS kết nối với bên thứ 3, bao gồm Cổng thanh toán nội địa (PayOS), Cổng thanh toán quốc tế (VNPay Sandbox) và Máy chủ gửi Email (Google SMTP).

**2\. Tiền điều kiện (Preconditions)**

* Admin đã đăng nhập thành công vào hệ thống bằng tài khoản có quyền tối cao (Super\_Admin).  
* Hệ thống mạng của máy chủ đang hoạt động bình thường để có thể ping kiểm tra kết nối API.

**3\. Luồng sự kiện chính (Main Success Scenario / Happy Path)**

* **Bước 1:** Admin truy cập vào menu "Cấu hình Hệ thống" (System Settings).  
* **Bước 2:** Hệ thống hiển thị giao diện theo **Kiểu 1 trang cuộn chia khối (Single Page with Cards)**, bao gồm 3 khối cấu hình chính:  
  * *Khối 1 (PayOS):* Cổng thanh toán Chuyển khoản nội địa (Quét mã VietQR).  
  * *Khối 2 (VNPay):* Cổng thanh toán Thẻ tín dụng/Ví quốc tế (Môi trường Sandbox).  
  * *Khối 3 (Email):* Hệ thống thông báo tự động.  
* **Bước 3:** Admin tiến hành nhập/chỉnh sửa các thông số kỹ thuật tương ứng vào các Form nhập liệu:  
  * **Tại Khối PayOS:** Nhập Client ID, API Key, và Checksum Key.  
  * **Tại Khối VNPay:** Nhập Sandbox Client ID và Sandbox Secret.  
  * **Tại Khối Email:** Nhập Google Sender Email và App Password (Mật khẩu ứng dụng 16 ký tự).  
* **Bước 4:** Admin bấm nút "Kiểm tra Kết nối" (Test Connection) tích hợp sẵn tại mỗi khối để xác thực dữ liệu vừa nhập.  
* **Bước 5:** Hệ thống gọi API ping thử nghiệm tới các dịch vụ tương ứng (PayOS, VNPay, Google).  
* **Bước 6:** Nhận phản hồi thành công (HTTP 200 OK), hệ thống hiển thị thông báo màu xanh "Kết nối hợp lệ" bên cạnh khối cấu hình đó.  
* **Bước 7:** Admin bấm nút "Lưu cấu hình" (Save Configuration) ở cuối trang.  
* **Bước 8:** Hệ thống mã hóa (Encrypt) các chuỗi Secret Key/Password, lưu vào Database.  
* **Bước 9:** Hệ thống tự động apply (áp dụng) cấu hình mới vào luồng vận hành thời gian thực mà không cần khởi động lại máy chủ (No server restart required). Hiển thị thông báo "Cập nhật cấu hình thành công".

**4\. Luồng ngoại lệ & Luồng thay thế (Alternative / Exception Flows)**

* **4.1. Thông số kết nối không hợp lệ (Invalid Credentials):**  
  * *Tại Bước 5:* Nếu API ping thất bại (VD: HTTP 401 Unauthorized do nhập sai Checksum Key của PayOS hoặc App Password bị Google từ chối).  
  * *Xử lý:* Hệ thống hiển thị thông báo lỗi màu đỏ tại khối tương ứng (VD: "Kết nối PayOS thất bại. Vui lòng kiểm tra lại Key"). Nút "Lưu cấu hình" tổng sẽ bị vô hiệu hóa (Disabled) cho đến khi toàn bộ thông số được xác thực thành công. Điều này ngăn chặn việc lưu một cấu hình hỏng làm chết chức năng sinh QR thanh toán của bãi xe.

**5\. Quy tắc nghiệp vụ (Business Rules / Constraints)**

* **BR-01 (Bảo mật hiển thị \- Field Masking):** Toàn bộ các trường dữ liệu mang tính chất bảo mật (API Key, Checksum Key, Sandbox Secret, App Password) khi render lên giao diện bắt buộc phải bị che khuất dưới dạng dấu sao \*\*\*\*\*\*\*\*. Hệ thống cung cấp icon "Con mắt" (Toggle Visibility), Admin phải bấm vào mới có thể xem hoặc copy chuỗi ký tự thật.  
* **BR-02 (Cơ chế Fallback & Timeout):** Khi thực hiện ping "Kiểm tra kết nối", thời gian chờ tối đa (Timeout) là 5 giây. Nếu quá 5 giây không nhận được phản hồi từ bên thứ 3 do đứt cáp hoặc lỗi server đối tác, hệ thống tự động ngừng ping và báo "Timeout \- Không thể kết nối tới máy chủ đối tác".  
* **BR-03 (Bảo toàn Webhook PayOS):** URL Webhook của PayOS được cấu hình ngầm bằng code trong Spring Boot (Ví dụ: https://\[domain-bãi-xe\]/api/payment/payos-webhook), không cho phép Admin tự ý sửa qua giao diện Web để tránh rủi ro gãy luồng xác nhận thanh toán tự động.

**6\. Hậu điều kiện (Postconditions)**

* Các luồng Đặt chỗ (Booking) và Checkout tại cổng ngay lập tức sử dụng các Key API mới nhất để sinh QR hoặc gọi form VNPay.  
* Hành động thay đổi cấu hình được ghi lại vào bảng audit\_log của hệ thống (Ví dụ: ACTION\_TYPE \= UPDATE\_PAYMENT\_CONFIG) phục vụ mục đích truy vết.

## Xem Nhật ký Hoạt động & Truy vết (System Audit Logs)

**1\. Thông tin chung (General Information)**

* **Mã Use Case:** UC-AD03  
* **Tên Use Case:** Truy vết Nhật ký Hệ thống (System Audit & Tracking)  
* **Tác nhân (Actor):** System Administrator (Admin)  
* **Mô tả ngắn gọn:** Cho phép Admin theo dõi, lọc và truy vết mọi thao tác làm thay đổi dữ liệu của toàn bộ nhân sự (Manager, Staff). Hệ thống cung cấp công cụ "Diff Viewer" giúp so sánh trực quan sự khác biệt giữa dữ liệu cũ và mới, đặc biệt hiệu quả trong việc kiểm soát các bản cập nhật sơ đồ bãi xe.

**2\. Tiền điều kiện (Preconditions)**

* Admin đã đăng nhập thành công vào hệ thống với quyền Super\_Admin.  
* Đang ở giao diện Nhật ký Hoạt động (Audit Logs).

**3\. Luồng sự kiện chính (Main Success Scenario / Happy Path)**

* **Bước 1:** Admin truy cập màn hình Audit Logs.  
* **Bước 2 (Lớp hiển thị 1 \- Bảng tổng quan):** Hệ thống truy xuất và hiển thị danh sách nhật ký theo cơ chế phân trang (Pagination), sắp xếp từ mới nhất đến cũ nhất. Mỗi bản ghi bao gồm:  
  * Thời gian (Timestamp)  
  * Người thực hiện (Actor ID & Name)  
  * Loại hành động (Action Type \- VD: UPDATE\_ZONE\_MAP, MANUAL\_OPEN\_BARRIER, UPDATE\_PRICING)  
  * Địa chỉ IP  
* **Bước 3:** Admin sử dụng bộ lọc (Filters) ở góc màn hình: Lọc từ ngày 01/06 đến 10/06, Người thực hiện \= MNG-01, Loại hành động \= UPDATE\_ZONE\_MAP.  
* **Bước 4:** Hệ thống load lại bảng dữ liệu hiển thị đúng kết quả lọc.  
* **Bước 5 (Lớp hiển thị 2 \- Diff Viewer):** Admin bấm nút "Xem chi tiết" tại một dòng log cập nhật bản đồ (Update Zone Map).  
* **Bước 6:** Hệ thống hiển thị một Popup chứa công cụ **Diff Viewer** (So sánh mã). Popup trình bày chuỗi dữ liệu JSON của trạng thái cũ (Cột bên trái \- tô màu đỏ) và trạng thái mới (Cột bên phải \- tô màu xanh dương/xanh lá) giúp Admin nhìn rõ ngay lập tức Manager đã kéo Zone nào từ tọa độ nào sang tọa độ nào.  
* **Bước 7:** Admin bấm "Đóng" Popup. Chọn "Xuất báo cáo" (Export) để tải danh sách đã lọc dưới dạng file Excel (.xlsx).

**4\. Luồng ngoại lệ & Luồng thay thế (Alternative / Exception Flows)**

* **4.1. Dữ liệu trống do bộ lọc (Empty State):**  
  * *Tại Bước 4:* Nếu kết quả truy vấn theo bộ lọc trả về 0 bản ghi.  
  * *Xử lý:* Bảng dữ liệu ẩn đi, hệ thống hiển thị màn hình Empty State với icon minh họa và dòng chữ: *"Không tìm thấy nhật ký hoạt động nào khớp với điều kiện lọc."*

**5\. Quy tắc nghiệp vụ (Business Rules / Constraints)**

* **BR-01 (Tính Bất biến \- Immutable Ledger):** Bảng Audit\_Log là dữ liệu dạng *Append-only* (Chỉ ghi nối thêm). Giao diện tuyệt đối KHÔNG có nút Chỉnh sửa (Edit) hay Xóa (Delete). Mọi cố gắng can thiệp sửa log bằng giao diện người dùng đều bị chặn.  
* **BR-02 (Cơ chế Gom nhóm Log Bản đồ \- Single Commit Rule):** Đối với các thao tác phức tạp như Manager kéo thả Zone, hệ thống KHÔNG ghi log từng pixel di chuyển. Frontend chỉ gom toàn bộ tọa độ cuối cùng thành 1 cục JSON Payload và bắn xuống Backend tạo đúng **01 bản ghi log duy nhất** tại thời điểm Manager bấm nút "Lưu cấu hình bản đồ".  
* **BR-03 (Phân loại cấp độ Log):** Hệ thống chỉ tự động ghi log đối với các thao tác thay đổi trạng thái (State Changes \- POST/PUT/DELETE) có ảnh hưởng đến bảo mật, vận hành và dòng tiền. Không ghi log các thao tác "Xem" (GET).  
* **BR-04 (Tối ưu truy vấn \- Database Indexing):** Yêu cầu thiết kế Database phải đánh Index cho 3 cột actor\_id, action\_type, và created\_at để đảm bảo thời gian load bộ lọc dữ liệu luôn dưới 1 giây, kể cả khi bảng có hàng trăm nghìn dòng.  
* **BR-05 (Dọn dẹp tự động \- Data Retention):** Cronjob của hệ thống sẽ tự động xóa cứng (Hard Delete) các dòng log đã lưu trữ vượt quá 6 tháng để giải phóng dung lượng Database.

**6\. Hậu điều kiện (Postconditions)**

* Admin truy xuất được thông tin đối soát chính xác.  
* Không có sự thay đổi nào về mặt dữ liệu gốc của hệ thống được thực hiện từ màn hình này.

# 

# Additional use cases

## **GHI NHẬN NHẬT KÝ HỆ THỐNG VÀ KIỂM TOÁN**

**(MÃ PHÂN HỆ: UC-SYS02 \- SYSTEM LOGGING & AUDIT TRAIL)**

### **1\. TỔNG QUAN PHÂN HỆ (MODULE OVERVIEW)**

* **Mã Use Case:** UC-SYS02  
* **Tên Use Case:** Quản lý Nhật ký hệ thống và Vết kiểm toán (System Logging & Audit Trail).  
* **Tác nhân (Actor):** Hệ thống Backend (Tự động hóa), Quản trị viên cấp cao (Super Admin).  
* **Mục tiêu:** Xây dựng một cơ sở hạ tầng giám sát "vô hình" chạy ngầm dưới toàn bộ các phân hệ. Hệ thống bóc tách rõ ràng giữa Log kỹ thuật (phục vụ debug phần mềm) và Log nghiệp vụ (phục vụ đối soát tài chính, truy cứu trách nhiệm nhân sự). Cơ chế ghi log phải đảm bảo tính bất biến (Immutability), không làm suy giảm hiệu năng của các luồng giao dịch lõi (như thuật toán tính phí hay chốt ca).

### **2\. PHÂN LOẠI NHẬT KÝ HỆ THỐNG (LOG CLASSIFICATION)**

Hệ thống phân rã dữ liệu log thành 3 luồng độc lập để tối ưu hóa không gian lưu trữ và tốc độ truy vấn:  
**2.1. Log Kỹ thuật (Technical Logs)**

* **Mục đích sử dụng:** Hỗ trợ Developer/DevOps theo dõi sức khỏe ứng dụng và gỡ lỗi (Debug).  
* **Nơi lưu trữ:** Tệp văn bản (File system / ELK Stack).  
* **Nội dung ghi nhận tiêu biểu:** Stack trace các lỗi NullPointerException, HTTP 500, thời gian phản hồi API, lỗi kết nối Database/Redis.

**2.2. Log Nghiệp vụ (Audit Trail)**

* **Mục đích sử dụng:** Đối soát tài chính, truy vết hành vi của Staff/Manager để chống gian lận.  
* **Nơi lưu trữ:** Cơ sở dữ liệu (SQL Server).  
* **Nội dung ghi nhận tiêu biểu:** Sửa bảng giá, Giảm phí (UC-MNG06), Mở barrier thủ công, Chốt ca chênh lệch tiền, Hoàn tiền Booking.

**2.3. Log Tích hợp (Integration Logs)**

* **Mục đích sử dụng:** Kiểm soát luồng giao tiếp với bên thứ ba (Cổng thanh toán, Thiết bị IoT).  
* **Nơi lưu trữ:** Cơ sở dữ liệu (Bảng riêng biệt).  
* **Nội dung ghi nhận tiêu biểu:** Webhook từ PayOS (Thanh toán tại cổng) và VNPay (Thanh toán đặt chỗ Booking), lệnh Ping kiểm tra trạng thái Camera/Barrier, độ trễ phản hồi của thiết bị.

### **3\. KIẾN TRÚC KỸ THUẬT GHI LOG (LOGGING ARCHITECTURE)**

Để đảm bảo hiệu năng xử lý tại cổng không bị chậm trễ bởi các tác vụ ghi log, kiến trúc được thiết kế theo nguyên tắc Không đồng bộ (Asynchronous) và Lập trình hướng khía cạnh (AOP).

* **Lớp lõi Logging (SLF4J & Logback):** Spring Boot sử dụng Logback để quản lý việc xuất file log kỹ thuật theo ngày (Rolling File Appender). Tự động nén tệp .gz đối với các log cũ hơn 7 ngày.  
* **Lập trình hướng khía cạnh (Spring AOP):** Không viết code lưu log trực tiếp vào bên trong các hàm tính toán nghiệp vụ (tránh phình to logic). Hệ thống định nghĩa một Annotation tự tạo @AuditLoggable. Khi Manager gọi một API có gắn mác này (Ví dụ: Lưu cấu hình Bảng giá), Spring AOP sẽ tự động đánh chặn (Intercept), trích xuất thông tin người dùng từ JWT Token, lấy dữ liệu Body của Request/Response và đẩy vào một tiến trình chạy ngầm.  
* **Hàng đợi Không đồng bộ (Async Event Publisher):** Các tác vụ ghi xuống SQL Server được đẩy vào ApplicationEventPublisher (chạy trên một Thread Pool riêng biệt). Nếu tiến trình lưu log thất bại, luồng thanh toán chính của khách hàng vẫn thành công bình thường.

### **4\. LUỒNG SỰ KIỆN GHI NHẬN KIỂM TOÁN (AUDIT TRAIL SCENARIOS)**

#### **4.1. Kịch bản ghi nhận Thay đổi Dữ liệu (Data Mutation Log)**

* **Sự kiện:** Manager sửa đổi cấu hình "Bậc Cơ Bản Toàn Cảnh" từ 120 phút lên 150 phút.  
* **Ghi nhận của Hệ thống:**  
  * AOP đánh chặn Request, tạo một bản ghi Audit.  
  * Hệ thống lưu trữ trạng thái trước khi sửa (Old Value JSON: {"globalBaseMins": 120}) và trạng thái sau khi sửa (New Value JSON: {"globalBaseMins": 150}).  
  * Bản ghi được lưu kèm ID của Manager, IP mạng, và Timestamp chính xác.

#### **4.2. Kịch bản ghi nhận Hành vi Vận hành (Operational Action Log)**

* **Sự kiện:** Nhân viên thu ngân (Staff) bấm lệnh "Mở Barrier bằng tay" trên phần mềm React POS do camera không nhận diện được biển số.  
* **Ghi nhận của Hệ thống:**  
  * Hệ thống ghi log hành động MANUAL\_GATE\_OPEN.  
  * Yêu cầu Staff phải chọn lý do (Ví dụ: "Lỗi Camera / Chói nắng").  
  * Log ghi nhận gate\_id đang trực, staff\_id, và hình ảnh tĩnh (Snapshot) cắt từ Camera Pano tại đúng giây bấm mở để Manager đối soát xem có phải Staff tự ý mở cổng cho xe quen qua mặt hệ thống hay không.

#### **4.3. Kịch bản ghi nhận Cảnh báo An ninh (Security Exception Log)**

* **Sự kiện:** Có kẻ gian cố tình quét các cổng API nội bộ hoặc nhập sai mật khẩu liên tục (Brute-force attack).  
* **Ghi nhận của Hệ thống:**  
  * Filter bảo mật của Spring Security tự động bắt các lỗi HTTP 401/403.  
  * Ghi log địa chỉ IP vi phạm, User-Agent, số lần thử sai. Kích hoạt cờ khóa IP (Blacklist) nếu vượt ngưỡng 10 lần/phút.

### **5\. QUY TẮC NGHIỆP VỤ BẮT BUỘC (BUSINESS RULES)**

* **BR-LOG-01 (Tính Bất biến \- Immutability):** Toàn bộ các bảng lưu Log Nghiệp vụ và Log Tích hợp trong SQL Server là dạng **Append-Only** (Chỉ thêm mới). Tuyệt đối không cấp quyền (Revoke permissions) chạy lệnh UPDATE hoặc DELETE trên các bảng này cho bất kỳ tài khoản Database nào, kể cả tài khoản Root của DBA.  
* **BR-LOG-02 (Chu kỳ Lưu trữ \- Retention Policy):**  
  * **Log Kỹ thuật (Files):** Lưu giữ tự động trên Server trong 30 ngày, sau đó tự động xóa vĩnh viễn (Auto-purge).  
  * **Log Kiểm toán Tài chính (SQL Server):** Lưu giữ tối thiểu 5 năm theo tiêu chuẩn kế toán doanh nghiệp. Dữ liệu cũ hơn 1 năm được cấu hình Job tự động chuyển sang cơ sở dữ liệu Archive để giảm tải cho bảng chính.  
* **BR-LOG-03 (Che giấu Dữ liệu Nhạy cảm \- Data Masking):** Cấu hình thư viện Jackson để tự động làm mờ (Mask) các thông tin nhạy cảm trước khi lưu xuống chuỗi JSON của Log. Tuyệt đối không ghi log các trường password, mã OTP, hoặc mã PIN của Manager (Hiển thị dạng \*\*\*\*\*\*).

### **6\. CẤU TRÚC LƯU TRỮ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)**

Để đảm bảo hiệu năng, hệ thống không sử dụng Khóa ngoại (Foreign Keys) rườm rà trong các bảng Log, thay vào đó lưu dạng dữ liệu phẳng (Flat Data) và JSON Object.  
**6.1. Bảng audit\_logs (Nhật ký Kiểm toán Nghiệp vụ)**

* id (BIGINT, Primary Key IDENTITY)  
* actor\_id (INT) \- ID của nhân viên/quản lý thực hiện thao tác.  
* actor\_role (VARCHAR(50)) \- Vai trò tại thời điểm thực hiện (ROLE\_MANAGER, ROLE\_STAFF).  
* action\_type (VARCHAR(100)) \- Định danh hành động (VD: UPDATE\_PRICING, OVERRIDE\_FEE, MANUAL\_GATE\_OPEN).  
* entity\_type (VARCHAR(50)) \- Tên bảng hoặc đối tượng bị tác động (VD: pricing\_policies, parking\_sessions).  
* entity\_id (VARCHAR(50)) \- Mã ID của đối tượng bị tác động.  
* old\_value (NVARCHAR(MAX)) \- Chuỗi JSON lưu trạng thái cũ.  
* new\_value (NVARCHAR(MAX)) \- Chuỗi JSON lưu trạng thái mới.  
* ip\_address (VARCHAR(50)) \- Địa chỉ IP của máy khách.  
* created\_at (DATETIME DEFAULT GETDATE())

**6.2. Bảng webhook\_logs (Nhật ký Giao tiếp Đối tác)**

* id (BIGINT, Primary Key IDENTITY)  
* partner\_name (VARCHAR(50)) \- Tên đối tác (PAYOS, VNPay).  
* endpoint (VARCHAR(255))  
* request\_payload (NVARCHAR(MAX)) \- Nội dung body đối tác bắn sang.  
* response\_status (INT) \- HTTP Status Code hệ thống trả về (200, 400).  
* processing\_time\_ms (INT) \- Thời gian Backend xử lý webhook.  
* created\_at (DATETIME DEFAULT GETDATE())

### **7\. ĐẶC TẢ GIAO THỨC TÍCH HỢP (REST API CONTRACT)**

API này phục vụ cho Màn hình Tra cứu Lịch sử (Web Admin) của Super Admin/Kế toán trưởng.  
**7.1. API Truy vấn Vết kiểm toán (GET)**

* **Endpoint:** /api/v1/admin/audit-logs  
* **Headers:** Authorization: Bearer \<JWT\_TOKEN\> (Chỉ ROLE\_ADMIN được truy cập).  
* **Query Parameters:** ?actionType=OVERRIDE\_FEE\&startDate=2026-06-01\&endDate=2026-06-30\&page=0\&size=50  
* **Response (200 OK):**

JSON  
{  
  "content": \[  
    {  
      "logId": 99201,  
      "actorName": "Nguyễn Quản Lý",  
      "actorRole": "ROLE\_MANAGER",  
      "actionType": "OVERRIDE\_FEE",  
      "entityType": "parking\_sessions",  
      "entityId": "SES\_88192",  
      "oldValue": "{\\"actualCalculatedFee\\": 80000}",  
      "newValue": "{\\"finalPaidFee\\": 30000, \\"reason\\": \\"Khách ngoại giao\\"}",  
      "ipAddress": "192.168.1.55",  
      "createdAt": "2026-06-16T17:10:22"  
    }  
  \],  
  "pageNumber": 0,  
  "totalPages": 5,  
  "totalElements": 250  
}

## **QUẢN LÝ VÀ BÀN GIAO CA TRỰC TẠI TRẠM**

**(MÃ PHÂN HỆ: UC-STF01 \- COMPREHENSIVE SHIFT & GATE MANAGEMENT)**

### **1\. TỔNG QUAN PHÂN HỆ (MODULE OVERVIEW)**

* **Mã Use Case:** UC-STF01  
* **Tên Use Case:** Quản lý vòng đời Ca trực: Thiết lập cổng, Điều phối làn và Bàn giao tài chính.  
* **Tác nhân (Actor):** Nhân viên thu ngân / Bảo vệ trực trạm (Staff), Quản lý điều hành (Manager).  
* **Mục tiêu:** Cung cấp quy trình vận hành khép kín (End-to-End) cho nhân sự tại cổng. Phân hệ cho phép Staff chọn làn làm việc, tuân thủ lịch trình điều hướng (Vào/Ra) do Manager cấu hình, và kết thúc bằng một quy trình đối soát dòng tiền mặt minh bạch để quy trách nhiệm tài chính trước khi giải phóng cổng cho ca tiếp theo.

### **2\. TIỀN ĐIỀU KIỆN (PRECONDITIONS)**

* Quản trị viên (Manager) đã khai báo danh sách các Cổng (Gates) trong cơ sở dữ liệu.  
* Nhân viên đăng nhập thành công vào ứng dụng (React POS) bằng tài khoản ROLE\_STAFF.  
* Hạ tầng phần cứng kết nối tại cổng được giả định ở trạng thái hoạt động bình thường.

### **3\. GIAO DIỆN TRỰC QUAN (UI/UX SPECIFICATION)**

Phân hệ được chia làm 2 màn hình tương tác chính ở 2 thời điểm của ca làm việc:

#### **3.1. Giao diện Mở ca (Màn hình Thiết lập Cổng)**

* **Sơ đồ Trạng thái Cổng:**  
  * **Trống (IDLE):** Khối màu xanh lá, cho phép Staff click chọn.  
  * **Đang Bận (OCCUPIED):** Khối màu xám, hiển thị tên Staff đang trực, khóa không cho chọn.  
* **Khu vực Cấu hình Chức năng:**  
  * Nếu Cổng bị Manager lên lịch ép buộc: Nút Toggle bị khóa, báo hiệu *"Cổng đang được điều hướng tự động: LUỒNG XE VÀO/RA"*.  
  * Nếu Cổng linh hoạt: Staff tự gạt Toggle **\[LUỒNG VÀO\]** hoặc **\[LUỒNG RA\]**.  
* **Nút hành động:** **"BẮT ĐẦU CA TRỰC"**.

#### **3.2. Giao diện Chốt ca (Modal Bàn giao Tài chính)**

Xuất hiện khi Staff bấm "Kết thúc ca trực" trên màn hình làm việc:

* **Khu vực Báo cáo Hệ thống (Chỉ đọc):** Tổng lượt xe, Tổng doanh thu Online (Quét QR/Chuyển khoản), và **Tổng tiền mặt hệ thống tính toán (Tiền mặt dự kiến)**.  
* **Khu vực Khai báo Thực tế (Tương tác):** Ô Input để Staff nhập **Số tiền mặt thực tế** đếm được trong két. Hệ thống tự động hiển thị độ chênh lệch (Âm/Dương/Khớp).  
* **Khu vực Giải trình:** Ô Text bắt buộc nhập lý do nếu phát sinh chênh lệch tiền.  
* **Nút hành động:** **"CHỐT CA & BÀN GIAO"**.

### **4\. LUỒNG SỰ KIỆN CHÍNH (MAIN SUCCESS SCENARIOS)**

#### **4.1. Giai đoạn 1: Khởi tạo Ca trực (Shift Opening)**

* **Bước 1:** Staff truy cập, hệ thống tải danh sách Cổng kèm trạng thái và Lịch trình (Schedules) hiện tại.  
* **Bước 2:** Staff click chọn một cổng đang IDLE.  
* **Bước 3:** Backend đối chiếu lịch gate\_schedules. Nếu có lịch của Manager, gán cứng chức năng. Nếu không, Staff tự chọn luồng VÀO/RA.  
* **Bước 4:** Staff bấm "Bắt đầu ca trực". Backend đổi trạng thái cổng thành OCCUPIED, sinh một bản ghi work\_sessions mới. Chuyển hướng Staff vào màn hình tiếp đón phương tiện.

#### **4.2. Giai đoạn 2: Kết thúc và Bàn giao (Shift Closing)**

* **Bước 5:** Staff hết ca, bấm "Kết thúc ca trực".  
* **Bước 6:** React gọi API tính toán, hiển thị Modal "Bàn giao tài chính" với con số Tổng tiền mặt yêu cầu.  
* **Bước 7:** Staff kiểm đếm tiền vật lý, nhập con số thực tế vào phần mềm. Nếu có lệch, gõ lý do (VD: *"Thối nhầm 10.000đ"*).  
* **Bước 8:** Staff bấm "Chốt ca & Bàn giao".  
* **Bước 9:** Backend ghi nhận giờ ended\_at và dữ liệu tiền mặt vào work\_sessions. Đổi trạng thái phiên thành PENDING\_SETTLEMENT. Giải phóng cổng về lại IDLE.  
* **Bước 10:** Hệ thống tự động đăng xuất tài khoản, đưa Staff về trang Login.

### **5\. LUỒNG THAY THẾ & NGOẠI LỆ (ALTERNATIVE / EXCEPTION FLOWS)**

* **5.1. Xung đột chọn Cổng (Race Condition):**  
  * *Sự kiện:* Hai Staff cùng bấm "Bắt đầu ca trực" tại 1 cổng cùng lúc.  
  * *Xử lý:* Database áp dụng Optimistic Locking. Người chậm hơn sẽ nhận báo lỗi: *"Cổng này vừa được tiếp nhận bởi \[Tên\]. Vui lòng chọn cổng khác"*.  
* **5.2. Đảo làn đột xuất từ Trung tâm (Mid-shift Override):**  
  * *Sự kiện:* Manager áp lịch ép cổng đổi từ VÀO sang RA khi Staff đang trực.  
  * *Xử lý:* Frontend nhận tín hiệu WebSocket, hiện Pop-up đếm ngược 5 giây, sau đó tự động Refresh sang giao diện luồng RA mà không làm đứt gãy ca trực.  
* **5.3. Mất điện/Sập nguồn đột ngột (Orphaned Session):**  
  * *Sự kiện:* Máy trạm sập nguồn, Staff chưa kịp làm thủ tục chốt ca.  
  * *Xử lý:* Cổng vẫn ở trạng thái OCCUPIED. Khi có điện lại, hệ thống ép Staff vào thẳng Modal "Bàn giao tài chính" để chốt dứt điểm phiên cũ trước khi mở phiên làm việc mới.  
* **5.4. Đang phục vụ xe dở dang (Active Transaction Block):**  
  * *Sự kiện:* Staff bấm đóng ca khi vẫn còn một xe đang hiển thị chờ thu tiền trên màn hình.  
  * *Xử lý:* Chặn lệnh, báo lỗi: *"Vui lòng hoàn tất thu phí và cho xe qua cổng trước khi chốt ca"*.

### **6\. QUY TẮC NGHIỆP VỤ BẮT BUỘC (BUSINESS RULES)**

* **BR-SHF-01 (Mức độ ưu tiên điều hướng):** Lệnh cấu hình luồng VÀO/RA từ tài khoản Manager luôn mang tính tối cao. Staff tuyệt đối không có quyền thay đổi chức năng cổng nếu khung giờ đó đã bị Manager đóng lịch trình.  
* **BR-SHF-02 (Ràng buộc Giao dịch):** Mọi bản ghi phiên đỗ xe (Vào/Ra) bắt buộc phải đính kèm gate\_id, staff\_id và work\_session\_id để truy vết trách nhiệm.  
* **BR-SHF-03 (Trách nhiệm Tiền mặt):** Staff chỉ chịu trách nhiệm giải trình và đền bù cho độ lệch của **Tiền mặt**. Các khoản Online (QR/Chuyển khoản) đi thẳng vào tài khoản công ty, không nằm trong trách nhiệm kiểm đếm của Staff.  
* **BR-SHF-04 (Bàn giao mù \- Tùy chọn cấu hình):** Để chống gian lận, Manager có thể bật chế độ "Bàn giao mù". Hệ thống sẽ giấu nhẹm con số "Tổng tiền hệ thống yêu cầu". Staff buộc phải đếm và khai báo trung thực số tiền trong két, sau khi Submit hệ thống mới báo kết quả chênh lệch.

### **7\. CẤU TRÚC LƯU TRỮ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)**

**7.1. Bảng gates (Quản lý thiết lập Cổng)**

* id (VARCHAR(20), Primary Key)  
* gate\_name (NVARCHAR(100))  
* status (VARCHAR(20)) \- IDLE (Trống) hoặc OCCUPIED (Đang bận).  
* current\_staff\_id (INT, Nullable)

**7.2. Bảng gate\_schedules (Lịch điều hướng từ Manager)**

* id (INT, Primary Key IDENTITY)  
* gate\_id (VARCHAR(20), Foreign Key)  
* scheduled\_mode (VARCHAR(10)) \- Ép luồng IN hoặc OUT.  
* start\_time (TIME)  
* end\_time (TIME)  
* is\_active (BIT)

**7.3. Bảng staff\_work\_sessions (Lưu vết Ca trực & Bàn giao)**

* id (INT, Primary Key IDENTITY)  
* staff\_id (INT, Foreign Key)  
* gate\_id (VARCHAR(20), Foreign Key)  
* working\_mode (VARCHAR(10)) \- Luồng IN / OUT.  
* started\_at (DATETIME)  
* ended\_at (DATETIME, Nullable)  
* sys\_total\_online (DECIMAL) \- Tổng doanh thu không tiền mặt.  
* sys\_total\_cash (DECIMAL) \- Tổng tiền mặt hệ thống tính toán.  
* declared\_cash (DECIMAL, Nullable) \- Tiền mặt thực tế Staff khai báo.  
* variance\_amount (DECIMAL, Nullable) \- Độ lệch (declared\_cash \- sys\_total\_cash).  
* variance\_reason (NVARCHAR(500), Nullable) \- Giải trình của Staff.  
* settlement\_status (VARCHAR(20)) \- OPEN, PENDING\_SETTLEMENT, SETTLED.

### **8\. ĐẶC TẢ GIAO THỨC API (REST API CONTRACT)**

**8.1. API Lấy Danh sách Cổng & Lịch trình (GET)**

* **Endpoint:** /api/v1/gates/availability  
* **Response (200 OK):** Trả về trạng thái các cổng và thông báo điều hướng ép buộc từ Manager (nếu có).

**8.2. API Bắt đầu Ca trực (POST)**

* **Endpoint:** /api/v1/work-sessions/start  
* **Request:** {"gateId": "GATE\_B1\_LANE\_01", "selectedMode": "IN"}  
* **Response (200 OK):** Sinh ra workSessionId và khóa trạng thái cổng.

**8.3. API Báo cáo Chốt ca tạm tính (GET)**

* **Endpoint:** /api/v1/work-sessions/{sessionId}/summary  
* **Response (200 OK):**

JSON  
{  
  "workSessionId": 8925,  
  "totalVehiclesProcessed": 142,  
  "systemTotalOnline": 1250000,  
  "systemTotalCash": 450000  
}

**8.4. API Gửi Yêu cầu Chốt ca (POST)**

* **Endpoint:** /api/v1/work-sessions/{sessionId}/close  
* **Request Payload:**

JSON  
{  
  "declaredCashAmount": 440000,  
  "varianceReason": "Thiếu 10.000đ do không có tiền lẻ thối."  
}

* **Response (200 OK):**

JSON  
{  
  "message": "Đã chốt ca thành công. Độ lệch: \-10,000 VNĐ. Hệ thống tự động đăng xuất.",  
  "settlementStatus": "PENDING\_SETTLEMENT"  
}

## **QUẢN LÝ TRẠNG THÁI CỔNG TẬP TRUNG**

**(MÃ PHÂN HỆ: UC-MNG07 \- CENTRALIZED GATE SCHEDULING & TRAFFIC CONTROL)**

### **1\. TỔNG QUAN PHÂN HỆ (MODULE OVERVIEW)**

* **Mã Use Case:** UC-MNG07  
* **Tên Use Case:** Phân bổ lịch trình Cổng (Vào/Ra) và Đóng/Mở cổng từ xa.  
* **Tác nhân (Actor):** Quản lý điều hành (Manager / Admin).  
* **Mục tiêu:** Cung cấp cho Ban Quản Lý một trung tâm điều khiển (Control Center) để can thiệp vào hoạt động của các làn xe. Quản lý có thể cấu hình trạng thái cổng theo 2 hình thức: **Can thiệp tức thời (Real-time Override)** để giải tỏa ùn tắc, hoặc **Cấu hình lịch trình định kỳ (Recurring Scheduler)** để hệ thống tự động ép các cổng hoạt động theo đúng chức năng (Vào/Ra) vào các khung giờ cụ thể trong ngày/tuần.

### **2\. TIỀN ĐIỀU KIỆN (PRECONDITIONS)**

* Quản lý đang đăng nhập trên hệ thống Web Admin (React) với quyền ROLE\_MANAGER hoặc ROLE\_ADMIN.  
* Cấu hình vật lý của các cổng (Gate) đã được khai báo trên hệ thống và phần cứng đang trong trạng thái Online.  
* Hệ thống có kết nối WebSocket ổn định với các máy tính trạm POS (Nơi Staff đang ngồi trực) để truyền lệnh điều hướng theo thời gian thực.

### **3\. CÁC CHẾ ĐỘ ĐIỀU HƯỚNG CỔNG (GATE OPERATIONAL MODES)**

Một cổng tại một thời điểm nhất định có thể bị ép buộc hoạt động theo một trong 4 trạng thái sau:

1. **LUỒNG VÀO (FORCE\_IN):** Cổng chỉ được phép tiếp đón xe vào. Nhân viên tại trạm không thể chuyển sang luồng Ra.  
2. **LUỒNG RA (FORCE\_OUT):** Cổng chỉ được phép giải phóng xe ra. Nhân viên không thể chuyển sang luồng Vào.  
3. **ĐÓNG CỔNG (CLOSED):** Cổng bị phong tỏa (do bảo trì, dọn dẹp, hoặc đóng ca đêm). Barrier hạ xuống, màn hình LED hiện "Cổng Đóng / X-Closed". Nhân viên bị cấm đăng nhập mở ca tại cổng này.  
4. **LINH HOẠT (FLEXIBLE):** Không có lịch ép buộc nào. Nhân viên tại trạm (Staff) toàn quyền tự quyết định gạt Toggle IN/OUT tùy theo tình hình thực tế.

### **4\. GIAO DIỆN TRỰC QUAN (UI/UX SPECIFICATION TẠI WEB ADMIN)**

* **Tab 1: Bảng điều khiển Thời gian thực (Live Traffic Dashboard):**  
  * Hiển thị sơ đồ toàn bộ các Cổng (Làn 1, Làn 2...).  
  * Dưới mỗi cổng có các nút Action tức thời: \[Ép IN\] | \[Ép OUT\] | \[Khóa CỔNG\].  
  * Hiển thị tên nhân viên đang trực hiện tại ở từng làn.  
* **Tab 2: Biểu đồ Lịch trình (Schedule Timeline View):**  
  * Giao diện dạng Gantt Chart hoặc Calendar (giống Google Calendar).  
  * Quản lý có thể dùng chuột kéo thả (Drag & Drop) để vẽ các khối thời gian (Time Blocks) cho từng Cổng. Ví dụ: Kéo một khối từ 07:00 đến 09:00 và gán nhãn FORCE\_IN cho Cổng số 1\.

### **5\. LUỒNG SỰ KIỆN CHÍNH (MAIN SUCCESS SCENARIOS)**

#### **5.1. Kịch bản A: Lên lịch trình định kỳ (Recurring Scheduling)**

* **Bước 1:** Manager mở Tab "Lịch trình", chọn Cổng Số 1\.  
* **Bước 2:** Bấm "Thêm khung giờ". Form xuất hiện yêu cầu cấu hình:  
  * Chế độ: LUỒNG VÀO (IN)  
  * Khung giờ: 07:00 đến 09:30  
  * Lặp lại: Thứ 2 đến Thứ 6  
* **Bước 3:** Bấm "Lưu lịch trình". Backend lưu dữ liệu vào bảng gate\_schedules.  
* **Kết quả:** Cứ đến 07:00 sáng các ngày trong tuần, hệ thống sẽ tự động gửi lệnh xuống Cổng số 1, ép giao diện của Staff chuyển sang luồng IN. Sau 09:30, cổng tự động chuyển về trạng thái FLEXIBLE.

#### **5.2. Kịch bản B: Can thiệp đóng/đảo cổng khẩn cấp (Live Emergency Override)**

* **Sự kiện:** Hầm B2 bị ngập nước cục bộ, Manager cần đóng khẩn cấp toàn bộ các Làn IN dẫn xuống hầm B2 ngay lập tức dù đang trong giờ làm việc của Staff.  
* **Bước 1:** Manager vào Tab "Thời gian thực", chọn các Cổng dẫn xuống B2, bấm nút **"ĐÓNG CỔNG (Khẩn cấp)"**.  
* **Bước 2:** Backend lập tức ghi đè trạng thái, bắn lệnh WebSocket xuống màn hình POS của Staff đang ngồi tại cổng đó.  
* **Bước 3:** Màn hình POS của Staff lập tức chớp đỏ và hiển thị Pop-up: *"LỆNH TỪ TRUNG TÂM: Cổng bị đóng khẩn cấp. Vui lòng hướng dẫn các xe đang chờ lùi lại và di chuyển sang cổng khác."*  
* **Bước 4:** Nếu Staff không phục vụ xe nào, hệ thống tự động đẩy Staff vào màn hình Chốt ca (Bàn giao tài chính) để đóng phiên làm việc.

### **6\. LUỒNG THAY THẾ & NGOẠI LỆ (ALTERNATIVE / EXCEPTION FLOWS)**

* **6.1. Xung đột lịch trình (Schedule Overlap):**  
  * *Sự kiện:* Manager vô tình cấu hình Cổng 2 là FORCE\_IN (08:00 \- 10:00) và tạo thêm một block CLOSED (09:00 \- 11:00) cho cùng Cổng 2 trong cùng một ngày.  
  * *Xử lý:* Backend phát hiện sự giao nhau về thời gian (Overlap). Hệ thống chặn thao tác Save và báo lỗi: *"Khung giờ 09:00-10:00 đang bị xung đột với lịch trình LUỒNG VÀO đã cài đặt. Vui lòng điều chỉnh lại."*  
* **6.2. Đảo cổng khi có xe đang giao dịch dở dang (Active Transaction Grace Period):**  
  * *Sự kiện:* Manager ấn nút ép FORCE\_OUT từ xa, nhưng đúng lúc đó Staff tại cổng đang thu tiền một chiếc xe luồng IN (Trạng thái xe là PENDING\_PAYMENT).  
  * *Xử lý:* Hệ thống KHÔNG ép màn hình F5 ngay lập tức để tránh làm mất dữ liệu tính tiền của khách. Màn hình Staff hiện thông báo: *"Lệnh đổi sang LUỒNG RA sẽ có hiệu lực ngay sau khi bạn hoàn tất cho chiếc xe này qua cổng"*. Ngay khi Staff bấm "Mở Barrier", xe đi qua, giao diện mới chính thức Refresh sang màn hình luồng RA.

### **7\. QUY TẮC NGHIỆP VỤ BẮT BUỘC (BUSINESS RULES)**

* **BR-MNG-01 (Độ ưu tiên lệnh \- Priority Rule):** Lệnh Can thiệp khẩn cấp (Live Override) bằng tay của Manager có độ ưu tiên tuyệt đối, sẽ tạm thời ghi đè (Suspend) mọi lịch trình tự động (Schedules) đang chạy tại thời điểm đó. Khi Manager bấm "Hủy can thiệp", cổng mới quay lại tuân thủ lịch tự động.  
* **BR-MNG-02 (Cấm phân mảnh \- No Micro-Scheduling):** Để tránh việc cổng nhảy trạng thái liên tục gây loạn cho Staff, một Block lịch trình phải có thời lượng tối thiểu là **30 phút**. Không cho phép cài đặt các lịch ngắn hạn như 5-10 phút.  
* **BR-MNG-03 (Tự động phục hồi \- Self-Healing):** Nếu một Cổng bị Manager ấn định "Đóng Cổng" vào ban đêm (Ví dụ từ 23:00 đến 05:00 sáng hôm sau). Đến đúng 05:01, hệ thống phải tự động gỡ bỏ lệnh Đóng, chuyển cổng sang trạng thái FLEXIBLE để Staff ca sáng có thể đăng nhập.

### **8\. CẤU TRÚC LƯU TRỮ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)**

**8.1. Bảng gates (Bổ sung trạng thái Khẩn cấp)**

* id (VARCHAR(20), Primary Key)  
* status (VARCHAR(20)) \- IDLE, OCCUPIED, OFFLINE.  
* **live\_override\_mode** (VARCHAR(20), Nullable) \- Lưu trạng thái ép buộc tức thời bằng tay: FORCE\_IN, FORCE\_OUT, CLOSED. Nếu Null nghĩa là đang chạy bình thường hoặc theo lịch.

**8.2. Bảng gate\_schedules (Quản lý Lịch trình định kỳ)**

* id (INT, Primary Key IDENTITY)  
* gate\_id (VARCHAR(20), Foreign Key)  
* scheduled\_mode (VARCHAR(20)) \- FORCE\_IN, FORCE\_OUT, CLOSED.  
* start\_time (TIME) \- Khung giờ bắt đầu (VD: 07:00).  
* end\_time (TIME) \- Khung giờ kết thúc (VD: 09:30).  
* day\_of\_week (VARCHAR(50)) \- Lưu chuỗi các ngày áp dụng (VD: MON,TUE,WED,THU,FRI hoặc ALL).  
* is\_active (BIT) \- Cho phép Manager bật/tắt (Enable/Disable) lịch trình này mà không cần xóa đi.

### **9\. ĐẶC TẢ GIAO THỨC API (REST API CONTRACT)**

**9.1. API Tạo mới Lịch trình Cổng (POST)**

* **Endpoint:** /api/v1/manager/gates/{gateId}/schedules  
* **Request Payload:**

JSON  
{  
  "scheduledMode": "FORCE\_IN",  
  "startTime": "07:00",  
  "endTime": "09:30",  
  "dayOfWeek": \["MON", "TUE", "WED", "THU", "FRI"\]  
}

* **Response (201 Created):** {"message": "Đã lưu lịch trình điều hướng thành công."}

**9.2. API Can thiệp Tức thời / Khẩn cấp (POST)**

* **Endpoint:** /api/v1/manager/gates/{gateId}/live-override  
* **Request Payload:**

JSON  
{  
  "overrideMode": "CLOSED",   
  "reason": "Ngập nước hầm B2"  
}

* **Hành động Backend:**  
  1. Update cột live\_override\_mode \= 'CLOSED' trong bảng gates.  
  2. Bắn WebSocket xuống Cổng đó.  
  3. Ghi log Audit hành vi Đóng cổng khẩn cấp của Manager.  
* **Response (200 OK):** {"message": "Lệnh đóng cổng khẩn cấp đã được truyền đến Trạm kiểm soát."}

**9.3. API Hủy Can thiệp Tức thời (DELETE)**

* **Endpoint:** /api/v1/manager/gates/{gateId}/live-override  
* **Hành động Backend:** Reset live\_override\_mode \= NULL, cổng trở lại tuân thủ theo lịch trình (nếu có) hoặc trở về trạng thái FLEXIBLE. Bắn lệnh WebSocket báo cho Staff biết cổng đã được giải tỏa.

## **ĐIỀU HƯỚNG VÀ PHÂN BỔ VỊ TRÍ ĐỖ XE (SMART ROUTING ENGINE)**

### **1\. TỔNG QUAN PHÂN HỆ**

* **Mã Use Case:** UC-MNG09  
* **Tên Use Case:** Cấu hình Điều hướng & Phân bổ Vị trí (Smart Routing & Slot Allocation).  
* **Mục tiêu:** Cung cấp cho Quản lý (Manager) một giao diện trực quan để thiết lập kịch bản luân chuyển dòng xe. Hệ thống tự động chỉ định chính xác vị trí đỗ (Slot) cho từng xe ngay khi qua cổng Check-in, hiển thị lên bảng LED để điều hướng xe trượt qua các Zone theo đúng tỷ lệ ngưỡng lấp đầy, ngăn chặn tắc nghẽn cục bộ dưới hầm.

### **2\. ĐẶC TẢ GIAO DIỆN CẤU HÌNH (ROUTING CONFIGURATION UI)**

Giao diện được thiết kế tối giản, loại bỏ việc nhập liệu thủ công rườm rà, tập trung vào thao tác kéo thả (Drag & Drop).

* **Bước 1 (Bộ lọc Không gian):** Manager chọn **Tầng hầm** (VD: Tầng B1) và **Loại phương tiện** (VD: Ô tô). Hệ thống sẽ tải lên danh sách tất cả các Zone thuộc tầng đó.  
* **Bước 2 (Khởi tạo Danh sách):** Mặc định, hệ thống render danh sách các Zone theo thứ tự Alphabet (Ví dụ: Zone A \\rightarrow Zone B \\rightarrow Zone C).  
* **Bước 3 (Thiết lập Cấp bậc \- Priority Sort):** \* Giao diện hỗ trợ tính năng **Kéo & Thả (Drag & Drop)**.  
  * Manager nhấp giữ một Zone bất kỳ và kéo lên/xuống để thay đổi thứ tự ưu tiên. Zone nằm trên cùng là Ưu tiên 1 (Priority 1), tiếp theo là Ưu tiên 2, 3...  
* **Bước 4 (Thiết lập Ngưỡng trượt \- Overflow Threshold):**  
  * Bên cạnh mỗi Zone có một thanh trượt (Slider) hoặc ô nhập liệu % Lấp đầy mục tiêu.  
  * Manager thiết lập tỷ lệ (VD: Zone A đặt 80%, Zone B đặt 70%).  
  * *Ý nghĩa:* Không nhồi nhét Zone A đến 100% gây kẹt xe, chỉ điền đến 80% rồi cho dòng xe trượt sang Zone B.  
* **Bước 5:** Bấm **"Lưu cấu hình"**. Dữ liệu được đẩy xuống Backend để làm tham số gốc cho Bộ định tuyến.

### **3\. KIẾN TRÚC THUẬT TOÁN ĐIỀU HƯỚNG (THE ROUTING ENGINE)**

Khi một chiếc xe quẹt thẻ thành công tại cổng IN, hệ thống Backend lập tức chạy luồng thuật toán 3 giai đoạn (3-Phase Algorithm) để tìm ra 1 Slot duy nhất trả về cho bảng LED và in lên vé.

#### **GIAI ĐOẠN 1: THUẬT TOÁN ĐIỀN ĐẦY THEO NGƯỠNG (THRESHOLD FILLING)**

* Hệ thống duyệt danh sách Zone theo đúng thứ tự Ưu tiên (Priority) đã cấu hình.  
* Tại mỗi Zone, hệ thống tính toán: Tỷ lệ lấp đầy hiện tại \= (Số xe đang đỗ / Tổng số Slot) \* 100\.  
* **Luồng quyết định:**  
  * Nếu Tỷ lệ hiện tại \< Ngưỡng cấu hình: Chốt chọn Zone này \\rightarrow Chuyển sang Giai đoạn 3\.  
  * Nếu Tỷ lệ hiện tại \\ge Ngưỡng cấu hình: Bỏ qua Zone này, **trượt (overflow)** sang Zone có mức ưu tiên thấp hơn tiếp theo.

#### **GIAI ĐOẠN 2: VÒNG LẶP VÉT CẠN (100% BACKFILL LOOP)**

Bài toán: Sẽ có thời điểm tất cả các Zone đều đã đạt mức Ngưỡng cấu hình (Ví dụ Zone A đạt 80%, B đạt 70%, C đạt 90%). Dòng xe vẫn tiếp tục đổ vào, hệ thống phải xử lý thế nào?

* **Luồng quyết định:**  
  * Khi con trỏ duyệt đến Zone ưu tiên thấp nhất mà vẫn thấy chạm ngưỡng, hệ thống kích hoạt **Vòng lặp vét cạn**.  
  * Con trỏ quay ngược trở lại **Zone Ưu tiên 1**. Lúc này, hệ thống tạm thời **vô hiệu hóa (bypass)** cấu hình Ngưỡng % ban đầu, và nâng mức mục tiêu của Zone này lên **100%** (Full Capacity).  
  * Xe tiếp tục được nhồi vào Zone 1 cho đến khi không còn 1 chỗ trống nào \\rightarrow Tiếp tục trượt sang Zone 2 để điền đến 100% \\rightarrow Trượt đến Zone cuối cùng. Khi tất cả 100%, barrier báo hiệu "BÃI ĐẦY".

#### **GIAI ĐOẠN 3: THUẬT TOÁN CHỌN SLOT ALPHABET (SLOT ALLOCATOR)**

Sau khi Giai đoạn 1 hoặc 2 đã chốt được Zone mục tiêu (VD: Đã chọn được Zone A). Hệ thống tiến hành dò tìm vị trí đỗ cụ thể.

* **Quy tắc:** Chọn Slot trống theo thứ tự Alphabet và Numeric tăng dần (A01 \\rightarrow A02 \\rightarrow B01).  
* **Câu lệnh SQL Server tối ưu:**  
  SELECT TOP 1 slot\_name, id   
  FROM slots   
  WHERE zone\_id \= :selectedZoneId   
    AND status \= 'EMPTY'   
  ORDER BY slot\_name ASC;

* **Kết quả:** Trả về "Slot A15". Hệ thống tự động UPDATE trạng thái Slot A15 thành BOOKED (Giữ chỗ tạm thời) để xe tiếp theo đi vào không bị trùng lặp, đồng thời đẩy "A15" lên màn hình LED cổng để khách hàng lái xe tới đúng điểm.

### **4\. KỊCH BẢN VẬN HÀNH THỰC TẾ (EXECUTION MOCKUP)**

**Giả lập Cấu hình:**

* Tầng B1 có 3 Zone (Mỗi Zone có sức chứa 100 Slot).  
* Manager cấu hình:  
  1. **Zone A** (Ưu tiên 1\) \- Ngưỡng **80%** (Slot từ A01 \- A100).  
  2. **Zone B** (Ưu tiên 2\) \- Ngưỡng **70%** (Slot từ B01 \- B100).  
  3. **Zone C** (Ưu tiên 3\) \- Ngưỡng **90%** (Slot từ C01 \- C100).

**Mô phỏng Dòng xe chạy:**

* **Chiếc xe Số 1 tiến vào:** Hệ thống check Zone A (Đang 0% \< 80\\%) \\rightarrow Chọn Zone A. Tìm slot trống Alphabet \\rightarrow Trả kết quả: **Vị trí A01**.  
* **Chiếc xe Số 2 tiến vào:** Tương tự \\rightarrow Trả kết quả: **Vị trí A02** (Lấp đầy tuần tự rất ngăn nắp).  
* ...  
* **Chiếc xe Số 81 tiến vào:** Hệ thống check Zone A. Lúc này Zone A có 80 xe (Đạt ngưỡng 80%). Thuật toán kích hoạt lệnh trượt (Overflow) sang Zone B. Zone B đang có 0% \< 70\\% \\rightarrow Chọn Zone B. Trả kết quả: **Vị trí B01**.  
* ...  
* *(Đến chiều tối, bãi xe cực đông)*. Các Zone đều đã đạt ngưỡng (A đang có 80 xe, B có 70 xe, C có 90 xe).  
* **Chiếc xe Số 241 tiến vào:** Hệ thống quét qua A, B, C đều thấy chạm ngưỡng. Nó lập tức kích hoạt "Vòng lặp vét cạn" quay lại Zone A (nâng trần lên 100%). Lúc này Zone A còn 20 chỗ trống (Từ A81 đến A100). Trả kết quả: **Vị trí A81**.

### **5\. CẤU TRÚC LƯU TRỮ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)**

Để giao diện kéo thả hoạt động mượt mà và lưu trữ được luật điều hướng, ta thiết kế bảng cấu hình riêng biệt:  
**Bảng: routing\_rules**

* id (INT, Primary Key)  
* floor\_id (INT, Foreign Key)  
* vehicle\_type (VARCHAR)  
* zone\_id (INT, Foreign Key)  
* priority\_order (INT) \- (Lưu số thứ tự 1, 2, 3... tương ứng với vị trí Manager kéo thả trên giao diện).  
* threshold\_percent (INT) \- (Lưu tỷ lệ ngưỡng trượt, VD: 80).

**Tối ưu hóa Index:** Cột priority\_order bắt buộc phải được đánh Index (Chỉ mục) để mỗi khi có xe vào, câu lệnh SELECT của Backend có thể xếp hạng và duyệt danh sách các Zone nhanh dưới 5 mili-giây, đảm bảo Barrier mở ngay lập tức mà không có độ trễ.

## **QUẢN LÝ KHO THẺ VÀ TRẠNG THÁI (MOCK CARD MANAGEMENT)**

### **1\. TỔNG QUAN PHÂN HỆ**

* **Mã Use Case:** UC-MNG10  
* **Tên Use Case:** Quản lý Kho thẻ & Trạng thái (Card Pool & Status Management).  
* **Tác nhân (Actor):** Quản lý bãi xe (Manager).  
* **Mục tiêu:** Cung cấp giao diện để Manager khởi tạo nhanh hàng loạt thẻ xe giả lập trên Web theo chuỗi số tăng dần, đồng thời theo dõi và điều chỉnh trạng thái vòng đời của thẻ, sẵn sàng làm tài nguyên định danh cho các phân hệ Check-in/Check-out.

### **2\. TÍNH NĂNG THÊM THẺ TỰ ĐỘNG THEO CHUỖI (SEQUENTIAL BATCH GENERATION)**

Vì hệ thống chưa kết nối với đầu đọc IoT ở giai đoạn này, việc nhập thẻ sẽ được xử lý hoàn toàn bằng thuật toán sinh chuỗi tự động trên Backend.

* **Thao tác trên giao diện Form:**  
  * **Mã thẻ đầu tiên (Start Card ID):** Một trường nhập số nguyên (Ví dụ: 10001).  
  * **Số lượng cần thêm (Quantity):** Trường nhập số lượng thẻ cần khởi tạo (Ví dụ: 50).  
* **Thuật toán xử lý ngầm tại Backend (Java Spring Boot):**  
  * Khi Manager bấm "Xác nhận tạo lô thẻ", hệ thống chạy một vòng lặp tuyến tính từ 0 đến Quantity \- 1\.  
  * Công thức sinh mã thẻ tự động: Mã\_thẻ\_mới \= Start\_Card\_ID \+ i.  
  * Hệ thống tự động gán trạng thái ban đầu cho toàn bộ lô thẻ mới sinh ra là AVAILABLE.  
* **Ràng buộc kiểm tra chống trùng (Validation Rule):**  
  * Trước khi chạy vòng lặp, Backend sẽ quét Database để kiểm tra xem có bất kỳ mã nào trong khoảng từ Start\_Card\_ID đến Start\_Card\_ID \+ Quantity \- 1 đã tồn tại chưa.  
  * Nếu phát hiện dù chỉ 1 mã trùng, hệ thống dừng toàn bộ tiến trình (Rollback) và báo lỗi đỏ: *"Lỗi: Dải mã thẻ từ \[A\] đến \[B\] đang có mã bị trùng lặp với kho hiện tại. Vui lòng kiểm tra lại mã thẻ đầu tiên."*

**3\. TẬP TRUNG QUẢN LÝ TRẠNG THÁI VÒNG ĐỜI THẺ (STATUS LIFE-CYCLE)**  
Hệ thống không phân chia loại thẻ (Không có khái niệm thẻ vé tháng hay thẻ VIP). Toàn bộ thẻ cứng RFID nằm chung trong một kho tổng và đóng vai trò là "Token vật lý" để xoay vòng cho mọi phiên gửi xe (Vãng lai và Đặt trước). Quyền năng của thẻ phụ thuộc vào **Trạng thái (Status)** hiện tại của nó trên hệ thống.  
Manager có quyền xem danh sách và Click đổi trạng thái thẻ sang các danh mục sau:

* **AVAILABLE (Sẵn sàng):** Thẻ trống đang nằm trong tủ tại trạm. Thẻ ở trạng thái này mới được phép đem ra quẹt để gán cho khách Vãng lai hoặc khách Đặt trước khi họ tiến vào bãi.  
* **IN\_USE (Đang sử dụng):** Thẻ đang được liên kết với một phiên đỗ xe (Vãng lai hoặc Booking) và chiếc xe đó đang nằm dưới hầm.  
* **LOCKED (Khóa tạm thời):** Áp dụng khi phát hiện thẻ có dấu hiệu gian lận hoặc lỗi hệ thống. Khi thẻ ở trạng thái này, hệ thống cổng sẽ từ chối Check-in/Check-out.  
* **LOST (Báo mất):** Kích hoạt khi khách làm rơi thẻ (Liên kết với quy trình xử lý mất vé). Thẻ này bị loại vĩnh viễn khỏi luồng vận hành để phòng trường hợp kẻ gian nhặt được dùng để trộm xe.  
* **DAMAGED (Hỏng hóc):** Thẻ bị gãy vật lý hoặc chết chip, được đưa vào danh sách chờ tiêu hủy vật tư.

**4\. QUY TẮC NGHIỆP VỤ (BUSINESS RULES FOR WEB PHASE)**

* **BR-01 (Tính nhất quán của trạng thái):** Manager **không được phép** chuyển trạng thái một chiếc thẻ từ IN\_USE về AVAILABLE hoặc LOST một cách tự phát nếu phần mềm đang ghi nhận có xe đỗ dưới hầm (is\_inside \= TRUE). Bắt buộc xe phải Check-out hoặc được Staff xử lý ngoại lệ đóng phiên (Báo mất thẻ) thì thẻ mới giải phóng về trạng thái trống.  
* **BR-02 (Tái sử dụng thẻ xoay vòng):** Khi bất kỳ chiếc xe nào (Vãng lai hay Booking) Check-out thành công và thanh toán xong (nếu có phát sinh phí), hệ thống sẽ tự động gỡ liên kết phiên đỗ và đổi trạng thái thẻ đó từ IN\_USE quay ngược trở lại thành AVAILABLE. Nhân viên thu lại thẻ và nạp vào tủ phát thẻ cho lượt khách tiếp theo.

### **5\. CẤU TRÚC LƯU TRỮ CƠ SỞ DỮ LIỆU TỐI GIẢN (DATABASE SCHEMA)**

Để phục vụ cho giao diện Web chạy mượt mà, cấu trúc bảng dữ liệu được tinh gọn tối đa:  
**Bảng: parking\_cards**

* id (INT, Primary Key, Auto Increment)  
* card\_code (VARCHAR, Unique Index) \- Mã số chuỗi thẻ sinh ra (Ví dụ: "10001", "10002").  
* status (VARCHAR) \- Lưu 1 trong 5 trạng thái (AVAILABLE, IN\_USE, LOCKED, LOST, DAMAGED).  
* is\_inside (BOOLEAN) \- Cờ kiểm tra xem thẻ đang ở dưới hầm hay ở ngoài bãi (TRUE/FALSE).  
* assigned\_plate (VARCHAR, Nullable) \- Biển số xe đang tạm thời gắn với thẻ này.  
* updated\_at (DATETIME) \- Ghi nhận mốc thời gian cuối cùng đổi trạng thái thẻ để làm báo cáo đối soát.

## **ĐIỀU CHỈNH HÓA ĐƠN VÀ XỬ LÝ KHIẾU NẠI TỪ XA**

**(MÃ PHÂN HỆ: UC-MNG06 \- REMOTE FEE OVERRIDE & LAZY EVALUATION LOCK)**

### **1\. TỔNG QUAN PHÂN HỆ (MODULE OVERVIEW)**

* **Mã Use Case:** UC-MNG06  
* **Tên Use Case:** Điều chỉnh hóa đơn và xử lý khiếu nại từ xa.  
* **Tác nhân (Actor):** Quản lý bãi xe (Manager / Admin).  
* **Mục tiêu:** Cung cấp công cụ cho Quản lý can thiệp vào hóa đơn cuối cùng để giải quyết khiếu nại (sai phí, kẹt xe nội khu, khách ngoại giao) ngay khi phương tiện vẫn đang lưu thông dưới hầm. Hệ thống áp dụng kiến trúc "Tính toán lười" (Lazy Evaluation) và mốc thời gian tĩnh (Timestamp Deadline) để kiểm soát thời gian thoát bãi mà không cần tiêu tốn tài nguyên chạy các tiến trình ngầm (Background Jobs).

### **2\. TIỀN ĐIỀU KIỆN (PRECONDITIONS)**

* Khách hàng đã tra cứu phí trên Web/App (React) và gửi Ticket báo cáo sai phí. Trạng thái phiên đỗ đang là INSIDE.  
* Quản lý đang đăng nhập trên Web Admin (React) với quyền ROLE\_MANAGER hoặc ROLE\_ADMIN.  
* Cấu hình thời gian ân hạn thoát bãi (Exit Window Timeout) mặc định của hệ thống được thiết lập là 15 phút.

### **3\. KIẾN TRÚC VẬN HÀNH CỐT LÕI (CORE MECHANISMS)**

Hệ thống phân tách luồng điều chỉnh thành 3 giai đoạn xử lý độc lập tại tầng Backend (Spring Boot), tuân thủ tuyệt đối nguyên tắc không phá vỡ lõi thuật toán cắt thời gian.

#### **3.1. Giai đoạn Tạm dừng Xử lý (Processing Pause)**

* Ngay khi Quản lý tiếp nhận Ticket và bấm "Tạm dừng tính phí", hệ thống chốt cứng mốc thời gian thực tại giây đó vào trường processing\_paused\_at.  
* Mọi Request tra cứu giá (từ App của khách) trong thời gian này sẽ chỉ lấy mốc processing\_paused\_at làm điểm kết thúc ảo (End Time Proxy) đưa vào máy cắt. Số tiền trên App của khách hàng tạm thời đứng yên.

#### **3.2. Giai đoạn Ấn định Cước và Cấp lệnh ra (Override & Exit Window)**

* Khi Quản lý nhập số tiền mới và bấm "Xác nhận & Cho xe ra", hệ thống ghi đè số tiền thực thu vào final\_paid\_fee.  
* Đồng thời, hệ thống cộng thêm 15 phút vào thời gian hiện tại để tạo ra một mốc giới hạn tĩnh: exit\_window\_deadline.

#### **3.3. Lớp Tính toán Lười tại Cổng (Lazy Evaluation Check-out)**

Tại cổng OUT, khi nhân viên thu ngân quẹt thẻ, SQL Server truy xuất bản ghi và Backend chỉ thực hiện thuật toán kiểm tra O(1):

* **Trường hợp \\text{CurrentTime} \\le \\text{exit\\\_window\\\_deadline}:** Khách hàng ra đúng hạn. Hệ thống bỏ qua thuật toán tính tiền, lấy trực tiếp giá trị final\_paid\_fee (đã được Quản lý giảm) xuất ra bảng LED và chốt giao dịch.  
* **Trường hợp \\text{CurrentTime} \> \\text{exit\\\_window\\\_deadline}:** Khách hàng vi phạm thời gian ân hạn. Hệ thống tự động xóa toàn bộ lệnh giảm phí (Xóa cờ is\_adjusted, reset final\_paid\_fee), sau đó nạp CurrentTime vào Bộ máy tính phí (Pricing Engine) để tính lại từ đầu theo đúng biểu giá hiện hành.

### **4\. LUỒNG SỰ KIỆN CHÍNH (MAIN SUCCESS SCENARIO)**

* **Bước 1 (Tiếp nhận):** Quản lý mở Ticket trên Web Admin. Màn hình hiển thị chi tiết phiên đỗ, thời gian vào và số tiền thực tế máy đang tính.  
* **Bước 2 (Khóa thời gian):** Quản lý bấm nút **"Tạm dừng tính phí"**. Hệ thống gọi API khóa mốc thời gian. Nút chức năng chuyển sang trạng thái ĐANG TẠM DỪNG. Form điều chỉnh phí được mở khóa.  
* **Bước 3 (Nhập liệu Can thiệp):** Quản lý chọn "Lý do điều chỉnh" (Bắt buộc chọn từ Dropdown: *Ách tắc nội khu, Sự cố phần mềm, Thẻ lỗi, Khách VIP*) và nhập số tiền thu cuối cùng (Ví dụ: 30.000 VNĐ).  
* **Bước 4 (Phê duyệt):** Quản lý bấm **"Xác nhận & Cho xe ra"**. Backend (Spring Boot) bọc giao dịch trong @Transactional:  
  * Ghi log kiểm toán vào bảng fee\_adjustments.  
  * Cập nhật exit\_window\_deadline lên bản ghi gốc trong SQL Server.  
* **Bước 5 (Đồng bộ Client):** App của khách hàng nhận thông báo Push Notification: *"Yêu cầu của bạn đã được xử lý. Phí gửi xe được điều chỉnh còn 30.000 VNĐ. Vui lòng di chuyển ra cổng trước \[Giờ hết hạn\]"*.  
* **Bước 6 (Hoàn tất tại cổng):** Khách lái xe đến cổng IN/OUT. Thu ngân quẹt thẻ, hệ thống đối chiếu mốc exit\_window\_deadline hợp lệ, thu 30.000 VNĐ, mở Barrier và cập nhật trạng thái COMPLETED.

### **5\. LUỒNG THAY THẾ & NGOẠI LỆ (ALTERNATIVE / EXCEPTION FLOWS)**

* **5.1. Quản lý bỏ quên Ticket đang tạm dừng (Forgotten Pause State):**  
  * *Sự kiện:* Quản lý bấm "Tạm dừng tính phí" nhưng sau đó bận việc, không bấm "Xác nhận & Cho xe ra" cũng không bấm "Hủy".  
  * *Xử lý:* Trạng thái tạm dừng chỉ có hiệu lực tối đa 30 phút. Nếu quá hạn tự nhả, hoặc khi chốt đơn ra, thời gian lưu bãi để tính phí phải **trừ đi khoảng thời gian bị Pause** (Tức là `TotalTime = CurrentTime - (CurrentTime - processing_paused_at)`). Điều này đảm bảo khách không bị tính lố tiền oan do lỗi chậm trễ của Quản lý.  
* **5.2. Mức giảm vượt ngưỡng phân quyền (Discount Threshold Breach):**  
  * *Sự kiện:* Quản lý ca nhập lệnh giảm phí từ 3.000.000 VNĐ xuống 0 VNĐ (Miễn phí 100%). Ngưỡng cấu hình hệ thống chỉ cho phép Manager giảm tối đa 20%.  
  * *Xử lý:* Nút "Xác nhận" sẽ đẩy ra một Modal cảnh báo: *"Mức giảm vượt quá 20% thẩm quyền. Yêu cầu đã được chuyển đến ADMIN."* Giao dịch bị tạm treo. Chỉ khi tài khoản Admin duyệt trên hệ thống, mốc exit\_window\_deadline mới bắt đầu được kích hoạt.

### **6\. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)**

* **BR-OVR-01 (Bảo toàn dữ liệu tính toán gốc):** Mọi lệnh can thiệp phí tuyệt đối không được ghi đè lên trường actual\_calculated\_fee (Số tiền máy tính). Hệ thống bắt buộc phải giữ lại con số gốc này để kế toán đối soát độ chênh lệch (Thất thu) vào cuối tháng.  
* **BR-OVR-02 (Luật khóa thanh toán trực tuyến):** Đối với các đơn Đặt chỗ trước (Booking) đã mang trạng thái PRE\_PAID, hệ thống Vô hiệu hóa (Disable) nút "Tạm dừng tính phí" và "Điều chỉnh hóa đơn". Không hỗ trợ hoàn tiền mặt (Refund) qua chức năng này để chống gian lận dòng tiền.  
* **BR-OVR-03 (Minh bạch kiểm toán):** Mọi thao tác giảm phí phải được ghi log đầy đủ thông tin: ID tài khoản duyệt, thời gian duyệt, số tiền chênh lệch, và lý do vào bảng fee\_adjustments. Hệ thống không cho phép xóa (Hard-delete) các bản ghi này dưới mọi hình thức.

### **7\. CẤU TRÚC LƯỢT LƯU TRỮ CƠ SỞ DỮ LIỆU (SQL SERVER SCHEMA)**

**7.1. Cập nhật bảng parking\_sessions**  
`ALTER TABLE parking_sessions ADD`  
    `is_processing_paused BIT DEFAULT 0,`  
    `processing_paused_at DATETIME NULL,`  
    `exit_window_deadline DATETIME NULL,`  
    `actual_calculated_fee DECIMAL(18,2) NULL,`  
    `final_paid_fee DECIMAL(18,2) NULL,`  
    `payment_order_code BIGINT UNIQUE NULL,`  
    `payment_method VARCHAR(20) NULL,`  
    `is_overpaid BIT DEFAULT 0,`  
    `is_adjusted BIT DEFAULT 0;`

**7.2. Tạo mới bảng fee\_adjustments (Audit Trail)**  
`CREATE TABLE fee_adjustments (`  
    `id INT PRIMARY KEY IDENTITY(1,1),`  
    `session_id VARCHAR(50) NOT NULL FOREIGN KEY REFERENCES parking_sessions(id),`  
    `original_calculated_fee DECIMAL(18,2) NOT NULL,`  
    `adjusted_final_fee DECIMAL(18,2) NOT NULL,`  
    `discount_amount AS (original_calculated_fee - adjusted_final_fee) PERSISTED,`  
    `adjustment_reason NVARCHAR(500) NOT NULL,`  
    `approved_by INT NOT NULL FOREIGN KEY REFERENCES users(id),`  
    `created_at DATETIME DEFAULT GETDATE()`  
`);`

### **8\. ĐẶC TẢ GIAO THỨC API (SPRING BOOT REST ENDPOINTS)**

**8.1. API Tạm dừng tính phí (POST)**

* **Endpoint:** /api/v1/manager/parking-sessions/{sessionId}/pause  
* **Authorization:** Bearer \<JWT\_TOKEN\> (ROLE\_MANAGER, ROLE\_ADMIN)  
* **Response (200 OK):**

`{`  
  `"sessionId": "SES_88192",`  
  `"isProcessingPaused": true,`  
  `"processingPausedAt": "2026-06-15T09:45:00",`  
  `"actualCalculatedFee": 40000,`  
  `"message": "Đã tạm dừng tính phí. Hệ thống giữ mức phí 40,000 VNĐ để xử lý."`  
`}`

**8.2. API Xác nhận giảm phí và Cấp lệnh ra (POST)**

* **Endpoint:** /api/v1/manager/parking-sessions/{sessionId}/adjust  
* **Authorization:** Bearer \<JWT\_TOKEN\>  
* **Request Body:**

`{`  
  `"finalPaidFee": 20000,`  
  `"adjustmentReason": "LỖI_KẸT_XE_NỘI_KHU",`  
  `"note": "Kiểm tra camera thấy ùn tắc tại dốc B2"`  
`}`

* **Response (200 OK):**

`{`  
  `"sessionId": "SES_88192",`  
  `"isProcessingPaused": false,`  
  `"finalPaidFee": 20000,`  
  `"exitWindowDeadline": "2026-06-15T10:00:00",`  
  `"message": "Đã lưu điều chỉnh phí. Phương tiện có 15 phút để qua cổng."`  
`}`

## **QUẢN LÝ DANH TÍNH VÀ XÁC THỰC NGƯỜI DÙNG**

**(MÃ PHÂN HỆ: UC-SYS01 \- OMNICHANNEL IDENTITY & OTP VERIFICATION)**

### **1\. TỔNG QUAN PHÂN HỆ (MODULE OVERVIEW)**

* **Mã Use Case:** UC-SYS01  
* **Tên Use Case:** Quản lý Danh tính, OTP, Đăng nhập đa kênh và Liên kết tài khoản.  
* **Tác nhân (Actor):** Khách vãng lai (Guest), Người dùng (User), Nhân sự nội bộ.  
* **Mục tiêu:** Cung cấp cổng xác thực bảo mật thông qua JWT. Thay thế hoàn toàn cơ chế Magic Link bằng mã OTP 6 số để tối ưu UX. Hệ thống hỗ trợ định danh chéo: Người dùng Google có thể tạo thêm mật khẩu độc lập, và người dùng mật khẩu có thể liên kết tài khoản Google của họ.

### **2\. KIẾN TRÚC XÁC THỰC BỔ SUNG (ADDITIONAL ARCHITECTURE)**

* **Cơ chế OTP Cache:** Mã OTP không nên lưu cứng vào bảng users. Spring Boot sẽ sinh mã OTP ngẫu nhiên 6 số và lưu vào một bảng tạm otp\_verifications trong SQL Server (hoặc Redis nếu có) với thời gian sống (TTL) đúng 5 phút.  
* **Hợp nhất định danh (Identity Merging):** Cấu trúc tài khoản không còn rạch ròi auth\_provider \= 'LOCAL' hay GOOGLE một cách độc quyền. Một tài khoản có thể vừa có password\_hash vừa có google\_id.

### **3\. LUỒNG SỰ KIỆN CHÍNH (MAIN SUCCESS SCENARIOS)**

#### **3.1. UC-SYS01.1 \- Đăng ký tài khoản (Local Register) & Xác thực OTP**

* **Bước 1 (Ghi nhận thông tin):** User nhập Email, Mật khẩu, Họ tên. Bấm "Đăng ký".  
* **Bước 2 (Khởi tạo Trạng thái Chờ):** Backend băm (Bcrypt) mật khẩu, lưu vào bảng users với cờ is\_verified \= 0\. Đồng thời sinh ra một mã OTP 6 số (VD: 482910), lưu vào DB với hạn 5 phút.  
* **Bước 3 (Gửi OTP):** Backend gọi dịch vụ SMTP gửi Email chứa mã OTP. Frontend chuyển sang màn hình "Nhập mã xác thực".  
* **Bước 4 (Xác thực):** User nhập 6 số. Frontend gọi API Verify. Backend đối chiếu mã OTP. Nếu đúng, bật cờ is\_verified \= 1, cấp luôn Access\_Token và cho User vào thẳng trang chủ.

#### **3.2. UC-SYS01.2 \- Đăng nhập Google & Thiết lập Mật khẩu (Google to Local)**

* **Bước 1 (Xác thực Google):** User đăng nhập bằng Google. Backend nhận Google\_ID\_Token, xác thực với Google Server, lấy Email và sinh tài khoản mới (nếu chưa có). Tài khoản này sẽ có google\_id nhưng password\_hash bị Null.  
* **Bước 2 (Cấp Token):** Backend trả JWT về cho Frontend. Khách hàng đã đăng nhập thành công.  
* **Bước 3 (Gợi ý đặt mật khẩu):** Tại giao diện "Cài đặt tài khoản" trên App, hiển thị cảnh báo: *"Tài khoản của bạn chưa có mật khẩu. Hãy thiết lập mật khẩu để có thể đăng nhập bằng Email khi mất tài khoản Google"*.  
* **Bước 4 (Thiết lập):** User nhập mật khẩu mới. Backend mã hóa Bcrypt và Update vào cột password\_hash. Từ nay, User có thể log in bằng cả 2 cách.

#### **3.3. UC-SYS01.3 \- Đăng nhập Truyền thống & Liên kết Google (Local to Google)**

* **Bước 1 (Xác thực Local):** User đăng nhập bằng Email và Mật khẩu truyền thống. Vào mục "Cài đặt tài khoản".  
* **Bước 2 (Yêu cầu Liên kết):** User bấm nút **"Liên kết tài khoản Google"**.  
* **Bước 3 (Xác thực OAuth2):** Frontend gọi Popup Google để lấy Google\_ID\_Token mới và gửi xuống Backend kèm theo Access\_Token hiện tại của User (để Backend biết ai đang yêu cầu liên kết).  
* **Bước 4 (Cập nhật DB):** Backend giải mã ID Token của Google, lấy ra Subject ID (UID của Google) và Update vào cột google\_id của tài khoản hiện tại.

#### **3.4. UC-SYS01.4 \- Quên mật khẩu qua OTP (Forgot Password)**

* **Bước 1:** User nhập Email và bấm "Khôi phục mật khẩu".  
* **Bước 2:** Backend sinh OTP 6 số, gửi qua Email.  
* **Bước 3:** User nhập OTP. Nếu đúng, Backend sinh một Temporary\_Token (Hạn 5 phút) trả về cho Frontend.  
* **Bước 4:** Frontend dùng Temporary\_Token này làm chìa khóa để gọi API Đổi mật khẩu mới.

### **4\. LUỒNG THAY THẾ & NGOẠI LỆ (ALTERNATIVE / EXCEPTION FLOWS)**

* **4.1. Lỗi Xung đột Liên kết Google:**  
  * *Sự kiện:* User A đang đăng nhập bằng Local, bấm Liên kết Google. Tuy nhiên, tài khoản Google này trước đó đã được dùng để tạo một tài khoản (User B) trong hệ thống bãi xe.  
  * *Xử lý:* Backend phát hiện google\_id đã tồn tại ở bản ghi khác. Trả về mã HTTP 409 Conflict: *"Tài khoản Google này đã được liên kết với một người dùng khác. Vui lòng chọn tài khoản Google khác"*.  
* **4.2. Khóa chức năng Gửi lại OTP (Spam Protection):**  
  * *Sự kiện:* User liên tục bấm "Gửi lại mã OTP" gây quá tải hệ thống gửi Mail.  
  * *Xử lý:* Backend áp dụng Rate Limit (Throttle). Nút "Gửi lại mã" trên UI bị vô hiệu hóa (đếm ngược 60 giây). Nếu gọi API /resend-otp quá 3 lần/15 phút, tài khoản bị tạm khóa chức năng nhận OTP trong 1 giờ.

### **5\. QUY TẮC NGHIỆP VỤ BẮT BUỘC (BUSINESS RULES)**

* **BR-ID-01 (Bắt buộc Xác thực):** Bất kỳ tài khoản nào được tạo qua luồng Local Register mà is\_verified \= 0 sẽ không được phép đăng nhập. Sau 24h nếu không nhập OTP, một Background Job (chạy lúc 2h sáng) sẽ dọn dẹp (Hard Delete) các tài khoản rác này khỏi DB.  
* **BR-ID-02 (Cơ chế Nhập sai OTP):** Tại màn hình nhập OTP (đăng ký hoặc quên mật khẩu), nếu User nhập sai mã quá 5 lần, mã OTP hiện tại lập tức bị hủy (Invalidated) dù chưa hết hạn 5 phút. User buộc phải thao tác xin lại mã mới.  
* **BR-ID-03 (Bảo vệ luồng Đặt mật khẩu):** API thiết lập mật khẩu (dành cho người dùng Google) bắt buộc phải nhận vào một JWT hợp lệ ở Header (Authorization: Bearer). Không cho phép cập nhật mật khẩu vô danh.

### **6\. CẤU TRÚC LƯU TRỮ CƠ SỞ DỮ LIỆU CẬP NHẬT (SQL SERVER SCHEMA)**

**6.1. Bảng users (Đã gỡ bỏ auth\_provider)**

* id (INT, Primary Key IDENTITY)  
* email (VARCHAR(150), Unique, Not Null)  
* password\_hash (VARCHAR(255), Nullable) \- Có dữ liệu nếu có mật khẩu.  
* google\_id (VARCHAR(100), Unique, Nullable) \- Có dữ liệu nếu có liên kết Google.  
* is\_verified (BIT) \- Trạng thái đã kích hoạt OTP (Luôn \= 1 nếu tạo qua Google).  
* role (VARCHAR(20))

**6.2. Bảng otp\_verifications (Quản lý mã OTP)**

* id (INT, Primary Key IDENTITY)  
* user\_email (VARCHAR(150), Not Null) \- Lưu Email thay vì UserID để phục vụ cả việc tạo tài khoản mới.  
* otp\_code (VARCHAR(10), Not Null) \- Mã 6 số (VD: 849201).  
* purpose (VARCHAR(20)) \- Loại OTP: REGISTER, FORGOT\_PASSWORD.  
* expires\_at (DATETIME) \- Hạn sử dụng (Hiện tại \+ 5 phút).  
* attempts (INT, Default 0\) \- Đếm số lần nhập sai.  
* is\_used (BIT, Default 0\)

### **7\. ĐẶC TẢ GIAO THỨC TÍCH HỢP (REST API CONTRACT)**

**7.1. API Đăng ký & Gửi OTP (POST)**

* **Endpoint:** /api/v1/auth/register  
* **Response (201 Created):** {"message": "Mã OTP đã được gửi đến email của bạn."}

**7.2. API Xác thực OTP (POST)**

* **Endpoint:** /api/v1/auth/verify-otp  
* **Request:** {"email": "user@gmail.com", "otpCode": "849201", "purpose": "REGISTER"}  
* **Response (200 OK):** Trả về accessToken và refreshToken (Tương tự login thành công).

**7.3. API Thiết lập mật khẩu cho tài khoản Google (POST)**

* **Endpoint:** /api/v1/auth/set-password  
* **Headers:** Authorization: Bearer \<ACCESS\_TOKEN\>  
* **Request:** {"newPassword": "SecurePassword123"}  
* **Response (200 OK):** {"message": "Đã thiết lập mật khẩu thành công. Bạn có thể đăng nhập bằng email."}

**7.4. API Liên kết tài khoản Google (POST)**

* **Endpoint:** /api/v1/auth/link-google  
* **Headers:** Authorization: Bearer \<ACCESS\_TOKEN\>  
* **Request:** {"googleIdToken": "eyJhbGciOiJSU..."}  
* **Response (200 OK):** {"message": "Đã liên kết tài khoản Google thành công."}

# Quản Lý Các Thiết Kế

## DANH SÁCH API CHI TIẾT THEO PHÂN HỆ (MODULES)

*Lưu ý: Payload dưới đây chỉ hiển thị phần data lõi để tiết kiệm không gian.*

#### **PHÂN HỆ 1: PUBLIC & AUTHENTICATION (XÁC THỰC DANH TÍNH)**

*Phân hệ này không yêu cầu Token (đối với Public) hoặc xử lý cấp phát Token.*

* **1.1. Lấy thông tin bãi xe công khai:**  
  * **Method:** GET /api/v1/public/parking-lot/summary  
  * **Mô tả:** Trả về giờ hoạt động, bảng giá tóm tắt và số chỗ trống theo từng loại xe. Ẩn cấu trúc Tầng/Zone để bảo mật.  
* **1.2. Đăng ký & Nhận OTP:**  
  * **Method:** POST /api/v1/auth/register  
  * **Payload:** { "email": "...", "password": "...", "fullName": "..." }  
* **1.3. Xác thực OTP & Cấp Token:**  
  * **Method:** POST /api/v1/auth/verify-otp  
  * **Payload:** { "email": "...", "otpCode": "849201", "purpose": "REGISTER" }  
* **1.4. Thiết lập mật khẩu cho tài khoản Google:**  
  * **Method:** POST /api/v1/auth/set-password  
  * **Header:** Authorization: Bearer \<Token\>  
* **1.5. Liên kết tài khoản Google:**  
  * **Method:** POST /api/v1/auth/link-google

#### **PHÂN HỆ 2: CUSTOMER PORTAL (KHÁCH HÀNG)**

*Yêu cầu Header: Authorization: Bearer \<JWT\_TOKEN\>*

* **2.1. Tra cứu Lượt Vãng Lai đang đỗ:**  
  * **Method:** POST /api/v1/user/parking/lookup-walkin  
  * **Mô tả:** Khách nhập Biển số \+ Mã thẻ. Trả về chi tiết vị trí đỗ, thời gian và mảng các hóa đơn tạm tính (Phí cước \+ Phí phạt nếu có).  
* **2.2. Khởi tạo Đơn Đặt chỗ (Pre-Booking):**  
  * **Method:** POST /api/v1/user/bookings  
  * **Payload:** { "vehicleTypeId": 1, "plateNumber": "...", "startTime": "...", "endTime": "..." }  
* **2.3. Khách hàng Báo cáo Sự cố (Tạo Ticket):**  
  * **Method:** POST /api/v1/user/incidents  
  * **Payload:** { "sessionId": "...", "plateNumber": "...", "category": "SLOT\_OCCUPIED", "description": "...", "attachmentUrl": "..." }

#### **PHÂN HỆ 3: STAFF POS (VẬN HÀNH TRẠM KIỂM SOÁT)**

*Yêu cầu Role: ROLE\_STAFF*

* **3.1. Lấy danh sách Cổng & Lịch trình:**  
  * **Method:** GET /api/v1/gates/availability  
* **3.2. Mở Ca trực (Start Shift):**  
  * **Method:** POST /api/v1/work-sessions/start  
  * **Payload:** { "gateId": "GATE\_IN\_01", "selectedMode": "IN" }  
* **3.3. Tạo Lượt Gửi Xe (Check-in Vãng Lai):**  
  * **Method:** POST /api/v1/parking-sessions  
  * **Mô tả:** Xử lý cấp phát Slot trống, khóa thẻ RFID, và tạo Session.  
  * **Payload:** { "cardCode": "10025", "plateNumber": "51G-123.45", "vehicleType": "CAR", "gateInId": "...", "allocatedSlot": "..." }  
* **3.4. Xử lý Xe Ra & Thu Phí (Check-out):**  
  * **Method:** PUT /api/v1/parking-sessions/{sessionId}/checkout  
  * **Mô tả:** Chốt thời gian, tính tiền. Nếu nhân viên sửa biển số do AI đọc sai, truyền cờ isOutPlateCorrected: true.  
  * **Payload:** { "gateOutId": "...", "paymentMethod": "CASH", "plateOutReadByAI": "...", "plateOutCorrectedByStaff": "...", "isOutPlateCorrected": true }  
* **3.5. Xử lý Mất thẻ / Hỏng thẻ:**  
  * **Method:** POST /api/v1/parking-sessions/{sessionId}/resolve-card-issue  
  * **Payload:** { "issueType": "DAMAGED", "proofDocumentUrl": "...", "damagedCardPhotoUrl": "...", "penaltyFeeApplied": 50000 }  
* **3.6. Điều xe / Chuyển Slot vật lý (Bảo vệ tuần tra):**  
  * **Method:** POST /api/v1/parking-sessions/{sessionId}/relocate-slot  
  * **Mô tả:** Nếu dời sang Zone khác, Backend tự động gán cờ zone\_violation \= 1.  
* **3.7. Chốt Ca trực (Close Shift):**  
  * **Method:** POST /api/v1/work-sessions/{sessionId}/close  
  * **Payload:** { "declaredCashAmount": 440000, "varianceReason": "..." }

#### **PHÂN HỆ 4: MANAGER DASHBOARD (QUẢN TRỊ VIÊN)**

*Yêu cầu Role: ROLE\_MANAGER*

* **4.1. Báo cáo Xu hướng Lấp đầy (Zone Occupancy):**  
  * **Method:** GET /api/v1/reports/zone-occupancy  
  * **Mô tả:** Trả về mảng JSON chứa tỷ lệ lấp đầy theo giờ của các Zone.  
* **4.2. Báo cáo Lưu lượng Cao điểm (Hourly Traffic):**  
  * **Method:** GET /api/v1/reports/hourly-traffic  
  * **Mô tả:** Bóc tách lượt Vào/Ra theo Ô tô và Xe máy.  
* **4.3. Báo cáo Cơ cấu Tệp khách (Macro Ratios):**  
  * **Method:** GET /api/v1/reports/macro-ratios  
* **4.4. Tạm dừng tính phí (Xử lý khiếu nại):**  
  * **Method:** POST /api/v1/manager/parking-sessions/{sessionId}/pause  
  * **Mô tả:** Khóa mốc thời gian processingPausedAt.  
* **4.5. Xác nhận Giảm phí & Cấp lệnh Ra:**  
  * **Method:** POST /api/v1/manager/parking-sessions/{sessionId}/adjust  
  * **Payload:** { "finalPaidFee": 20000, "adjustmentReason": "..." }  
* **4.6. Ép Đóng/Mở cổng Khẩn cấp:**  
  * **Method:** POST /api/v1/manager/gates/{gateId}/live-override  
  * **Payload:** { "overrideMode": "CLOSED", "reason": "Ngập hầm" }  
* **4.7. Hủy ép cổng Khẩn cấp:**  
  * **Method:** DELETE /api/v1/manager/gates/{gateId}/live-override

#### **PHÂN HỆ 5: SYSTEM ADMIN & TÍCH HỢP NGOẠI VI**

*Yêu cầu Role: ROLE\_ADMIN hoặc Không yêu cầu (Webhook)*

* **5.1. Truy vấn Vết kiểm toán (Audit Logs):**  
  * **Method:** GET /api/v1/admin/audit-logs  
  * **Mô tả:** Lấy danh sách thao tác sửa giá, ép cổng, mở barie thủ công kèm JSON cũ/mới.  
* **5.2. Khởi tạo mã VietQR động:**  
  * **Method:** GET /api/v1/payments/generate-qr/{sessionId}  
  * **Mô tả:** Sinh mã QR thanh toán chuẩn EMVCo, kèm hạn sử dụng (expiresAt).  
* **5.3. Webhook nhận Thanh toán thành công (PayOS / VNPay):**  
  * **Method:** POST /api/v1/webhooks/payment-success  
  * **Mô tả:** Đối tác thanh toán gọi vào Server để báo tiền đã vào tài khoản công ty. Cần bảo mật HMAC/Checksum kỹ lưỡng.

#### **PHÂN HỆ 6: HARDWARE IOT MOCKING (CÔNG CỤ GIẢ LẬP)**

*Đây là các API nội bộ phục vụ việc test phần cứng.*

* **6.1. Tool bắn biển số Camera IN:**  
  * **Method:** POST /api/v1/iot/cameras/scan  
  * **Payload:** { "gateId": "GATE\_IN\_01", "plateNumber": "51G-123.45", "confidenceScore": 0.98 }  
* **6.2. Tool bắn trạng thái Cảm biến (Sensor) tại ô đỗ:**  
  * **Method:** POST /api/v1/iot/sensors/update  
  * **Payload:** { "sensorId": "SS-B1-A05", "status": "OCCUPIED" }  
* **6.3. API Bắn tín hiệu Đầu đọc thẻ RFID (RFID Reader Webhook)**   
  * **Method:** `POST /api/v1/iot/rfid/read`  
  * **Payload Request:** { "gateId": "GATE\_IN\_01", "rfidCode": "10025", "timestamp": "2026-06-17T10:04:12" }   
* **6.4. API Tín hiệu Cảm biến Vòng từ qua cổng (Loop Detector / Passing Sensor)**   
  * **Method:** POST /api/v1/iot/gates/passing-sensor   
  * **Payload Request:** {  
  *   "gateId": "GATE\_IN\_01",  "sensorType": "VEHICLE\_PASSED",  "timestamp": "2026-06-17T10:04:18" }

### **QUY TẮC CHUẨN HÓA TOÀN CỤC (GLOBAL API STANDARDS)**

Trước khi đi vào từng API, toàn bộ team phải cam kết tuân thủ 3 quy tắc "sống còn" sau:  
**1\. Base URL & Versioning:** Mọi API đều phải bắt đầu bằng /api/v1/.  
**2\. Standard Response Wrapper:** Frontend sẽ chỉ nhận một định dạng JSON duy nhất cho mọi request (Dù thành công hay thất bại) để dễ dàng viết Interceptor xử lý lỗi:  
JSON  
{  
  "status": "SUCCESS", // hoặc "ERROR"  
  "code": 200,         // HTTP Status Code (200, 201, 400, 401, 403, 404, 409, 500\)  
  "message": "Thao tác thành công",  
  "data": { ... },     // Payload dữ liệu (Object hoặc Array), null nếu lỗi  
  "timestamp": "2026-06-17T09:46:00"  
}

**3\. Phân trang (Pagination):** Bất kỳ API nào trả về danh sách (GET /...) đều bắt buộc dùng Query Parameters: ?page=0\&size=50\&sort=createdAt,desc.

## **Giao thức Thời gian thực (WebSocket Contract)**

### **PHẦN I: KIẾN TRÚC KẾT NỐI VÀ BẢO MẬT (CONNECTION ARCHITECTURE)**

**1\. Endpoint Kết nối gốc (Handshake Endpoint):**

* **URL:** wss://\[domain\]/ws-pbms  
* **Fallback:** Hỗ trợ SockJS fallback (https://.../ws-pbms/info) cho các trình duyệt hoặc mạng chặn WebSocket thuần.

**2\. Xác thực (Authentication):**  
Vì WebSocket không hỗ trợ truyền HTTP Header chuẩn khi Handshake, Token JWT bắt buộc phải được truyền vào **STOMP CONNECT Frame Header**.

JSON  
// STOMP CONNECT Frame  
CONNECT  
Authorization: Bearer eyJhbGciOiJIUzI1Ni...  
accept-version: 1.1,1.0  
heart-beat: 10000,10000

*Backend Spring Security sẽ chặn tại ChannelInterceptor. Nếu Token sai hoặc hết hạn, ngắt kết nối ngay lập tức.*

### **PHẦN II: QUY CHUẨN ĐÓNG GÓI PAYLOAD (STANDARD MESSAGE WRAPPER)**

Tương tự REST API, mọi tin nhắn bắn ra từ Server qua WebSocket đều phải tuân thủ một cấu trúc JSON đồng nhất để Frontend dễ viết một hàm Listener dùng chung (Global Event Listener).

JSON  
{  
  "eventId": "EVT\_882910293",      // ID duy nhất của sự kiện (Dùng để Frontend chống trùng lặp \- Idempotency)  
  "timestamp": "2026-06-17T10:05:22", // Thời gian server phát sự kiện  
  "eventType": "GATE\_SCANNED",     // Phân loại sự kiện để Frontend rẽ nhánh logic (Switch-case)  
  "priority": "HIGH",              // Mức độ ưu tiên: LOW, NORMAL, HIGH, CRITICAL  
  "data": { ... }                  // Payload chi tiết của từng sự kiện  
}

### **PHẦN III: MA TRẬN KÊNH ĐĂNG KÝ (TOPIC & QUEUE MATRIX)**

Hệ thống STOMP chia làm 2 loại kênh:

* /topic/...: **Broadcast (Phát thanh)** \- Dành cho nhiều người cùng nghe (Ví dụ: Dashboard Manager).  
* /user/queue/...: **Unicast (Gửi đích danh)** \- Dành cho 1 thiết bị cụ thể (Ví dụ: Bốt trực của đúng nhân viên A).

Dưới đây là 5 Nhóm Kênh (Channels) vận hành toàn bộ hệ thống:

#### **1\. NHÓM KÊNH VẬN HÀNH CỔNG (GATE OPERATIONS)**

*Dành cho màn hình Gate Console của Staff (UC-STF01, UC-STF03).*

* **1.1. Kênh hứng biển số từ AI Camera (Subscribe):**  
  * **Topic:** /user/queue/gates/{gateId}/scans (Ví dụ: /user/queue/gates/GATE\_IN\_01/scans)  
  * **Mô tả:** Khi IoT Tool quét biển số, Backend xử lý và bắn thẳng xuống màn hình của Staff đang ngồi tại GATE\_IN\_01.  
  * **Payload data:**  
    JSON  
    {  
      "plateNumber": "51G-123.45",  
      "vehicleType": "CAR",  
      "confidenceScore": 0.98,  
      "isBlacklisted": false,  
      "snapshotUrl": "https://storage.../cam\_in\_01\_abc.jpg"  
    }

* **1.2. Kênh Lệnh phần cứng (Subscribe \- Dành cho Tool IoT):**  
  * **Topic:** /topic/iot/gates/{gateId}/commands  
  * **Mô tả:** Khi Staff bấm "Xác nhận", Backend gửi lệnh xuống kênh này để Tool IoT/Barrier vật lý mở cổng.  
  * **Payload data:**  
    JSON  
    {  
      "command": "OPEN\_BARRIER", // hoặc CLOSE\_BARRIER  
      "triggerBy": "STAFF",  
      "delayMs": 0  
    }

#### **2\. NHÓM KÊNH GIÁM SÁT HẠ TẦNG (INFRASTRUCTURE & SLOTS)**

*Dành cho Màn hình Grid Map của Manager và Staff tuần tra.*

* **2.1. Kênh Cập nhật trạng thái Ô đỗ thời gian thực:**  
  * **Topic:** /topic/slots/status  
  * **Mô tả:** Bắn tín hiệu khi có xe đè lên cảm biến hoặc xe rời đi, giúp các ô vuông trên Grid Map đổi màu (Xanh/Đỏ) ngay lập tức.  
  * **Payload data:**  
    JSON  
    {  
      "slotId": "A05",  
      "zoneId": 2,  
      "status": "OCCUPIED" // EMPTY, BOOKED, MAINTENANCE  
    }

* **2.2. Kênh Ép/Đảo chiều Cổng khẩn cấp từ Manager:**  
  * **Topic:** /topic/gates/overrides  
  * **Mô tả:** Khi Manager ấn "Đóng cổng khẩn cấp", màn hình Staff phải tự chớp đỏ và refresh.  
  * **Payload data:**  
    JSON  
    {  
      "gateId": "GATE\_IN\_01",  
      "overrideMode": "CLOSED",  
      "message": "Cổng bị đóng do ngập nước."  
    }

#### **3\. NHÓM KÊNH BÁO CÁO & DASHBOARD (LIVE METRICS)**

*Dành cho màn hình Real-time Dashboard của Manager (UC-MNG06).*

* **3.1. Kênh Chỉ số Tổng quan (Live KPI Grid):**  
  * **Topic:** /topic/dashboard/kpi  
  * **Mô tả:** Server tự động tính toán trên RAM và bắn luồng này mỗi 3 giây/lần (hoặc chỉ bắn khi có thay đổi) để nhảy số hiển thị.  
  * **Payload data:**  
    JSON  
    {  
      "car": { "totalIn": 150, "totalOut": 45, "currentInside": 105, "availableSlots": 12 },  
      "motorbike": { "totalIn": 450, "totalOut": 200, "currentInside": 250, "availableSlots": 150 },  
      "dailyRevenueEst": 4500000  
    }

#### **4\. NHÓM KÊNH SỰ CỐ & CẢNH BÁO (INCIDENTS & ALERTS)**

*Dành cho Manager và Bàn Sự Cố (Exception Desk).*

* **4.1. Kênh Thông báo Sự cố mới:**  
  * **Topic:** /topic/incidents/alerts  
  * **Mô tả:** Khi khách hàng gửi Ticket (Mất thẻ, Chiếm Slot), một chuông báo "Bíp" sẽ kêu trên Web Admin.  
  * **Payload data:**  
    JSON  
    {  
      "ticketId": "TCK\_88192",  
      "category": "SLOT\_OCCUPIED",  
      "plateNumber": "51G-123.45",  
      "priority": "HIGH",  
      "message": "Khách báo ô P-12 bị chiếm."  
    }

#### **5\. NHÓM KÊNH KHÁCH HÀNG (CUSTOMER FACING)**

*Dành cho App/Web Mobile của Khách hàng.*

* **5.1. Kênh Theo dõi Phiên đỗ xe Cá nhân:**  
  * **Topic:** /user/{userId}/queue/session-tracking  
  * **Mô tả:** Đẩy thông báo Push trực tiếp đến điện thoại khách hàng (Ví dụ: Cảnh báo sắp hết giờ Booking, hoặc thông báo Manager vừa giảm giá hóa đơn).  
  * **Payload data:**  
    JSON  
    {  
      "sessionId": "SES\_88123",  
      "alertType": "FEE\_ADJUSTED",  
      "message": "Phí gửi xe của bạn đã được giảm còn 30.000đ. Vui lòng ra cổng trong 15 phút.",  
      "newFee": 30000  
    }

### **PHẦN IV: LUẬT VẬN HÀNH KỸ THUẬT BẮT BUỘC (ARCHITECTURAL GUARDRAILS)**

Để đảm bảo hệ thống không bị "ngập lụt" (Flooded) tin nhắn và chết Server, tôi yêu cầu team tuân thủ 4 luật thép sau khi code WebSocket:  
**1\. Luật Nhịp tim (Heartbeat & Keep-Alive):**  
Trình duyệt rất hay ngắt kết nối ngầm. Bắt buộc cấu hình STOMP Heartbeat 10000,10000 (Ping/Pong mỗi 10 giây). Nếu Frontend mất mạng (đi xuống hầm kín), khi có mạng lại, thư viện STOMP client (như stompjs) phải cấu hình **Tự động kết nối lại (Auto-Reconnect)** với độ trễ hàm mũ (1s, 2s, 4s, 8s...).  
**2\. Luật Tái đồng bộ (State Resynchronization):**  
WebSocket chỉ truyền *Sự kiện thay đổi (Delta)*. Khi Frontend bị rớt mạng 5 phút và kết nối lại, nó đã bỏ lỡ rất nhiều sự kiện.

* **Giải pháp:** Ngay sau khi hàm onConnect của WebSocket chạy thành công, Frontend **BẮT BUỘC** phải gọi một lệnh REST API GET để lấy lại trạng thái toàn cảnh mới nhất (Full State), sau đó mới tiếp tục lắng nghe các sự kiện Delta từ WebSocket.

**3\. Khử răng cưa sự kiện (Debounce / Throttle Events):**  
Ở kênh 2.1 (Cảm biến báo trạng thái), nếu có người đi bộ lướt ngang qua cảm biến, nó có thể bắn liên tục 10 sự kiện Trống/Có xe trong 1 giây.

* **Giải pháp Backend:** Dùng RxJava hoặc cơ chế Throttle của Spring Boot: Chỉ bắn tín hiệu WebSocket xuống Frontend nếu trạng thái Cảm biến giữ nguyên sự thay đổi trong **ít nhất 3 giây**.

**4\. Thiết kế phi trạng thái ở Backend (Stateless WebSocket):**  
Spring Boot Server có thể chạy trên nhiều Node (Load Balancer). Nếu User A nối vào Node 1, và Server Node 2 phát sự kiện, User A sẽ không nhận được.

* **Giải pháp Backend:** Bắt buộc cấu hình Spring Boot WebSocket chạy qua một **Message Broker ngoại vi (như RabbitMQ hoặc Redis Pub/Sub)** thay vì dùng Simple In-memory Broker mặc định. Đây là yêu cầu bắt buộc cho hệ thống Production.

## **Kiến trúc Backend**

### **PHẦN 1: CHỐT STACK CÔNG NGHỆ BACKEND (THE BACKEND TECH STACK)**

1. **Core Framework:** **Java 17/21 \+ Spring Boot 3.x** (Hiệu năng cực cao với Virtual Threads nếu dùng Java 21, hỗ trợ non-blocking tốt).  
2. **Database ORM:** **Spring Data JPA / Hibernate** (Quản lý giao dịch, khóa lạc quan).  
3. **In-Memory Cache & Message Broker:** **Redis**. (BẮT BUỘC). Dùng để lưu OTP, Cache cấu hình hệ thống, đếm Live KPI thời gian thực, và làm Pub/Sub Broker cho WebSocket để đồng bộ dữ liệu giữa các Node Server.  
4. **Security:** **Spring Security \+ JWT (JSON Web Token)**.  
5. **Object Mapper:** **MapStruct** (Tự động map Entity sang DTO với tốc độ compile-time, cấm dùng ModelMapper vì chậm).  
6. **Database Migration:** **Flyway** hoặc **Liquibase** (Quản lý version của 24 bảng Database, tránh việc dev tự chạy file .sql tay gây lệch DB).  
7. **Logging:** **SLF4J \+ Logback** (Ghi log ra file dạng Rolling).

### **PHẦN 2: PHÂN RÃ KIẾN TRÚC 5 LỚP (5-TIER ARCHITECTURE)**

Mọi request đi vào hệ thống (từ Web, App, hay thiết bị IoT) đều phải đi qua 5 màng lọc khắt khe này:

#### **LỚP 1: BẢO MẬT & ĐIỀU HƯỚNG CỬA NGÕ (SECURITY & GATEWAY TIER)**

* **JWT Authentication Filter:** Chặn mọi request. Giải mã Token, trích xuất userId và role. Nếu Token hết hạn $\\rightarrow$ Trả 401 Unauthorized.  
* **Rate Limiting Filter:** Áp dụng thuật toán *Token Bucket* (dùng Redis). Chặn đứng các hành vi spam API (Ví dụ: Chặn API /send-otp nếu gọi quá 3 lần/phút, chặn Tool IoT bắn tín hiệu quá 100 lần/giây để chống DDoS).  
* **RBAC Authorization:** Sử dụng @PreAuthorize("hasRole('MANAGER')") ngay trên đầu các Controller để bảo vệ endpoint.

#### **LỚP 2: GIAO TIẾP (PRESENTATION TIER)**

* **REST Controllers:** Nhận request, validate dữ liệu đầu vào bằng jakarta.validation (@NotNull, @Pattern). Tuyệt đối không chứa logic ở đây. Controller chỉ làm 3 việc: Nhận DTO $\\rightarrow$ Gọi Service $\\rightarrow$ Trả về ApiResponse\<T\>.  
* **STOMP WebSocket Controllers (@MessageMapping):** Xử lý các luồng kết nối Real-time.  
* **Global Exception Handler (@RestControllerAdvice):** "Lưới hứng rác". Tóm toàn bộ lỗi (từ EntityNotFound đến OptimisticLockingFailure) và format lại thành 1 cục JSON duy nhất trả cho Frontend, không bao giờ để lọt lỗi 500 kèm Stacktrace Java ra ngoài.

#### **LỚP 3: NGHIỆP VỤ LÕI (CORE BUSINESS TIER \- THE ENGINES)**

Đây là nơi chứa "chất xám" của dự án. Chúng ta chia làm 3 Engine chính:

* **Pricing Engine (Bộ máy Tính cước):** Áp dụng *Chain of Responsibility Pattern* (hoặc Strategy). Nhận đầu vào là mốc thời gian $\\rightarrow$ Trượt qua Lớp Miễn phí $\\rightarrow$ Cắt Ca Ngày/Đêm $\\rightarrow$ Trượt qua các Block $\\rightarrow$ Ra giá tiền. (Tuân thủ nguyên tắc Lazy Evaluation như đã thiết kế).  
* **Routing Engine (Bộ định tuyến Slot):** Chịu trách nhiệm quét Zone theo ưu tiên (Priority), đếm % lấp đầy, kích hoạt "Vòng lặp vét cạn 100%" nếu bãi đông, và chốt Slot theo Alphabet.  
* **State Machine (Cỗ máy Trạng thái):** Quản lý vòng đời khắt khe của ParkingSession (PENDING\_IN $\\rightarrow$ INSIDE $\\rightarrow$ PENDING\_OUT $\\rightarrow$ COMPLETED). Cấm nhảy cóc trạng thái.

#### **LỚP 4: SỰ KIỆN NỘI BỘ (EVENT-DRIVEN TIER)**

Để giữ kiến trúc Modular Monolith không bị dính chặt vào nhau (Decoupled), các Service không gọi nhau trực tiếp mà giao tiếp qua **Spring ApplicationEventPublisher**.

* *Ví dụ:* Khi xe quẹt thẻ ra cổng thành công (Operation Module), nó không gọi trực tiếp TransactionService để ghi sổ cái. Nó chỉ bắn ra sự kiện SessionCompletedEvent. Thằng TransactionService (Finance Module) tự động lắng nghe (Listener) sự kiện này và ghi xuống DB.  
* **Bất đồng bộ (@Async):** Các tác vụ nặng như Gửi Email, Ghi Audit Log, Gửi Webhook cho bên thứ 3 bắt buộc phải chạy @Async trên một ThreadPool riêng, không được làm chậm luồng đóng/mở Barie của khách.

#### **LỚP 5: TRUY XUẤT DỮ LIỆU & CACHE (DATA & CACHE TIER)**

* **Spring Data JPA:** Cho các thao tác CRUD cơ bản.  
* **Custom JPQL / Native Query:** Cho các truy vấn báo cáo nặng (Gom nhóm doanh thu, đếm xe).  
* **Connection Pool:** Sử dụng **HikariCP** tối ưu hóa kết nối xuống SQL Server.  
* **Redis Cache (@Cacheable):** Cache lại bảng system\_configs và pricing\_policies (vì giá tiền rất hiếm khi thay đổi nhưng lại được truy xuất hàng ngàn lần mỗi phút). Cứ 1 tiếng TTL (Time-to-Live) reset một lần.

### **PHẦN 3: GIẢI QUYẾT 3 "TỬ HUYỆT" KỸ THUẬT (TECHNICAL DEEP DIVE)**

Để code không bị "chết" trong thực tế, bạn phải yêu cầu team Backend xử lý triệt để 3 vấn đề sau:  
**1\. Bài toán Tranh chấp Tài nguyên (Concurrency / Race Conditions)**

* **Tình huống:** 2 cổng IN cùng bốc trúng 1 ô đỗ (A05) hoặc 1 mã thẻ (10025) ở cùng 1 mili-giây.  
* **Thiết kế giải pháp:**  
  * Sử dụng **Optimistic Locking (@Version)** trên Entity Slot và RfidCard.  
  * Bọc hàm cấp phát bằng annotation @Retryable của thư viện Spring Retry.  
  * *Luồng chạy:* Máy A và Máy B cùng lấy thẻ 10025 (Version \= 1). Máy A lưu trước, DB update Version \= 2\. Máy B lưu sau 1 mili-giây, DB thấy Version 1 không khớp Version 2 $\\rightarrow$ Bắn lỗi ObjectOptimisticLockingFailureException. Spring Retry bắt được lỗi này, tự động lùi lại 50ms, tự quét DB lấy thẻ khác (VD: 10026\) và lưu lại. **Tất cả diễn ra ngầm, giao diện Staff không hề bị báo lỗi.**

**2\. Bài toán Đếm xe thời gian thực (Live KPI Counting)**

* **Tình huống:** Frontend cứ 3 giây gọi API lấy số lượng xe trống 1 lần. Nếu mỗi lần gọi, Backend lại chạy câu lệnh SELECT COUNT(\*) quét qua hàng vạn dòng DB thì Server sẽ quá tải CPU.  
* **Thiết kế giải pháp:** Sử dụng **Redis Atomic Counters**.  
  * Khi Server khởi động, chạy SELECT COUNT 1 lần duy nhất để lấy số hiện tại (VD: Ô tô đang có 100 xe) đẩy lên Redis key pbms:kpi:car:inside.  
  * Mỗi khi có xe Check-in thành công, gọi lệnh redisTemplate.opsForValue().increment("pbms:kpi:car:inside") ($O(1)$ siêu nhanh).  
  * Mỗi khi Check-out, gọi lệnh decrement.  
  * API Dashboard của Manager chỉ cần đọc con số này từ Redis trả về, tốc độ dưới 5 mili-giây, hoàn toàn không chạm vào Database.

**3\. Bài toán Quét xe đỗ quá hạn 72h (Background Cron Jobs)**

* **Tình huống:** Quét hàng đêm để tìm xe trễ hạn. Nếu số lượng xe trong bãi quá lớn, việc lôi tất cả lên RAM để xử lý sẽ gây tràn RAM (OutOfMemoryError).  
* **Thiết kế giải pháp:**  
  * Sử dụng @Scheduled(cron \= "0 0 2 \* \* ?") (Chạy lúc 2h sáng).  
  * Sử dụng **Spring Batch** hoặc lệnh **Native SQL Update/Batch Update**. Tuyệt đối không dùng JPA lôi List Entity lên vòng lặp for.  
  * *Lệnh tối ưu:* UPDATE parking\_sessions SET is\_overstay \= true WHERE status \= 'INSIDE' AND check\_in\_time \<= :deadline; (Xử lý 10,000 xe chỉ mất 0.1 giây tại tầng SQL).

### **PHẦN 4: CẤU TRÚC THƯ MỤC BACKEND (PACKAGE STRUCTURE)**

Tuân thủ nghiêm ngặt nguyên tắc **Modular Monolith** (Chia theo tính năng, không chia theo kỹ thuật Controller/Service/Repository thông thường).

Plaintext  
src/main/java/com/pbms/  
├── PbmsApplication.java  
├── 📁 common                // Lõi dùng chung toàn dự án  
│   ├── config             // Cấu hình (Security, Swagger, Redis, WebSocket)  
│   ├── exception          // GlobalExceptionHandler, Custom Exceptions  
│   ├── security           // JwtUtils, JwtFilter, CustomUserDetails  
│   └── dto                // ApiResponse, PaginatedResponse  
│  
├── 📁 modules               // CHIA THEO PHÂN HỆ NGHIỆP VỤ LÕI  
│   ├── 📁 identity          // Auth, Users, Roles, OTP  
│   │   ├── api            // AuthController, UserController  
│   │   ├── domain         // User, OtpVerification (Entities)  
│   │   ├── dto              
│   │   └── service          
│   │  
│   ├── 📁 infrastructure    // Floor, Zone, Slot, Gate, Hardware Mock IoT  
│   │   ├── api            // SpaceController, GateController, IotWebhookController  
│   │   ├── domain         // Zone, Slot (có @Version)  
│   │   ├── repository     // Custom Query lấy chỗ trống  
│   │   └── service        // SlotAllocationService (@Retryable)  
│   │  
│   ├── 📁 operation         // Trái tim vận hành: CheckIn, CheckOut, Sessions  
│   │   ├── api              
│   │   ├── domain         // ParkingSession, RfidCard  
│   │   ├── event          // SessionCompletedEvent (Pub/Sub)  
│   │   └── service        // StateMachine, GateOperationService  
│   │  
│   ├── 📁 finance           // Kế toán, Tính tiền, Bảng giá, Giao dịch  
│   │   ├── engine         // Thuật toán Pricing 3 lớp  
│   │   ├── domain         // PricingPolicy, Transaction, FeeAdjustment  
│   │   └── service        // LedgerService, PaymentGatewayService  
│   │  
│   └── 📁 incident          // Xử lý sự cố, Audit Logs, Report Tickets  
│       ├── domain         // IncidentTicket, AuditLog  
│       ├── listener       // Lắng nghe sự kiện để lưu Audit Log (@Async)  
│       └── service        

#### **Phần 5: Package And File** 

### **1\. com.pbms.common (Lõi Hệ Thống & Tiện Ích)**

*Module này KHÔNG chứa nghiệp vụ DB, chỉ chứa các file config, security và exception dùng chung cho toàn dự án.*

8. **config/**  
   * SecurityConfig.java (Cấu hình phân quyền URL, CORS)  
   * SwaggerConfig.java (Cấu hình Open API / Swagger UI)  
   * AsyncConfig.java (Cấu hình ThreadPool cho tính năng Pub/Sub, hẹn giờ)  
   * RetryConfig.java (Kích hoạt @EnableRetry cho lỗi Khóa lạc quan)  
9. **security/**  
   * JwtTokenProvider.java (Tạo và giải mã JWT Token)  
   * JwtAuthFilter.java (Chặn request để check Token)  
   * UserDetailsImpl.java & UserDetailsServiceImpl.java (Load thông tin User)  
10. **exception/**  
    * GlobalExceptionHandler.java (@RestControllerAdvice bắt mọi lỗi)  
    * ApiResponse.java (Class chuẩn hóa format JSON trả về)  
    * BusinessRuleException.java (Custom lỗi nghiệp vụ 400\)  
    * ResourceNotFoundException.java (Custom lỗi 404\)  
    * ConcurrencyConflictException.java (Custom lỗi tranh chấp 409\)  
11. **utils/**  
    * SecurityUtils.java (Hàm tiện ích lấy ID của user đang đăng nhập)  
    * RegexValidator.java (Hàm test biển số xe)

### **2\.  com.pbms.system (Cấu hình Tòa nhà & Tham số \- 2 Bảng)**

*Module quản lý thông tin tĩnh và cài đặt động.*

* **entity/**: BuildingProfile.java, SystemConfig.java  
* **repository/**: BuildingProfileRepository.java, SystemConfigRepository.java  
* **dto/**: BuildingProfileDTO.java, SystemConfigDTO.java  
* **mapper/**: SystemMapper.java (Giao diện MapStruct)  
* **service/**: SystemService.java  
* **controller/**: SystemController.java (Chỉ Manager/Admin được gọi)

### **3\.  com.pbms.infrastructure (Không gian & Cổng IoT \- 5 Bảng)**

*Trái tim của hệ thống định tuyến, nơi đón nhận tín hiệu phần cứng.*

* **entity/**: Floor.java, Zone.java, Slot.java, RoutingRule.java, Gate.java  
* **repository/**:  
  * FloorRepository.java, ZoneRepository.java, GateRepository.java, RoutingRuleRepository.java  
  * SlotRepository.java *(Chứa hàm Custom Query @Lock(LockModeType.OPTIMISTIC) tìm chỗ trống)*  
* **dto/**: (Các class Request/Response DTO cho từng bảng)  
* **mapper/**: InfrastructureMapper.java  
* **event/**:  
  * SensorTriggeredEvent.java (Sự kiện khi tool bắn API báo có xe đỗ sai)  
* **service/**:  
  * FloorZoneService.java (CRUD tầng, khu vực)  
  * GateService.java (Đổi trạng thái cổng, ép luồng)  
  * SlotAllocationService.java *(Thuật toán tìm ô trống \+ @Retryable)*  
* **controller/**: SpaceController.java, GateController.java  
* **controller\_iot/**: IotWebhookController.java *(Chỉ 1 file duy nhất để đón API từ Tool phần cứng)*

### **4\. com.pbms.identity (Tài khoản & Ca trực \- 4 Bảng)**

*Quản lý bảo mật, đăng nhập và két tiền mặt của nhân viên.*

* **entity/**: User.java, RefreshToken.java, OtpVerification.java, WorkSession.java  
* **repository/**: UserRepository.java, TokenRepository.java, OtpRepository.java, WorkSessionRepository.java  
* **dto/**: LoginRequest.java, TokenResponse.java, WorkSessionStartReq.java, WorkSessionEndReq.java  
* **mapper/**: IdentityMapper.java  
* **service/**:  
  * AuthService.java (Login, Logout, Refresh Token, OTP)  
  * UserService.java (Quản lý CRUD nhân viên)  
  * WorkSessionService.java (Hàm mở ca, chốt ca, đếm tiền)  
* **controller/**: AuthController.java, UserController.java, WorkSessionController.java

### **5\. com.pbms.operation (Giao dịch Lõi & Phương tiện \- 5 Bảng)**

*Luồng Check-in, Check-out, Booking cực kỳ phức tạp.*

* **entity/**: VehicleType.java, BlacklistedVehicle.java, RfidCard.java, ParkingSession.java, BookingReservation.java  
* **repository/**: Tương ứng 5 Repository cho 5 bảng trên.  
* **dto/**: CheckInReq.java, CheckOutReq.java, BookingReq.java, v.v.  
* **mapper/**: OperationMapper.java  
* **service/**:  
  * VehicleCardService.java (CRUD Thẻ RFID, Loại xe, Blacklist)  
  * BookingService.java (Luồng khách đặt trước)  
  * CheckInService.java (Gọi Facade để tìm ô, quẹt thẻ)  
  * CheckOutService.java (Gọi Facade tính tiền, cập nhật trạng thái)  
  * GhostSessionRollbackService.java *(Chứa logic @Async chờ 30 giây xóa phiên ảo)*  
* **controller/**: CheckInController.java, CheckOutController.java, BookingController.java, VehicleCardController.java

### **6\. com.pbms.finance (Tính Tiền & Sổ Cái \- 5 Bảng)**

*Bộ máy tính tiền 4 lớp và quản lý Transaction (Append-only).*

* **api/** (Cửa khẩu cho module khác gọi vào):  
  * FinanceFacade.java (Interface)  
  * FinanceFacadeImpl.java (Implementation)  
* **entity/**: PricingPolicy.java, PricingShift.java, PricingBlock.java, Transaction.java, PaymentGatewayLog.java  
* **repository/**: Tương ứng 5 Repository.  
* **dto/**: PricingConfigDTO.java, TransactionDTO.java, v.v.  
* **mapper/**: FinanceMapper.java  
* **service/**:  
  * PricingConfigService.java (Logic CRUD có áp dụng XÓA MỀM)  
  * TransactionService.java (Ghi sổ cái kế toán)  
  * PaymentGatewayService.java (Tạo URL PayOS/VNPay, đón callback PayOS/VNPay)  
* **engine/** *(Thuật toán Chain of Responsibility tính tiền)*  
  * PricingEngine.java (Điều phối chạy các Step)  
  * step/GracePeriodStep.java (Lọc phút nền)  
  * step/ShiftSplitStep.java (Cắt ca ngày/đêm)  
  * step/BlockCalculateStep.java (Trượt Block tính tiền)  
* **controller/**: PricingController.java, TransactionController.java, PaymentWebhookController.java

### **7\. com.pbms.incident (Sự Cố & Nhật Ký \- 3 Bảng)**

*Chứa các file chạy ngầm (Listener) để lưu log và quản lý ticket.*

* **entity/**: IncidentTicket.java, FeeAdjustment.java, AuditLog.java  
* **repository/**: 3 Repository tương ứng.  
* **dto/**: TicketReq.java, FeeAdjustmentReq.java (Bắt buộc kèm ticket\_id)  
* **mapper/**: IncidentMapper.java  
* **event\_listener/**:  
  * SystemAuditListener.java *(Hàm @EventListener lắng nghe mọi hành động từ các module khác để ghi vào bảng AuditLog)*  
* **service/**:  
  * IncidentTicketService.java (Khách / Staff tạo báo cáo lỗi)  
  * FeeAdjustmentService.java (Manager duyệt giảm giá, móc với Ticket)  
* **controller/**: TicketController.java, AuditLogController.java  
* 

## **Kiến trúc Frontend (Frontend Architecture & State Management Blueprint)**

### **PHẦN 1: CHỐT STACK CÔNG NGHỆ BẮT BUỘC (THE TECH STACK)**

1. **Core Framework:** **React 18 \+ Vite** (Tốc độ build siêu nhanh, tối ưu cho SPA).  
2. **Server State (Dữ liệu tĩnh & REST API):** **TanStack Query (React Query v5)**. Xử lý toàn bộ logic gọi API, Cache dữ liệu, tự động thử lại (Retry) khi rớt mạng, và phân trang (Pagination) màn hình Báo cáo.  
3. **Client & Real-time State (Dữ liệu động & WebSocket):** **Zustand**. Quản lý trạng thái gọn nhẹ, lưu trữ dữ liệu từ WebSocket và đẩy thẳng vào Component mà không làm ảnh hưởng đến các Component lân cận.  
4. **Routing:** **React Router v6** (Hỗ trợ bọc quyền RBAC từng Route).  
5. **UI Library:** **Ant Design (antd)** hoặc **Tailwind CSS \+ Shadcn UI** (Tối ưu cho việc vẽ Dashboard và Bảng dữ liệu tốc độ cao).  
6. **WebSocket Client:** **@stomp/stompjs** (Chuẩn giao tiếp STOMP tương thích 100% với Spring Boot).

### **PHẦN 2: KIẾN TRÚC THƯ MỤC MODULE HÓA (FEATURE-BASED FOLDER STRUCTURE)**

Giống như Backend, Frontend cũng phải chia theo Feature (Tính năng), tuyệt đối cấm thiết kế theo kiểu kỹ thuật (gom tất cả components vào 1 folder, tất cả hooks vào 1 folder).

Plaintext  
src/  
├── 📁 assets/             \# Hình ảnh, icon, font  
├── 📁 core/               \# Lõi hệ thống (Không chứa nghiệp vụ)  
│   ├── api/               \# Cấu hình Axios instance, Interceptors (bắt lỗi 401, 403\)  
│   ├── auth/              \# Logic lưu JWT Token (Local Storage / Cookie)  
│   ├── router/            \# Cấu hình React Router, ProtectedRoutes  
│   └── websocket/         \# Khởi tạo STOMP Client duy nhất toàn cục  
│  
├── 📁 shared/             \# Dùng chung trên toàn dự án  
│   ├── components/        \# Button, Modal, Table, Bảng LED hiển thị  
│   ├── hooks/             \# useWindowSize, useDebounce  
│   └── utils/             \# Format tiền tệ (VND), Format ngày tháng  
│  
├── 📁 features/           \# CHIA THEO PHÂN HỆ NGHIỆP VỤ (Match với Backend)  
│   ├── 📁 public-home/    \# Portal 1: Customer Web  
│   ├── 📁 gate-console/   \# Portal 2: Staff POS (Trái tim của hệ thống)  
│   │   ├── api/           \# Khai báo các hàm gọi REST (Check-in, Check-out)  
│   │   ├── components/    \# SplitView, CameraFrame, BillingModal  
│   │   ├── hooks/         \# Dùng TanStack Query (e.g., useCheckoutMutation)  
│   │   └── store/         \# Zustand store cho màn hình Gate (e.g., useGateStore.ts)  
│   │  
│   ├── 📁 dashboard/      \# Portal 3: Manager Dashboard  
│   ├── 📁 space-map/      \# Bản đồ cấu hình Grid & Zone  
│   ├── 📁 pricing/        \# Cấu hình Bảng giá  
│   └── 📁 incident/       \# Bàn xử lý Sự cố (Helpdesk & Exception Desk)  
│  
└── App.tsx                \# Khởi tạo QueryClientProvider, RouterProvider

### **PHẦN 3: CHIẾN LƯỢC QUẢN LÝ TRẠNG THÁI (THE STATE MANAGEMENT PATTERNS)**

Đội Dev phải tuân thủ nghiêm ngặt ranh giới giữa 2 loại State:

#### **1\. Dữ liệu Server (REST API) $\\rightarrow$ Đẩy cho TanStack Query lo**

* **Nguyên tắc:** Bất cứ dữ liệu nào lấy qua lệnh GET (Ví dụ: Danh sách nhân viên, Lịch sử hóa đơn, Báo cáo doanh thu) đều **không được** lưu vào Redux hay Zustand.  
* **Cách làm:** Dùng TanStack Query. Nó sẽ tự động lưu Cache (bộ nhớ tạm). Nếu Manager chuyển qua tab khác rồi quay lại, dữ liệu sẽ hiện ra ngay lập tức từ Cache trong lúc nó gọi API ngầm để cập nhật mới.  
* *Mã mẫu (Báo cáo doanh thu):*  
  JavaScript  
  export const useHourlyTraffic \= (dateRange) \=\> {  
    return useQuery({  
      queryKey: \['hourly-traffic', dateRange\], // Khóa định danh Cache  
      queryFn: () \=\> axios.get(\`/api/v1/reports/hourly-traffic\`, { params: dateRange }),  
      staleTime: 5 \* 60 \* 1000, // Dữ liệu sống trong cache 5 phút  
    });  
  };

#### **2\. Dữ liệu Thời gian thực (WebSocket) $\\rightarrow$ Đẩy cho Zustand lo**

* **Nguyên tắc:** Dữ liệu bắn liên tục từ Server xuống (nhảy số KPI, Biển số xe quét được, Cảm biến ô đỗ) phải được nạp thẳng vào Zustand Store.  
* **Tại sao dùng Zustand?** Bởi vì bạn có thể ép React component *chỉ render lại khi một trường cụ thể thay đổi*. Nếu tổng số Ô tô thay đổi, Component đếm Xe máy sẽ **không** bị re-render.  
* *Kiến trúc Code mẫu cho Zustand (Trạm kiểm soát cổng):*  
  JavaScript  
  import { create } from 'zustand';

  // Tạo một Store độc lập không dính dáng đến React Context  
  export const useGateStore \= create((set) \=\> ({  
    scannedPlate: null,  
    barrierStatus: 'CLOSED',  
    pendingFee: 0,

    // Actions: Được gọi bởi WebSocket Listener  
    updateScannedPlate: (plate) \=\> set({ scannedPlate: plate }),  
    openBarrier: () \=\> set({ barrierStatus: 'OPEN' }),  
    closeBarrier: () \=\> set({ barrierStatus: 'CLOSED' }),  
    setPendingFee: (fee) \=\> set({ pendingFee: fee }),

    // Reset khi xe đi qua xong  
    resetGate: () \=\> set({ scannedPlate: null, barrierStatus: 'CLOSED', pendingFee: 0 })  
  }));

### **PHẦN 4: LUỒNG TÍCH HỢP WEBSOCKET & CHỐNG RE-RENDER (THE WEBSOCKET PIPELINE)**

Đây là cách để Frontend của bạn hứng 100 sự kiện/giây mà không bị sập.  
**Bước 1: Tách biệt Bộ lắng nghe (Listener) ra khỏi UI Component**  
Không bao giờ viết code stompClient.subscribe bên trong file giao diện .jsx. Hãy tạo một Hook tùy chỉnh (Custom Hook) chạy ngầm ở cấp cao nhất của Feature đó.

JavaScript  
// features/gate-console/hooks/useGateWebSocket.js  
export const useGateWebSocket \= (gateId) \=\> {  
  useEffect(() \=\> {  
    // 1\. Khởi tạo kết nối STOMP  
    const client \= new StompClient({ brokerURL: 'wss://.../ws-pbms' });  
      
    client.onConnect \= () \=\> {  
      // 2\. Lắng nghe kênh Camera IN  
      client.subscribe(\`/user/queue/gates/${gateId}/scans\`, (msg) \=\> {  
         const data \= JSON.parse(msg.body);  
         // 3\. Bơm dữ liệu thẳng vào Zustand Store (Bỏ qua React Lifecycle)  
         useGateStore.getState().updateScannedPlate(data.plateNumber);  
      });  
    };  
      
    client.activate();  
    return () \=\> client.deactivate(); // Dọn dẹp khi đổi ca  
  }, \[gateId\]);  
};

**Bước 2: Rút trích dữ liệu vi mô (Micro-subscriptions) tại Component**  
Component giao diện chỉ lấy đúng trường dữ liệu nó cần từ Zustand.

JavaScript  
// features/gate-console/components/PlateDisplay.jsx  
export const PlateDisplay \= () \=\> {  
  // TUYỆT ĐỐI CHỈ LẤY \`scannedPlate\`.   
  // Nếu \`barrierStatus\` đổi, component này KHÔNG bị re-render\!  
  const plateNumber \= useGateStore((state) \=\> state.scannedPlate); 

  return (  
    \<div className\="text-4xl text-green-500 font-bold"\>  
      {plateNumber || "ĐANG CHỜ XE..."}  
    \</div\>  
  );  
};

### **PHẦN 5: KIỂM SOÁT ĐỘ TRỄ VÀ CHỐNG RÁC DỮ LIỆU (DEBOUNCE & THROTTLE)**

Ở màn hình Dashboard của Manager (Live KPI), dữ liệu đếm xe có thể nhảy liên tục mỗi mili-giây nếu bãi xe đang ở giờ cao điểm. Việc Re-render số liên tục sẽ làm mắt người dùng bị "loạn" và tốn tài nguyên.  
**Giải pháp:** Áp dụng thuật toán **Throttle (Khóa van)** tại Frontend.  
Thay vì nhận 10 sự kiện và render 10 lần trong 1 giây, ta tích trữ nó lại và chỉ render 1 lần mỗi 2 giây.

JavaScript  
// utils/websocketHandler.js  
import throttle from 'lodash/throttle';

// Khóa van: Cứ 2000ms (2 giây) mới đẩy dữ liệu vào Zustand 1 lần  
const throttledKpiUpdate \= throttle((kpiData) \=\> {  
  useDashboardStore.getState().setKpiData(kpiData);  
}, 2000);

// Trong WebSocket Listener  
client.subscribe(\`/topic/dashboard/kpi\`, (msg) \=\> {  
   throttledKpiUpdate(JSON.parse(msg.body));  
});

### **PHẦN 6: PHÂN QUYỀN GIAO DIỆN (RBAC ROUTING)**

Kiến trúc bảo vệ Route cực kỳ quan trọng để Staff không thể gõ URL chuyển sang màn hình của Manager.  
Sử dụng mô hình **HOC (Higher-Order Component)** để bọc các Route:

JavaScript  
// core/router/ProtectedRoute.jsx  
import { Navigate, Outlet } from 'react-router-dom';  
import { useAuthStore } from '../auth/authStore';

export const ProtectedRoute \= ({ allowedRoles }) \=\> {  
  const { user, isAuthenticated } \= useAuthStore();

  if (\!isAuthenticated) {  
    return \<Navigate to\="/login" replace /\>;  
  }

  // So sánh mảng quyền  
  if (\!allowedRoles.includes(user.role)) {  
    return \<Navigate to\="/unauthorized" replace /\>; // Màn hình 403  
  }

  return \<Outlet /\>; // Cho phép truy cập  
};

// Khai báo trong AppRouter  
\<Route element\={\<ProtectedRoute allowedRoles\={\['ROLE\_MANAGER', 'ROLE\_ADMIN'\]} /\>}\>  
   \<Route path\="/manager/pricing" element\={\<PricingConfigScreen /\>} /\>  
\</Route\>

## 

## CẤU TRÚC DATABASE TỐI ƯU (24 BẢNG)

**Nhóm 1: Hệ thống & Phân quyền (3 Bảng \- Admin IT quản lý)**

1. system\_configs: Cấu hình tham số động.  
2. users: Tài khoản nội bộ và khách hàng.  
3. otp\_verifications: Mã OTP 6 số.

**Nhóm 2: Không gian & Cổng kiểm soát (5 Bảng)**  
4\. building\_profiles: Thông tin tĩnh tòa nhà.  
5\. floors: Tầng hầm.  
6\. zones: Khu vực đỗ xe.  
7\. slots: Cấu trúc ô đỗ (Khóa lạc quan @Version).  
8\. gates: Cổng kiểm soát (Quản lý luôn trạng thái ép luồng thủ công live\_override\_mode).  
**Nhóm 3: Vận hành & Phương tiện (5 Bảng)**  
9\. routing\_rules: Luật điều hướng % lấp đầy.  
10\. vehicle\_types: Danh mục loại xe và kích thước lưới.  
11\. blacklisted\_vehicles: Danh sách đen.  
12\. rfid\_cards: Kho thẻ vật lý.  
13\. staff\_work\_sessions: Phiên làm việc (Khóa trách nhiệm tiền mặt).  
**Nhóm 4: Giao dịch lõi (2 Bảng)**  
14\. parking\_sessions: Phiên đỗ xe thực tế.  
15\. reservations: Đơn đặt chỗ trước online.  
**Nhóm 5: Bộ máy Tài chính (5 Bảng)**  
16\. pricing\_policies: Cấu hình giá gốc.  
17\. pricing\_shifts: Cấu hình cắt ca Ngày/Đêm.  
18\. pricing\_blocks: Khối giá trượt đa phân mảnh.  
19\. transactions: Sổ cái dòng tiền (Append-only).  
20\. fee\_adjustments: Vết kiểm toán điều chỉnh giá.  
**Nhóm 6: Sự cố & Giám sát (4 Bảng)**  
21\. incident\_tickets: Hỗ trợ khách hàng và lỗi vận hành (Lưu URL ảnh dưới dạng mảng JSON).  
22\. audit\_logs: Nhật ký kiểm toán thao tác hệ thống.  
23\. webhook\_logs: Nhật ký API thanh toán.  
24\. zone\_hourly\_trends: Dữ liệu lấp đầy nén theo giờ (Phục vụ biểu đồ).

## KIẾN TRÚC GIAO DIỆN (18 MÀN HÌNH)

**PORTAL 1: Customer Web App (Mobile-first \- 5 Màn hình)**

1. **Trang chủ:** Số chỗ trống real-time, biểu phí.  
2. **Xác thực:** Nhập SĐT/Email & OTP.  
3. **Pre-Booking:** Đặt chỗ, thanh toán trả trước.  
4. **My Parking:** Vé QR, hóa đơn live, QR Code thanh toán cổng.  
5. **Helpdesk:** Gửi Ticket sự cố.

**PORTAL 2: Staff POS (Web Desktop/Tablet \- 3 Màn hình)**  
6\. **Mở / Chốt Ca:** Chọn cổng, đối soát két tiền mặt.  
7\. **Gate Console:** Màn hình thu ngân tại cổng (Check-in/Check-out siêu tốc).  
8\. **Bàn Sự cố:** Xử lý ngoại lệ, chụp CCCD, gán phạt.  
**PORTAL 3: Manager Dashboard (Web Desktop \- 5 Màn hình)**  
9\. **Real-time Dashboard:** Biểu đồ doanh thu, KPI lưu lượng, cảnh báo an ninh.  
10\. **Bản đồ Cấu hình (Space & Routing):** Kéo thả Zone, sinh Slot, điều hướng % trượt. *(Tích hợp luôn các nút bấm đóng/mở/đảo chiều khẩn cấp cho Cổng tại đây).*  
11\. **Pricing Engine:** Cấu hình biểu giá trượt.  
12\. **Sổ cái & Định danh:** Quản lý dòng tiền, kho thẻ RFID, biển số Blacklist.  
13\. **Ticket Center:** Xử lý khiếu nại, duyệt giảm giá.  
**PORTAL 4: System Admin Portal (Web Desktop \- 3 Màn hình)**  
14\. **Quản lý Tài khoản (IAM):** Tạo User, phân Role Manager/Staff.  
15\. **System Configs:** Khai báo API Key (PayOS, SMTP).  
16\. **Audit Logs:** Diff Viewer truy vết thao tác.  
**PORTAL 5: Hardware Mocking Tool (2 Màn hình)**  
17\. **Cổng IN/OUT:** Bắn API biển số.  
18\. **Cảm biến Ô đỗ:** Click chọn Trống/Có xe.

## **Giao diện Chi tiết (Detailed UI/UX Specifications)** 

#### **PORTAL 1: CUSTOMER WEB APP (MOBILE-FIRST)**

**Nguyên tắc chung:** Giao diện tối ưu cho màn hình dọc (Mobile). Bố cục chuẩn ứng dụng (max-w-md mx-auto h-screen), thanh điều hướng Bottom Navigation. Sử dụng Tailwind CSS kết hợp thư viện Ant Design Mobile.

### **Màn hình 1: Trang chủ (Public Dashboard \- UC-USR01)**

* **1\. Bố cục Layout & UI Components:**

  * **Hero Section:** Tên bãi xe, giờ hoạt động (24/7) và nhãn "Đang hoạt động" màu xanh.  
  * **KPI Cards (Grid 2 cột):** 3 Thẻ trạng thái hiển thị sức chứa của Ô tô, Xe máy, Xe đạp điện.  
  * **Accordion/Collapse:** Biểu phí chi tiết (Ca ngày, Ca đêm, Giá trần) và Nội quy bãi xe.  
* **2\. Tích hợp Dữ liệu (Data Binding):**

  * **REST API:** GET /api/v1/public/parking-lot/summary (Dùng *TanStack Query* với staleTime: 5 mins để cache cấu hình giá).  
  * **WebSocket:** Subscribe kênh /topic/dashboard/kpi (Lưu vào *Zustand Store* để cập nhật số lượng chỗ trống real-time nhảy số không cần F5).  
* **3\. Trải nghiệm người dùng & Luồng thao tác (User Flow & Interactions):**

  * Khách hàng truy cập link hoặc quét QR trước cổng hầm.  
  * Cuộn trang để xem số chỗ trống hiện tại của loại xe mình đang lái.  
* **4\. Xử lý ngoại lệ & Trạng thái UI (Edge Cases & UI States):**

  * **Loading State:** Hiển thị Skeleton Cards (khung xám nhấp nháy) ở khu vực số lượng xe, không chặn render Header.  
  * **Empty/Full State:** Nếu availableSlots \<= 5, thẻ (Card) của loại xe đó chuyển viền Cam. Nếu \= 0, thẻ chuyển nền Đỏ rực, chữ "SẮP ĐẦY" đổi thành "ĐÃ ĐẦY \- HẾT CHỖ".

### **Màn hình 2: Xác thực & Đăng nhập (Omnichannel Identity \- UC-SYS01)**

* **1\. Bố cục Layout & UI Components:**

  * **Header:** Logo bãi xe.  
  * **Main Content:** Form nhập Email/SĐT. Nút "Đăng nhập bằng Google" (OAuth2) nổi bật.  
  * **Bottom Sheet (Modal bật từ dưới lên):** Component OTP Input (6 ô input tự động focus).  
* **2\. Tích hợp Dữ liệu (Data Binding):**

  * **REST API:** POST /api/v1/auth/register (Gọi OTP) và POST /api/v1/auth/verify-otp (Xác thực).  
* **3\. Trải nghiệm người dùng & Luồng thao tác (User Flow & Interactions):**

  * Nhập Email \-\> Bấm "Nhận mã OTP" \-\> Bottom Sheet bật lên.  
  * Nhập đủ 6 số, hệ thống *tự động Submit* (không cần bấm nút Xác nhận).  
* **4\. Xử lý ngoại lệ & Trạng thái UI (Edge Cases & UI States):**

  * **Loading State:** Nút "Nhận mã" chuyển thành Spinner, khóa Input Email.  
  * **Error State:** Nếu HTTP 429 (Spam), khóa nút "Gửi lại OTP" và hiện đồng hồ đếm ngược 60s. Nhập sai OTP hiện Toast đỏ rung lắc (Shake animation) ở 6 ô input. Nhập sai 5 lần, tự động đóng Bottom Sheet và báo hủy mã.

### **Màn hình 3: Pre-Booking (Đặt chỗ trước)**

* **1\. Bố cục Layout & UI Components:**

  * **Stepper (Thanh tiến trình 3 bước):** Chọn Xe \-\> Thời gian & Vị trí \-\> Thanh toán.  
  * **Dynamic Form:** Nhập Biển số, Dropdown Loại xe.  
  * **Sticky Bottom Bar:** Tổng tiền tạm tính và nút "Thanh toán ngay" cố định ở đáy màn hình.  
* **2\. Tích hợp Dữ liệu (Data Binding):**

  * **REST API:** POST /api/v1/user/bookings (Dùng *TanStack Query Mutation*). Backend trả về Payment\_URL (PayOS/VNPay).  
* **3\. Trải nghiệm người dùng & Luồng thao tác (User Flow & Interactions):**

  * Chọn thông tin \-\> Bấm Thanh toán \-\> Chuyển hướng (Redirect) sang App Ngân hàng (PayOS) hoặc VNPay.  
  * Sau khi thanh toán, hệ thống tự Redirect về màn hình "My Parking".  
* **4\. Xử lý ngoại lệ & Trạng thái UI (Edge Cases & UI States):**

  * **Error State (409 Conflict):** Nếu có người khác booking trùng Slot ảo cùng mili-giây, chặn giao dịch, bật Modal đỏ: *"Rất tiếc\! Vị trí này vừa có người đặt. Vui lòng chọn thời gian/vị trí khác"*.

### **Màn hình 4: My Parking (Theo dõi lượt đỗ \- UC-USR05)**

* **1\. Bố cục Layout & UI Components:**

  * **Tab View:** Tab "Xe Đặt Trước" và Tab "Xe Vãng Lai".  
  * **Live Session Card:** Khối thông tin bo góc chứa: Trạng thái (Xanh/Đỏ), Tầng/Zone/Slot (font chữ siêu to), Đồng hồ (Live Timer).  
  * **Dynamic Billing Widget:** Bảng phân rã chi phí (Phí cơ sở, Lố giờ, Vi phạm).  
  * **QR Code Section:** Sinh mã QR định danh (Nếu là xe Booking).  
* **2\. Tích hợp Dữ liệu (Data Binding):**

  * **REST API:** POST /api/v1/user/parking/lookup-walkin (Tra cứu thủ công biển số \+ thẻ).  
  * **WebSocket:** Subscribe /user/{userId}/queue/session-tracking lưu vào *Zustand* để hứng lệnh báo lố giờ hoặc thông báo giảm giá từ Manager.  
* **3\. Trải nghiệm người dùng & Luồng thao tác (User Flow & Interactions):**

  * Xe Đặt trước: Vào là thấy ngay do API Auto-fetch qua JWT.  
  * Xe Vãng lai: Nhập Biển số \+ Mã thẻ vật lý \-\> Thẻ Session hiện ra.  
  * Đồng hồ phút tự động nhảy ở Client-side (Frontend tự tính setInterval dựa trên checkInTime để giảm tải Server).  
* **4\. Xử lý ngoại lệ & Trạng thái UI (Edge Cases & UI States):**

  * **Empty State:** Hình minh họa xe trống kèm text "Bạn chưa có lượt đỗ xe nào đang hoạt động".  
  * **Error State (Multi-Violation):** Nếu mảng Penalty \> 0, tự động trượt xuống 1 Banner đỏ trên cùng: *"Lưu ý: Phương tiện đang vi phạm quy định. Vui lòng kiểm tra hóa đơn."*. Sai mã thẻ hiện text lỗi dưới ô Input.

### **Màn hình 5: Helpdesk (Báo cáo sự cố \- UC-USR07)**

* **1\. Bố cục Layout & UI Components:**

  * **Dropdown:** Loại sự cố (Mất thẻ, Slot chiếm, Sai phí...).  
  * **Conditional Form (Render có điều kiện):** Tự động điền Biển số.  
  * **Camera Capture Component:** Module gọi API HTML5 Camera thiết bị.  
  * **Text Area:** Mô tả chi tiết (Giới hạn 500 ký tự kèm counter).  
* **2\. Tích hợp Dữ liệu (Data Binding):**

  * **REST API:** POST /api/v1/user/incidents.  
* **3\. Trải nghiệm người dùng & Luồng thao tác (User Flow & Interactions):**

  * Chọn "Slot bị chiếm" \-\> Khung Camera tự động mở ra yêu cầu chụp ảnh \-\> Bấm nút Gửi.  
  * Chuyển sang màn hình Ticket Tracking (Trạng thái: Đang chờ).  
* **4\. Xử lý ngoại lệ & Trạng thái UI (Edge Cases & UI States):**

  * **Validation Error:** Nếu chọn "Slot bị chiếm" mà chưa chụp ảnh, Component Camera bôi viền đỏ nhấp nháy, nút Submit bị disabled.  
  * **Rate Limit (Spam):** Nếu gọi API trả 429, nút Gửi bị mờ đi, hiện text: *"Vui lòng đợi 15 phút trước khi gửi yêu cầu tiếp theo"*.

#### **PORTAL 2: STAFF POS (DESKTOP/TABLET \- GIAO DIỆN VẬN HÀNH)**

**Nguyên tắc chung:** Tốc độ là sinh tử. Màn hình Full-width (100vw/100vh), hỗ trợ Dark Mode (ca đêm giảm chói). Áp dụng triệt để Keyboard Shortcuts (Phím tắt) để nhân viên không cần dùng chuột.

### **Màn hình 6: Mở / Chốt Ca (Shift Management \- UC-STF01)**

* **1\. Bố cục Layout & UI Components:**

  * **Main Screen (Mở ca):** Grid hiển thị các Cổng (Gates) dưới dạng Khối màu (Block). Nút Toggle Switch IN/OUT to rõ.  
  * **Modal Overlay (Chốt ca):** Bảng đối soát tài chính với ô Input siêu lớn để gõ tiền mặt.  
* **2\. Tích hợp Dữ liệu (Data Binding):**

  * **REST API:** GET /api/v1/gates/availability (Polling mỗi 10s khi ở màn hình này), POST /api/v1/work-sessions/start, POST /api/v1/work-sessions/{sessionId}/close.  
* **3\. Trải nghiệm người dùng & Luồng thao tác (User Flow & Interactions):**

  * Click vào Cổng màu Xanh lá (IDLE) \-\> Gạt Toggle \-\> Bấm "Bắt đầu ca trực".  
  * Khi bấm kết thúc ca \-\> Modal bật lên \-\> Nhập số tiền vật lý \-\> So khớp \-\> Bấm "Chốt ca".  
* **4\. Xử lý ngoại lệ & Trạng thái UI (Edge Cases & UI States):**

  * **Race Condition:** Nếu 2 máy cùng chọn 1 cổng (HTTP 409), Component rung lắc, hiện Toast đỏ *"Cổng vừa bị chiếm bởi nhân viên khác"*.  
  * **Error State:** Tại Modal Chốt ca, nếu declaredCashAmount \< systemTotalCash (lệch âm) mà ô TextBox "Giải trình" trống, nút Chốt Ca bị disabled và viền đỏ ô TextBox.

### **Màn hình 7: Gate Console (Trái tim kiểm soát cổng \- UC-STF01 & 03\)**

* **1\. Bố cục Layout & UI Components:**

  * **Split View (60/40):**

    * **Bên trái (Hardware Stream):** Khung ảnh Camera IN/OUT thời gian thực. Ô Text hiển thị Biển số xe do AI đọc (Font size cực lớn).  
    * **Bên phải (Nghiệp vụ):** Thông tin Session, Đồng hồ đỗ xe, Bảng tính tiền (nếu là cổng OUT), Khối mã QR động.  
  * **Big Action Buttons:** Các nút bấm khổng lồ nằm ở đáy màn hình (Mở cổng, Hủy, Báo sự cố).  
* **2\. Tích hợp Dữ liệu (Data Binding):**

  * **REST API:** POST /api/v1/parking-sessions (Check-in), PUT /api/v1/parking-sessions/{sessionId}/checkout.  
  * **WebSocket:** subscribe /user/queue/gates/{gateId}/scans (Nhận biển số) lưu thẳng vào *Zustand* để trigger re-render chỉ khung hiển thị biển số, không load lại toàn trang. Kênh /topic/gates/overrides để nhận lệnh đảo chiều khẩn cấp từ Admin.  
* **3\. Trải nghiệm người dùng & Luồng thao tác (User Flow & Interactions):**

  * **Zero-Mouse Flow (Luồng không chuột):**  
    * Xe vào đè vạch \-\> WS bắn biển số lên UI \-\> Staff nhìn ảnh đối chiếu.  
    * Nhấn **\[Spacebar\]**: Xác nhận đúng biển số, mở Barrier.  
    * Nhấn **\[F2\]**: Kích hoạt con trỏ vào ô Biển số để sửa tay (LPR Correction).  
    * Nhấn **\[ESC\]**: Hủy luồng, xóa trắng giao diện.  
* **4\. Xử lý ngoại lệ & Trạng thái UI (Edge Cases & UI States):**

  * **Blacklist State:** Khi WS đẩy data có cờ isBlacklisted: true, màn hình lập tức đổi Background sang ĐỎ NHẤP NHÁY, khóa liệt phím Spacebar và nút Mở cổng.  
  * **Override State:** Nếu Manager nhấn lệnh Đảo cổng, hiện Pop-up đếm ngược 5 giây ở góc phải, hết 5s tự động gọi API close ca hiện tại và start lại luồng mới.

### **Màn hình 8: Bàn Sự cố (Exception Desk \- UC-STF04)**

* **1\. Bố cục Layout & UI Components:**

  * **Sidebar (Left):** Danh sách hàng đợi (Queue) các xe bị lỗi thẻ, kẹt tại cổng.  
  * **Main Content:** Cơ chế đối soát 4 chiều (Grid 2x2): Ảnh Vào \- Text Vào vs Ảnh Ra \- Text Ra.  
  * **Webcam Module:** Component kích hoạt Camera tích hợp trên máy POS/Tablet để chụp giấy tờ.  
* **2\. Tích hợp Dữ liệu (Data Binding):**

  * **REST API:** POST /api/v1/parking-sessions/{sessionId}/resolve-card-issue (Gửi kèm URL ảnh tải lên MinIO/S3).  
* **3\. Trải nghiệm người dùng & Luồng thao tác (User Flow & Interactions):**

  * Gõ biển số xe mất thẻ \-\> Màn hình load 2 ảnh lúc Check-in.  
  * Bấm "Mở Camera" \-\> Chụp Cà vẹt/CCCD \-\> Chờ Upload lấy URL.  
  * Hệ thống tự chèn phí 50.000 VNĐ vào hóa đơn \-\> Bấm "Xác nhận & Mở cổng".  
* **4\. Xử lý ngoại lệ & Trạng thái UI (Edge Cases & UI States):**

  * **Hardware Error State:** Nếu Browser chặn quyền Webcam (Permission Denied), Component tự động Fallback (chuyển đổi) sang nút "Upload File" thủ công.  
  * **Validation State:** Nút "Lập hóa đơn phạt" bị mờ (Disabled opacity 0.5) cho đến khi biến state proofDocumentUrl trong Zustand có giá trị thực.

## 

## **PORTAL 3: MANAGER DASHBOARD (WEB DESKTOP)**

**Nguyên tắc chung:** Không gian làm việc của Quản lý cần hiển thị mật độ dữ liệu cao (High Data Density). Sử dụng Bố cục Admin chuẩn: Sidebar trái (Collapse được), Header chứa Global Search & Notifications, Main Content hiển thị Card và Data Table phân trang.

### **Màn hình 9: Real-time Dashboard (Báo cáo & Giám sát \- UC-MNG06)**

* **1\. Bố cục Layout & UI Components:**

  * **Sticky Filter Bar (Top):** Component DateRangePicker điều khiển toàn cục.  
  * **Live KPI Grid:** 3 khối (Ô tô, Xe máy, Tổng lưu lượng). Sử dụng Component *Donut Gauge* (Biểu đồ vòng tròn) đổi màu cảnh báo.  
  * **Hero Chart (70%):** Component Multi-line Chart (Recharts) hiển thị Xu hướng lấp đầy và Lưu lượng vào/ra.  
  * **Sidebar Chart (30%):** 3 Pie Chart xếp dọc (Phương thức thanh toán, Nguồn thu, Loại xe).  
* **2\. Tích hợp Dữ liệu (Data Binding):**

  * **WebSocket (Zustand):** Subscribe /topic/dashboard/kpi cập nhật các thẻ KPI trên cùng mỗi 3 giây (Dùng hàm throttle để chống giật UI).  
  * **REST API (TanStack Query):** GET /api/v1/reports/zone-occupancy, GET /api/v1/reports/hourly-traffic, GET /api/v1/reports/macro-ratios. Re-fetch khi thay đổi DateRange.  
* **3\. Trải nghiệm người dùng & Luồng thao tác (User Flow & Interactions):**

  * Manager chọn khoảng ngày \-\> Nút "Áp dụng" sáng lên \-\> Click \-\> Các biểu đồ bên dưới đồng loạt vẽ lại hiệu ứng transition mượt mà.  
  * Hover vào các điểm trên Multi-line Chart để xem Tooltip hiển thị số liệu chi tiết của từng giờ.  
* **4\. Xử lý ngoại lệ & Trạng thái UI (Edge Cases & UI States):**

  * **Loading State:** Render Skeleton với hình khối tương đương biểu đồ thật. Bật cờ keepPreviousData: true trong TanStack Query để biểu đồ cũ không bị chớp trắng khi đang tải dữ liệu mới.  
  * **Empty State:** Nếu không có giao dịch trong ngày được chọn, thay thế Chart bằng hình ảnh minh họa "Không có dữ liệu báo cáo".

### **Màn hình 10: Bản đồ Cấu hình & Điều hướng (Space & Routing \- UC-MNG03, 07, 09\)**

* **1\. Bố cục Layout & UI Components:**

  * **Left Canvas (70%):** Lưới ma trận 2D mô phỏng mặt bằng. Render các khối Ghost Zone và Solid Zone.  
  * **Right Inspector Panel (30%):**  
    * Tab 1: Form thông số Zone (Tên, Loại xe, Số lượng Slot).  
    * Tab 2: Thanh trượt (Slider) cấu hình % Lấp đầy mục tiêu cho Routing.  
    * Tab 3: Các nút bấm Action ép luồng Cổng (FORCE\_IN, FORCE\_OUT, CLOSED).  
* **2\. Tích hợp Dữ liệu (Data Binding):**

  * **REST API (TanStack Query Mutation):** POST /api/v1/manager/gates/{gateId}/live-override (Ép cổng). Khi lưu bản vẽ gọi API lưu tọa độ.  
  * **WebSocket (Zustand):** Subscribe /topic/slots/status để các ô trên Canvas đổi màu (Xanh/Đỏ) theo real-time mà không cần F5.  
* **3\. Trải nghiệm người dùng & Luồng thao tác (User Flow & Interactions):**

  * **Kéo thả:** Chọn Zone \-\> Kéo thả khối bóng ma (Ghost Zone) trên lưới \-\> Nhấn phím R để xoay ngang/dọc \-\> Click để thả.  
  * **Sửa số Slot:** Click vào Zone có sẵn \-\> Sửa số trên Panel \-\> Zone tự mọc thêm/cắt bớt đuôi (LIFO).  
* **4\. Xử lý ngoại lệ & Trạng thái UI (Edge Cases & UI States):**

  * **Validation State:** Nếu kéo Ghost Zone đè lên vật cản, khối bóng ma nháy viền Đỏ và không cho phép Drop.  
  * **Error State:** Nếu cố tình thu hẹp Slot đang có xe (OCCUPIED), API trả 400 \-\> Bật Modal lỗi đỏ: *"Không thể cắt giảm không gian do Slot cuối đang có xe đỗ"*.

### **Màn hình 11: Pricing Engine (Cấu hình Bảng giá \- UC-MNG05)**

* **1\. Bố cục Layout & UI Components:**

  * **Top Bar:** Cấu hình Global Base (Phút cơ bản, Tiền cơ bản, Giá trần).  
  * **Timeline View (Main):** Component thanh trượt mô phỏng dòng thời gian 24h giống giao diện edit video.  
  * **Block Splitter:** Các Input động (Dynamic Inputs) cho phép thêm/bớt phân mảnh (Blocks).  
* **2\. Tích hợp Dữ liệu (Data Binding):**

  * **REST API:** Load data từ API Pricing, sử dụng Form Library (React Hook Form) để bắt Validate.  
* **3\. Trải nghiệm người dùng & Luồng thao tác (User Flow & Interactions):**

  * Tạo Ca (VD: 06:00-18:00) \-\> 1 Block dài 12 tiếng hiện ra.  
  * Bấm "Chặt Block" \-\> Nhập 120 phút \-\> Thanh thời gian tự động chẻ làm 2 khối tỷ lệ thuận với số phút. Click vào từng khối để gán giá tiền.  
* **4\. Xử lý ngoại lệ & Trạng thái UI (Edge Cases & UI States):**

  * **Validation Error:** Tổng số phút của các Blocks bên trong phải BẰNG ĐÚNG tổng thời lượng Ca. Nếu lệch, thanh Timeline sẽ đổi viền Đỏ, hiện Text cảnh báo tổng phút chênh lệch, và nút "Lưu" bị Disabled hoàn toàn.

### **Màn hình 12: Sổ cái & Định danh (Ledger & Identities \- UC-MNG10)**

* **1\. Bố cục Layout & UI Components:**

  * **Tabs Navigation:** Chuyển đổi giữa \[Giao dịch tài chính\], \[Kho thẻ RFID\], \[Danh sách đen\].  
  * **Data Table:** Bảng dữ liệu mật độ cao (Dense Table), cột Cước phí căn lề phải, hỗ trợ Pagination và Sort Server-side.  
  * **Form / Modal Sinh Thẻ Batch:** Input bắt đầu, Input số lượng.  
* **2\. Tích hợp Dữ liệu (Data Binding):**

  * **REST API:** Các API GET có Query Params ?page=0\&size=50 (TanStack Query xử lý pre-fetching trang tiếp theo để click sang trang mượt mà).  
* **3\. Trải nghiệm người dùng & Luồng thao tác (User Flow & Interactions):**

  * **Sinh thẻ:** Nhập ID đầu (10001), SL (50) \-\> Bấm Tạo \-\> Modal loading \-\> Hoàn tất báo Toast xanh.  
  * **Export Data:** Bấm Xuất CSV, Client tự động map dữ liệu và ép separator là dấu ; để không bị vỡ cột trên Excel Tiếng Việt.  
* **4\. Xử lý ngoại lệ & Trạng thái UI (Edge Cases & UI States):**

  * **Error State:** Nếu tạo dải mã thẻ đè lên mã cũ (Conflict), API trả 409 \-\> Báo đỏ *"Lỗi: Dải mã thẻ từ \[A\] đến \[B\] đang bị trùng"*.  
  * **Action Restriction:** Ẩn nút "Khóa thẻ" nếu thẻ đang có cờ is\_inside \= true.

### **Màn hình 13: Ticket Center (Xử lý khiếu nại \- UC-MNG06, 08\)**

* **1\. Bố cục Layout & UI Components:**

  * **Master-Detail Split Pane:** Bên trái là List Ticket (Tự động sort Đỏ/CRITICAL lên đầu). Bên phải là Ticket Detail.  
  * **Action Panel:** Các nút "Tạm dừng tính phí", form "Lý do điều chỉnh", ô nhập "Phí thực thu".  
* **2\. Tích hợp Dữ liệu (Data Binding):**

  * **WebSocket (Zustand):** Lắng nghe kênh /topic/incidents/alerts.  
  * **REST API:** POST /api/v1/manager/parking-sessions/{sessionId}/pause và .../adjust.  
* **3\. Trải nghiệm người dùng & Luồng thao tác (User Flow & Interactions):**

  * Có Ticket mới \-\> Web phát tiếng "Bíp", Badge counter nhảy số.  
  * Click Ticket Sai phí \-\> Bấm "Tạm dừng tính phí" (Đóng băng giờ) \-\> Nhập tiền mới \-\> Nhập lý do \-\> Bấm "Xác nhận & Cấp lệnh ra".  
* **4\. Xử lý ngoại lệ & Trạng thái UI (Edge Cases & UI States):**

  * **Discount Breach State:** Nếu Quản lý nhập giảm giá \> 20%, Component Alert vàng hiện lên: *"Mức giảm vượt quá 20% thẩm quyền. Yêu cầu chuyển đến ADMIN"*, nút Submit chuyển chữ thành "Gửi yêu cầu phê duyệt".  
  * **Booking Override Lock:** Nếu Session thuộc về Đơn đặt chỗ (PRE\_PAID), Component Action Panel tự động mờ đi (Disabled).

## **PORTAL 4: SYSTEM ADMIN PORTAL (WEB DESKTOP)**

**Nguyên tắc chung:** Giao diện tối giản, kỹ thuật. Không màu mè. Rào chắn bảo mật 2 lớp (Bắt buộc dùng role SUPER\_ADMIN).

### **Màn hình 14: Quản lý Tài khoản Nội bộ (IAM \- UC-AD01)**

* **1\. Bố cục Layout & UI Components:**

  * **Data Table:** Hiển thị User (Email, Role, Trạng thái Active/Inactive).  
  * **Drawer Component:** Trượt từ mép phải màn hình ra để chứa Form Thêm mới/Edit User.  
* **2\. Tích hợp Dữ liệu (Data Binding):**

  * **REST API:** POST/PUT /api/v1/users (Dùng TanStack Query Mutation).  
* **3\. Trải nghiệm người dùng & Luồng thao tác (User Flow & Interactions):**

  * Mở Drawer \-\> Nhập Email, chọn Role Manager/Staff \-\> Bấm Lưu \-\> Toast xanh báo *"Mật khẩu tự sinh đã gửi qua Email"*.  
* **4\. Xử lý ngoại lệ & Trạng thái UI (Edge Cases & UI States):**

  * **Validation:** Trùng Email \-\> Báo đỏ ngay dưới Input Email.  
  * **Soft Delete Lock:** Nút "Xóa" không tồn tại. Thay bằng nút "Deactivate" màu cam. Khi click hiện Pop-up Confirm.

### **Màn hình 15: System Configs (API Keys & SMTP \- UC-AD02)**

* **1\. Bố cục Layout & UI Components:**

  * **Single Page with Grouped Cards:** 3 khối tách biệt (PayOS, VNPay, Google SMTP).  
  * **Masked Input Fields:** Ô nhập Password có nút hình con mắt (Toggle Visibility).  
  * **Status Badge:** Chấm màu Xanh/Đỏ báo trạng thái kết nối cạnh mỗi khối.  
* **2\. Tích hợp Dữ liệu (Data Binding):**

  * **REST API:** Gọi API Test ping sang Server, và PUT API để lưu cấu hình.  
* **3\. Trải nghiệm người dùng & Luồng thao tác (User Flow & Interactions):**

  * Nhập Key \-\> Bấm nút "Test Connection" riêng của khối đó \-\> Quay Spinner \-\> Trả kết quả xanh/đỏ.  
  * Chỉ khi tất cả các khối có thay đổi báo Xanh \-\> Nút "Lưu toàn bộ cấu hình" (Floating Bottom) mới sáng lên.  
* **4\. Xử lý ngoại lệ & Trạng thái UI (Edge Cases & UI States):**

  * **Timeout State:** Quá 5 giây Test không phản hồi \-\> Tự ngắt Spinner, báo lỗi đỏ *"Timeout \- Không thể kết nối tới đối tác"*.  
  * **Security State:** URL Webhook PayOS hiển thị ở dạng Read-only Text, bôi xám (Disabled) không cho phép sửa.

### **Màn hình 16: Audit Logs (Nhật ký Hệ thống \- UC-AD03)**

* **1\. Bố cục Layout & UI Components:**

  * **Top Filter Row:** Lọc theo Date, Role, Action Type.  
  * **Data Table:** Hiển thị Action, Timestamp, IP.  
  * **Diff Viewer Modal:** Pop-up khổng lồ chứa thư viện soi code JSON (vd: react-diff-viewer).  
* **2\. Tích hợp Dữ liệu (Data Binding):**

  * **REST API:** GET /api/v1/admin/audit-logs.  
* **3\. Trải nghiệm người dùng & Luồng thao tác (User Flow & Interactions):**

  * Lọc dữ liệu \-\> Click vào một dòng Log "Cập nhật bản đồ" \-\> Mở Modal Diff Viewer \-\> Xem JSON cũ (Đỏ/Gạch bỏ) và JSON mới (Xanh lá/Thêm mới).  
* **4\. Xử lý ngoại lệ & Trạng thái UI (Edge Cases & UI States):**

  * **Empty State:** Filter không có kết quả \-\> Icon hộp rỗng: *"Không tìm thấy nhật ký"*.  
  * **Immutable UI:** Hoàn toàn không có bất kỳ nút Update hay Delete nào trên toàn bộ màn hình này (Append-only UI).

## **PORTAL 5: HARDWARE MOCKING TOOL (WEB DESKTOP)**

**Nguyên tắc chung:** Đây là màn hình kỹ thuật dành cho Tester và Dev. Giao diện thô (Utilitarian), chạy độc lập, bỏ qua Header/Sidebar phức tạp.

### **Màn hình 17: Cổng Check-in / Check-out Mock**

* **1\. Bố cục Layout & UI Components:**

  * **Split Layout:** Chia màn hình làm 2 cột: \[Giả lập Cổng IN\] | \[Giả lập Cổng OUT\].  
  * **Mock Controls:** Input Biển số xe (Text), Slider Confidence Score (Từ 0.0 đến 1.0), Input Mã thẻ RFID.  
  * **Trigger Buttons:** Các nút bóp cò API (Ví dụ: *"Bắn API Camera"*, *"Bắn API Quẹt Thẻ"*).  
  * **Response Console:** Một khung nền đen giống Terminal (Terminal-like box) để hứng JSON Log trả về.  
* **2\. Tích hợp Dữ liệu (Data Binding):**

  * **REST API:** POST /api/v1/iot/cameras/scan, POST /api/v1/iot/rfid/read.  
  * **WebSocket:** Subscribe /topic/iot/gates/{gateId}/commands (Để xem Server có bắn lệnh "Mở Barrier" trả về không).  
* **3\. Trải nghiệm người dùng & Luồng thao tác (User Flow & Interactions):**

  * Gõ 51G-123.45, kéo Slider 0.98 \-\> Bấm "Bắn ảnh Camera".  
  * Khung Console Terminal nháy chữ màu Xanh lá báo HTTP 200 OK. Khung WebSocket nhận được lệnh OPEN\_BARRIER từ server.  
* **4\. Xử lý ngoại lệ & Trạng thái UI (Edge Cases & UI States):**

  * **Error State:** Nếu bắn API mà hệ thống từ chối (VD: Xe Blacklist), Console văng log chữ Đỏ.

### **Màn hình 18: Cảm biến Ô đỗ Mock (Sensor Grid)**

* **1\. Bố cục Layout & UI Components:**

  * **Grid Map Layout:** Render toàn bộ các ô đỗ của bãi xe thành các ô vuông đơn giản.  
  * **Clickable Slots:** Mỗi ô vuông đóng vai trò là một Toggle Button (Có xe / Không xe).  
* **2\. Tích hợp Dữ liệu (Data Binding):**

  * **REST API:** POST /api/v1/iot/sensors/update.  
* **3\. Trải nghiệm người dùng & Luồng thao tác (User Flow & Interactions):**

  * Click vào ô vuông A05 \-\> Ô chuyển thành màu Đỏ (Báo có xe đè lên cảm biến) \-\> API POST tự động bắn ngầm xuống Server với payload OCCUPIED.  
  * Click lại \-\> Chuyển màu Xanh \-\> Bắn payload EMPTY.  
* **4\. Xử lý ngoại lệ & Trạng thái UI (Edge Cases & UI States):**

  * **Debounce/Throttle State:** Ngăn chặn việc Tester click liên tục (Spam click). Component áp dụng hàm debounce (300ms). Chỉ khi dừng click mới bắt đầu bắn API cuối cùng xuống server để giả lập độ trễ vật lý của cảm biến thật.

# Thông tin hệ thống

## Những Điều Cần Làm Rõ Trên Hệ Thống Này:

1. **Yêu cầu ban đầu của dự án:**

Topic:  
Hệ thống quản lý tòa nhà gửi xe  
Parking Building Management System

Context:  
Tại các đô thị lớn, nhu cầu gửi xe tăng cao trong khi diện tích đỗ xe bị giới hạn. Tòa nhà gửi xe nhiều tầng là công trình chuyên dùng để tiếp nhận, lưu giữ và tổ chức xe ra/vào theo nhiều tầng hoặc khu vực đỗ khác nhau. Vì lưu lượng xe ra vào liên tục, cần có hệ thống phần mềm hỗ trợ quản lý vận hành bãi xe chính xác và hiệu quả. 

Problems:  
Nghiệp vụ tòa nhà gửi xe cần quản lý tốt các vấn đề như xe vào/ra, chỗ đỗ còn trống, vé gửi xe, phí gửi xe và các tình huống phát sinh như mất vé, quá hạn hoặc sai thông tin xe. Nếu quản lý thủ công, bãi xe dễ bị ùn ứ tại cổng, sai lệch dữ liệu, khó kiểm soát sức chứa và khó đối soát doanh thu.

Primary Actors:  
Parking Facility Manager  
Parking Staff  
Parking User / Driver  
System Administrator 

Functional Requirements:  
Parking Manager  
\- Quản lý thông tin tòa nhà gửi xe  
\- Quản lý loại phương tiện  
\- Quản lý phân tầng theo loại xe  
\- Quản lý slot đỗ xe và trạng thái slot: theo dõi slot còn trống, đang sử dụng, đã đặt trước, bảo trì hoặc tạm khóa  
\- Quản lý bảng giá, quy định chính sách tính phí gửi xe  
\- Xem báo cáo lượt xe vào/ra, doanh thu, tỷ lệ lấp đầy, khung giờ cao điểm theo từng loại phương tiện  
\- Các quản lý nâng cao khác như: theo dõi các trường hợp mất vé, sai biển số, quá giờ, gửi sai khu vực, xe chưa thanh toán (optional)

Parking Staff  
\- Hỗ trợ xử lý xe vào bãi: kiểm tra điều kiện xe vào bãi, nhập/quét biển số xe, hướng dẫn xe vào đúng tầng/khu vực theo loại phương tiện  
\- Tạo lượt gửi xe: Tạo parking session cho xe gửi theo lượt, ghi nhận thời gian vào, loại xe, cổng vào  
\- Hỗ trợ xử lý xe ra bãi: tìm lượt gửi xe, xác nhận thời gian ra, kiểm tra phí cần thanh toán, thu phí gửi xe,  
\- Hỗ trợ xử lý các trường hợp ngoại lệ: mất thẻ xe, sai thông tin xe, xe quá hạn gửi, xe gửi sai khu vực, cập nhật trạng thái slot.

Parking User / Driver  
\- Xem thông tin bãi xe: thời gian hoạt động, loại xe được phục vụ, bảng giá và quy định gửi xe, số slot trống  
\- Gửi xe theo lượt: nhận thẻ xe/mã gửi xe khi vào bãi và thanh toán phí khi ra  
\- Đặt chỗ trước: đặt chỗ theo loại phương tiện, thời gian gửi và khu vực còn trống nếu hệ thống hỗ trợ  
\- Theo dõi lượt gửi xe: xem thông tin lượt gửi xe hiện tại: giờ vào, loại xe, khu vực gửi, phí tạm tính  
\- Thanh toán phí gửi xe và dịch vụ bổ sung nếu có  
\- Gửi phản hồi về mất thẻ xe, sai phí, khó tìm xe, slot bị chiếm hoặc vấn đề trong bãi xe (optional)

System Administrator  
\- Quản lý tài khoản người dùng  
\- Phân quyền  
\- Quản lý cấu hình hệ thống

Main flow:  
1\. Luồng xử lý xe vào tòa nhà để gửi/đỗ theo lượt  
2\. Luồng xử lý xe ra, kết thúc lượt gửi và thanh toán theo lượt  
3\. Luồng tạo, quản lý các khu vực, tầng đỗ (slot đỗ nếu có) cho các phương tiện  
4\. Luồng quản lý, cấu hình và quy định chi phí đỗ xe theo phương tiện, theo các loại vé lượt, vé tháng  
5\. Luồng xử lý đăng ký và gửi/đỗ xe theo các trường hợp đặc biệt: vé tháng, đặt chỗ trước,… (optional)  
6\. Luồng xử lý mất thẻ gửi xe (optional)

2. **Giao diện quản lý (Desktop Web):** Dành cho Parking Manager, Staff và Admin thao tác tại văn phòng hoặc bốt trực, tối ưu cho màn hình máy tính để xử lý luồng dữ liệu lớn.  
3. **Giao diện người dùng (Mobile Web):** Dành cho Driver/Parking User truy cập qua trình duyệt điện thoại để đặt chỗ, thanh toán và xem trạng thái mà không cần cài đặt App.  
4. **Giả lập phần cứng (Hardware Mocking):** Toàn bộ tín hiệu phần cứng (camera nhận diện biển số, barrier, thiết bị đọc thẻ) được giả lập bằng một Tool đẩy API độc lập.  
5. **Hệ thống này phục vụ cho một bãi xe duy nhất và manager chính là ông chủ**  
6. **Hệ thống sẽ chấp nhận thanh toán tiền mặt và qua QR (PayOS) ở cổng ra và đặt trước chỗ sẽ cho phép thanh toán bằng QR (PayOS) và VNPay, ngoài ra không còn bất kỳ phương thức thanh toán nào khác như momo.**  
7. 