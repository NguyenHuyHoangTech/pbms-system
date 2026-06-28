# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkin-automated.spec.ts >> Automated Check-in Flow with Map Visualization >> Staff opens shift, IoT checks in, Staff approves, IoT sets slot, Staff sees on map
- Location: tests\checkin-automated.spec.ts:6:7

# Error details

```
Test timeout of 120000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - strong [ref=e8]: PBMS Manager
        - img "menu-fold" [ref=e10] [cursor=pointer]:
          - img [ref=e11]
      - menu [ref=e14]:
        - menuitem "dashboard Doanh Thu" [ref=e15] [cursor=pointer]:
          - img "dashboard" [ref=e16]:
            - img [ref=e17]
          - generic [ref=e19]: Doanh Thu
        - menuitem "dashboard Vận Hành" [ref=e20] [cursor=pointer]:
          - img "dashboard" [ref=e21]:
            - img [ref=e22]
          - generic [ref=e24]: Vận Hành
        - menuitem "dollar Doanh Thu Ca Trực" [ref=e25] [cursor=pointer]:
          - img "dollar" [ref=e26]:
            - img [ref=e27]
          - generic [ref=e29]: Doanh Thu Ca Trực
        - menuitem "node-index Điều Phối Tuyến" [ref=e30] [cursor=pointer]:
          - img "node-index" [ref=e31]:
            - img [ref=e32]
          - generic [ref=e34]: Điều Phối Tuyến
        - menuitem "schedule Quản Lý Đặt Trước" [ref=e35] [cursor=pointer]:
          - img "schedule" [ref=e36]:
            - img [ref=e37]
          - generic [ref=e39]: Quản Lý Đặt Trước
        - menuitem "block Sơ Đồ Bãi Đỗ" [ref=e40] [cursor=pointer]:
          - img "block" [ref=e41]:
            - img [ref=e42]
          - generic [ref=e44]: Sơ Đồ Bãi Đỗ
        - menuitem "car Loại Phương Tiện" [ref=e45] [cursor=pointer]:
          - img "car" [ref=e46]:
            - img [ref=e47]
          - generic [ref=e49]: Loại Phương Tiện
        - menuitem "dollar Cấu Hình Giá" [ref=e50] [cursor=pointer]:
          - img "dollar" [ref=e51]:
            - img [ref=e52]
          - generic [ref=e54]: Cấu Hình Giá
        - menuitem "dollar Quản Lý Hoàn Tiền" [ref=e55] [cursor=pointer]:
          - img "dollar" [ref=e56]:
            - img [ref=e57]
          - generic [ref=e59]: Quản Lý Hoàn Tiền
        - menuitem "idcard Vé Tháng" [ref=e60] [cursor=pointer]:
          - img "idcard" [ref=e61]:
            - img [ref=e62]
          - generic [ref=e64]: Vé Tháng
        - menuitem "bank Hồ Sơ Tòa Nhà" [ref=e65] [cursor=pointer]:
          - img "bank" [ref=e66]:
            - img [ref=e67]
          - generic [ref=e69]: Hồ Sơ Tòa Nhà
        - menuitem "credit-card Kho Thẻ (RFID)" [ref=e70] [cursor=pointer]:
          - img "credit-card" [ref=e71]:
            - img [ref=e72]
          - generic [ref=e74]: Kho Thẻ (RFID)
        - menuitem "customer-service Trung Tâm Xử Lý" [ref=e75] [cursor=pointer]:
          - img "customer-service" [ref=e76]:
            - img [ref=e77]
          - generic [ref=e79]: Trung Tâm Xử Lý
        - menuitem "warning Quản Lý Sự Cố" [ref=e80] [cursor=pointer]:
          - img "warning" [ref=e81]:
            - img [ref=e82]
          - generic [ref=e84]: Quản Lý Sự Cố
      - generic [ref=e86] [cursor=pointer]:
        - img "user" [ref=e88]:
          - img [ref=e89]
        - generic [ref=e91]:
          - strong [ref=e93]: Manager
          - generic [ref=e94]: Quản lý
  - generic [ref=e95]:
    - banner [ref=e96]:
      - generic [ref=e97]:
        - img "clock-circle" [ref=e98]:
          - img [ref=e99]
        - strong [ref=e103]: 16:18:24
        - generic [ref=e104]: 29/06/2026
    - main [ref=e105]:
      - generic [ref=e107]:
        - generic [ref=e108]:
          - heading "Building Profile Settings" [level=1] [ref=e109]
          - generic [ref=e110]:
            - generic [ref=e111]: "WS: Connected"
            - button "Logout" [ref=e112]
        - generic [ref=e113]:
          - generic [ref=e114]:
            - generic [ref=e115]:
              - generic [ref=e116]: Building Name
              - textbox [ref=e117]: Bai Do Xe Thong Minh
            - generic [ref=e118]:
              - generic [ref=e119]: Address
              - textbox [ref=e120]: Khu cong nghe cao, Quan 9, TP.HCM
            - generic [ref=e121]:
              - generic [ref=e122]: Hotline
              - textbox [ref=e123]: "0123456789"
            - generic [ref=e124]:
              - generic [ref=e125]: Operating Hours
              - textbox [ref=e126]: 06:00 - 22:00
            - generic [ref=e127]:
              - generic [ref=e128]: Building Rules
              - textbox [ref=e129]: Tuan thu toc do 5km/h
          - button "Save Changes" [ref=e131]
```